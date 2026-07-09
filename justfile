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

# Regenerate the v86 WASM emulator's 9p filesystem from Markdown (issue #37).
# Writes public/emulator/v86/fs.json and public/emulator/v86/fs/. No Docker needed.
v86-fs:
    node scripts/gen-v86-fs.mjs

# Boot the v86 emulator headless and verify the content mounts at /mnt (issue #37).
v86-smoke:
    node scripts/v86-smoke.mjs

# Serve the built site from the self-host container (see issue #38).
serve:
    @echo "TODO(#38): run the self-host container (Astro build -> nginx/caddy)."
