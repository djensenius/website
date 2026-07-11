# justfile — task hub for the website.
# Run `just` to list recipes. Requires: mise, node (via mise).
# Docker is only needed for the image/serve recipes (WIP).

set shell := ["bash", "-cu"]

# Show available recipes.
default:
    @just --list

# Install dependencies (reproducible, matches CI).
install:
    npm ci

# Run the full site locally (Astro dev server + islands) with live reload.
dev:
    npm run dev

# Build the production static site.
build:
    npm run build

# Preview the production build locally.
preview:
    npm run preview

# Format, lint, and type-check (Vite+ then Astro's type checker).
check:
    npm run check
    npm run astro:check

# Check formatting without writing (CI); use `fmt` to auto-format.
fmt-check:
    npx vp fmt --check

# Type-check only (Astro's checker).
type-check:
    npm run astro:check

# Lint only.
lint:
    npm run lint

# Format only.
fmt:
    npm run fmt

# Run tests.
test:
    npm test

# Build the bootable disk image from Markdown (Dockerized — see issue #33).
# Regenerates public/emulator/root.bin from src/content. Requires Docker.
image:
    ./scripts/build-image.sh

# Rebuild the v86 in-browser Linux image (Buildroot glibc + busybox/vim/bat,
# djensenius-themed login). Writes public/emulator/v86/buildroot-bzimage.bin
# and buildroot-initrd.bin.
# Long, Dockerized build; the Buildroot tree is cached under build/v86-image.
# In CI this runs in the build-v86-image workflow, which publishes the result
# to the rolling `emulator-image` release (see v86-fetch).
v86-image:
    ./scripts/build-v86-image.sh

# Fetch the prebuilt v86 image (bzimage + initrd) from the `emulator-image`
# release into public/emulator/v86/. These binaries are not committed to git;
# run this once after cloning (or after a fresh checkout) to get a bootable
# emulator locally. Requires the `gh` CLI.
v86-fetch:
    ./scripts/fetch-v86-image.sh

# Reflow hard-wrapped Markdown content into single logical lines so the emulator
# terminal (bat/less) soft-wraps cleanly at any width. Run after editing content.
reflow-md:
    node scripts/reflow-md.mjs src/content/pages/*.md src/content/projects/*.md

# Regenerate the social-share (Open Graph) image from scripts/og-image.svg into
# public/og.png. Requires rsvg-convert (librsvg).
og-image:
    rsvg-convert -w 1200 -h 630 scripts/og-image.svg -o public/og.png

# Regenerate the v86 WASM emulator's 9p filesystem from Markdown (issue #37).
# Writes public/emulator/v86/fs.json and public/emulator/v86/fs/. No Docker needed.
v86-fs:
    node scripts/gen-v86-fs.mjs

# Boot the v86 emulator headless and verify the content mounts at /mnt (issue #37).
v86-smoke:
    node scripts/v86-smoke.mjs

# Build and run the optional self-host container (issue #38): builds the static
# Astro site and serves dist/ with Caddy at http://localhost:8080. Production
# stays on GitHub Pages; this is a rack backup/experiment. Requires Docker.
serve:
    docker compose up --build
