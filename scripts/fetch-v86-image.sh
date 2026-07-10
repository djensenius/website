#!/usr/bin/env bash
# Fetch the prebuilt v86 Buildroot image (bzimage + initrd) into
# public/emulator/v86/ from the rolling `emulator-image` GitHub prerelease.
#
# These two binaries (~24 MB) are NOT committed to git; they are built by the
# build-v86-image workflow whenever scripts/v86-image/** changes and published
# as assets on the `emulator-image` release. CI, the Pages deploy, and local
# dev all pull them with this script instead of storing them in history.
#
# Usage: ./scripts/fetch-v86-image.sh   (or `just v86-fetch`)
# Requires the `gh` CLI, authenticated (GH_TOKEN / gh auth) with contents:read.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

tag="${V86_IMAGE_TAG:-emulator-image}"
dest="public/emulator/v86"

mkdir -p "$dest"
echo "==> Downloading emulator image assets from release '${tag}'"
gh release download "$tag" \
  --pattern 'buildroot-bzimage.bin' \
  --pattern 'buildroot-initrd.bin' \
  --dir "$dest" \
  --clobber

for f in buildroot-bzimage.bin buildroot-initrd.bin; do
  if [[ ! -s "${dest}/${f}" ]]; then
    echo "error: ${dest}/${f} missing or empty after download" >&2
    exit 1
  fi
  echo "==> ${dest}/${f} ($(du -h "${dest}/${f}" | cut -f1))"
done
