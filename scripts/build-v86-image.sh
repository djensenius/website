#!/usr/bin/env bash
# Host wrapper: build the v86 in-browser Linux image reproducibly in Docker.
#
# Produces public/emulator/v86/{buildroot-bzimage.bin,buildroot-initrd.bin} — a
# Linux 6.6 (non-SMP) bzImage plus a Buildroot glibc userland initrd carrying
# busybox, vim and bat, a djensenius-themed login (hostname/prompt/aliases/MOTD)
# and the 9p site content copied into the home directory on login.
#
# The heavy Buildroot tree and download cache are kept under build/v86-image so
# repeat builds are incremental. Requires Docker. Usage:
#   ./scripts/build-v86-image.sh          # build + install the image
#   CLEAN_TARGET=1 ./scripts/build-v86-image.sh # wipe target/staging first so
#                                               # disabled packages leave the rootfs
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

src_dir="scripts/v86-image"
work_dir="build/v86-image"
dl_dir="${work_dir}/dl"
out_dir="${work_dir}/out"
dest="public/emulator/v86/buildroot-bzimage.bin"
initrd_dest="public/emulator/v86/buildroot-initrd.bin"
image_tag="djensenius-v86-image-builder"
# The Buildroot tree is built inside this Docker named volume (native ext4).
# It MUST NOT be a macOS bind mount: glibc's stamp.os dependency tracking breaks
# on OrbStack/virtiofs mtime semantics ("No rule to make target .../stamp.os").
work_volume="djensenius-v86-buildroot-work"

mkdir -p "$work_dir" "$dl_dir" "$out_dir"
docker volume create "$work_volume" >/dev/null

echo "==> Building Docker builder image"
docker build \
  --build-arg "UID=$(id -u)" \
  --build-arg "GID=$(id -g)" \
  -t "$image_tag" \
  "$src_dir"

echo "==> Running Buildroot build (tree in volume ${work_volume}, dl cache in ${dl_dir})"
# Docker initialises named volumes as root:root; hand it to the unprivileged
# builder uid/gid so the in-container build (which must not run as root) can write.
docker run --rm -u 0:0 --entrypoint chown -v "${work_volume}:/work" "$image_tag" \
  -R "$(id -u):$(id -g)" /work
docker run --rm \
  -e "CLEAN_TARGET=${CLEAN_TARGET:-0}" \
  -e "BR_VERSION=${BR_VERSION:-}" \
  -v "${repo_root}/${src_dir}:/src:ro" \
  -v "${work_volume}:/work" \
  -v "${repo_root}/${dl_dir}:/dl" \
  -v "${repo_root}/${out_dir}:/out" \
  "$image_tag"

if [[ ! -f "${out_dir}/buildroot-bzimage.bin" || ! -f "${out_dir}/buildroot-initrd.bin" ]]; then
  echo "error: build produced no image" >&2
  exit 1
fi

cp "${out_dir}/buildroot-bzimage.bin" "$dest"
cp "${out_dir}/buildroot-initrd.bin" "$initrd_dest"
echo "==> Installed $dest ($(du -h "$dest" | cut -f1))"
echo "==> Installed $initrd_dest ($(du -h "$initrd_dest" | cut -f1))"
echo "==> Next: 'just v86-smoke' to verify boot + 9p mount, then test at :4321"
