#!/usr/bin/env bash
# Build the bootable emulator disk image from Markdown (issue #33).
#
# Markdown is the single source of truth. This script:
#   1. Regenerates the plain-text content tree from src/content (Node).
#   2. Copies the pristine base rootfs image (root.bin) and, inside a Docker
#      container with e2tools, replaces the /root content with the freshly
#      generated files — preserving the working BusyBox OS and the exact ext2
#      format the emulator boots.
#   3. Writes the result to public/emulator/root.bin so Astro serves it.
#
# Editing ext2 without a privileged loop mount keeps this runnable in CI and on
# developer machines. Requires: Docker, Node (via mise).
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# Resolve a path to an absolute one so BASE_IMAGE/OUT_IMAGE overrides may be
# either relative (to the repo root) or absolute.
abspath() { case "$1" in /*) printf '%s' "$1" ;; *) printf '%s/%s' "$repo_root" "$1" ;; esac; }

base_image="${BASE_IMAGE:-root.bin}"
out_image="${OUT_IMAGE:-public/emulator/root.bin}"
out_dir="$(dirname "$out_image")"
out_name="$(basename "$out_image")"
staging="build/emulator-root"

# Pin the builder image by digest and the e2tools package version so the same
# commit keeps producing the same disk image over time.
builder="alpine@sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc"
e2tools_version="0.1.0-r2"

base_abs="$(abspath "$base_image")"
out_dir_abs="$(abspath "$out_dir")"
staging_abs="$(abspath "$staging")"

if [[ ! -f "$base_abs" ]]; then
  echo "error: base image '$base_image' not found" >&2
  exit 1
fi

echo "==> Generating content text from Markdown"
node scripts/gen-emulator-content.mjs "$staging"

echo "==> Injecting content into a copy of $base_image"
mkdir -p "$out_dir_abs"

docker run --rm \
  -e OUT_NAME="$out_name" \
  -e E2TOOLS_VERSION="$e2tools_version" \
  -v "$base_abs:/base.bin:ro" \
  -v "$staging_abs:/content:ro" \
  -v "$out_dir_abs:/out" \
  "$builder" sh -euc '
    apk add --no-progress -q "e2tools=$E2TOOLS_VERSION" >/dev/null
    img="/out/$OUT_NAME"
    cp /base.bin "$img"

    # Remove the legacy /root content so stale files never linger. Directories
    # (code, projects) already exist in the base image and are reused.
    for f in $(e2ls "$img:/root" 2>/dev/null | tr -s " " "\n" | grep -vE "^$|^\.\.?$|^code$|^projects$"); do
      e2rm "$img:/root/$f" 2>/dev/null || true
    done
    for dir in code projects; do
      for f in $(e2ls "$img:/root/$dir" 2>/dev/null | tr -s " " "\n" | grep -vE "^$|^\.\.?$"); do
        e2rm "$img:/root/$dir/$f" 2>/dev/null || true
      done
    done

    # Copy the freshly generated tree back in, sorted for reproducible order.
    cd /content
    find . -type f | sed "s|^\./||" | sort | while read -r rel; do
      dir=$(dirname "$rel")
      [ "$dir" != "." ] && e2mkdir "$img:/root/$dir" 2>/dev/null || true
      e2cp "$rel" "$img:/root/$rel"
    done

    echo "==> Resulting /root:"
    e2ls -l "$img:/root"
  '

echo "==> Wrote $out_image ($(du -h "$out_image" | cut -f1))"
