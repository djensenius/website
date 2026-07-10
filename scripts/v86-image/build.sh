#!/usr/bin/env bash
# Build the v86 in-browser Linux image (a bzImage kernel plus a separate gzipped
# cpio initrd rootfs). Runs INSIDE the Docker container defined by
# the sibling Dockerfile; see scripts/build-v86-image.sh for the host wrapper.
#
# Layout (mounted by the wrapper):
#   /src   -> scripts/v86-image        (base.config, config.fragment, board/, this)
#   /work  -> Docker named volume      (Buildroot tree + build; MUST be a native
#                                        ext4 volume, NOT a macOS bind mount —
#                                        glibc's stamp.os tracking breaks on the
#                                        OrbStack/virtiofs mtime semantics)
#   /dl    -> build/v86-image/dl       (persistent download cache; bind mount is
#                                        fine here — tarballs are mtime-insensitive)
#   /out   -> build/v86-image/out      (bzImage lands here)
set -euo pipefail

# Buildroot version. NOTE: base.config's header reads "2024.02.5" because that
# is the release its defconfig was captured under, but we build against
# 2024.02.10 on purpose — it is the first 2024.02 patch release that ships the
# `bat` package we enable. The two are defconfig-compatible (`make olddefconfig`
# reconciles them), so the mismatch in the header is expected, not drift.
BR_VERSION="${BR_VERSION:-2024.02.10}"
BR_URL="https://buildroot.org/downloads/buildroot-${BR_VERSION}.tar.gz"

src=/src
work=/work
out=/out
br="${work}/buildroot-${BR_VERSION}"
dl="${DL_DIR:-/dl}"      # persistent Buildroot download cache (bind mount)

mkdir -p "$work" "$out" "$dl"

echo "==> Buildroot ${BR_VERSION}"
if [[ ! -d "$br" ]]; then
  echo "==> Downloading ${BR_URL}"
  tmp="${work}/buildroot.tar.gz"
  wget -q -O "$tmp" "$BR_URL"
  tar -xzf "$tmp" -C "$work"
  rm -f "$tmp"
fi

echo "==> Installing board files + config"
# Board files must live under the Buildroot tree so the relative paths baked into
# the config (rootfs_overlay, linux.conf) resolve against CONFIG_DIR.
rm -rf "${br}/board/browser_linux"
mkdir -p "${br}/board/browser_linux"
cp -a "${src}/board/browser_linux/." "${br}/board/browser_linux/"

# Merge the pinned base config with our override fragment, then normalise.
"${br}/support/kconfig/merge_config.sh" -m -O "$br" \
  "${src}/base.config" "${src}/config.fragment" >/dev/null

# Point Buildroot at the persistent download cache so re-runs are fast. Ccache is
# intentionally left OFF: on this cross toolchain it wrapped the host compiler and
# produced spurious "no include path for stdc-predef.h" failures. Parallelism is
# safe now that the tree lives on a native volume (not a virtiofs bind mount).
{
  echo "BR2_DL_DIR=\"${dl}\""
  echo "BR2_JLEVEL=$(nproc)"
} >> "${br}/.config"

cd "$br"
make olddefconfig

# Buildroot never deletes files from output/target when a package is *disabled*,
# so a package removed from the config (e.g. eza) lingers in the rootfs on an
# incremental build. Set CLEAN_TARGET=1 to wipe the staging/target/images trees
# and let `make` reinstall only the still-enabled packages (fast — no recompile).
if [[ "${CLEAN_TARGET:-0}" == "1" ]]; then
  echo "==> CLEAN_TARGET=1: wiping output/{target,staging,images} for a clean rootfs"
  rm -rf output/target output/staging output/images
  find output/build -name .stamp_target_installed -delete
  find output/build -name .stamp_staging_installed -delete
fi

echo "==> Building (this takes a while — glibc toolchain + Rust bat)…"
make

# Buildroot tracks per-package build stamps, not the mtime of the custom kernel
# config file, so an edit to board/browser_linux/linux.conf is invisible to a
# plain `make` once the kernel has been built once. Force the kernel to
# reconfigure + rebuild (this re-applies linux.conf and regenerates the rootfs)
# so config changes reliably land in the image on incremental rebuilds. It's a
# no-op-ish few minutes on a fresh tree and the only way to pick up edits after.
echo "==> Reconfiguring + rebuilding kernel so linux.conf edits take effect…"
make linux-reconfigure

img="${br}/output/images/bzImage"
initrd="${br}/output/images/rootfs.cpio.gz"
if [[ ! -f "$img" ]]; then
  echo "error: expected kernel not found at ${img}" >&2
  ls -la "${br}/output/images" || true
  exit 1
fi
if [[ ! -f "$initrd" ]]; then
  echo "error: expected initrd not found at ${initrd}" >&2
  ls -la "${br}/output/images" || true
  exit 1
fi

cp "$img" "${out}/buildroot-bzimage.bin"
cp "$initrd" "${out}/buildroot-initrd.bin"
echo "==> Wrote ${out}/buildroot-bzimage.bin ($(du -h "${out}/buildroot-bzimage.bin" | cut -f1))"
echo "==> Wrote ${out}/buildroot-initrd.bin ($(du -h "${out}/buildroot-initrd.bin" | cut -f1))"
