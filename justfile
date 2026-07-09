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
image:
    @echo "TODO(#33): generate the emulator disk image from Markdown via Docker."

# Serve the built site from the self-host container (see issue #38).
serve:
    @echo "TODO(#38): run the self-host container (Astro build -> nginx/caddy)."
