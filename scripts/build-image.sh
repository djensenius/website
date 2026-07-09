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

base_image="${BASE_IMAGE:-root.bin}"
out_image="${OUT_IMAGE:-public/emulator/root.bin}"
staging="build/emulator-root"

if [[ ! -f "$base_image" ]]; then
  echo "error: base image '$base_image' not found" >&2
  exit 1
fi

echo "==> Generating content text from Markdown"
node scripts/gen-emulator-content.mjs "$staging"

echo "==> Injecting content into a copy of $base_image"
mkdir -p "$(dirname "$out_image")"

docker run --rm \
  -v "$repo_root/$base_image:/base.bin:ro" \
  -v "$repo_root/$staging:/content:ro" \
  -v "$repo_root/$(dirname "$out_image"):/out" \
  alpine:3.20 sh -euc '
    apk add --no-progress -q e2tools >/dev/null
    cp /base.bin /out/root.bin
    img=/out/root.bin

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

    # Copy the freshly generated tree back in.
    cd /content
    find . -type f | sed "s|^\./||" | while read -r rel; do
      dir=$(dirname "$rel")
      [ "$dir" != "." ] && e2mkdir "$img:/root/$dir" 2>/dev/null || true
      e2cp "$rel" "$img:/root/$rel"
    done

    echo "==> Resulting /root:"
    e2ls -l "$img:/root"
  '

echo "==> Wrote $out_image ($(du -h "$out_image" | cut -f1))"
