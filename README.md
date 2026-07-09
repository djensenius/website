# Website

David Jensenius — personal site. A WASM Linux environment (the signature terminal
experience) plus a modern, Markdown-driven file-navigation view. Content is authored as
Markdown and compiled into the emulator's disk image at build time.

See the [modernization epic (#14)](https://github.com/djensenius/website/issues/14) for
the full plan and roadmap.

## Stack

- **[Astro](https://astro.build/)** — static site, content collections, routing, RSS, SEO.
- **[Vite+](https://viteplus.dev/) (`vp`)** — unified toolchain (lint, format, test,
  type-check). Astro runs on the Vite+ core via a `vite` override.
- **[mise](https://mise.jdx.dev/)** — pins Node and loads `.env`.
- **[just](https://just.systems/)** — task hub (`just <recipe>`).

## Getting started

Prerequisites: [mise](https://mise.jdx.dev/) and [just](https://just.systems/)
(and Docker later, for disk-image tasks).

```bash
git clone --recursive git@github.com:djensenius/website
cd website
mise install             # installs the pinned Node version
cp .env.example .env     # optional local overrides
just install             # install dependencies
just dev                 # run the site locally with live reload
```

## Common tasks

```bash
just            # list all recipes
just dev        # start the dev server
just build      # build the production static site
just preview    # preview the production build
just check      # format + lint + type-check (Vite+ and astro check)
just image      # build the legacy emulator disk image from Markdown (Dockerized, #33)
just v86-fs     # regenerate the v86 WASM emulator filesystem from Markdown (#37)
just v86-smoke  # boot the v86 emulator headless and verify content mounts (#37)
just serve      # run the self-host container — WIP (#38)
```

## WASM emulator (v86)

The modern in-browser emulator ([v86](https://github.com/copy/v86)) boots a tiny buildroot
Linux entirely in WebAssembly and mounts the site content at `/mnt`. It lives at the
`/emulator` route and replaces the legacy jslinux build.

Content is generated from Markdown into v86's JSON/HTTP 9p filesystem format:

1. `scripts/gen-v86-fs.mjs` reuses `buildContentTree()` (the same Markdown rendering path as
   the disk image) and emits `public/emulator/v86/fs.json` plus a content-addressed
   `public/emulator/v86/fs/<hash>.bin` body store.
2. The page (`src/pages/emulator/index.astro`) loads the committed v86 runtime
   (`v86.wasm`, `libv86.mjs`), SeaBIOS, and the `buildroot-bzimage.bin` kernel, then mounts
   the 9p filesystem so the visitor lands in their files at `/mnt`.

The runtime and kernel binaries under `public/emulator/v86/` are committed (they can't be
regenerated from Markdown). Re-run `just v86-fs` and commit `fs.json` + `fs/` after editing
content. `just v86-smoke` boots the emulator headless (Node) and asserts the content mounts.

## Emulator disk image (legacy format)

`just image` regenerates the emulator's bootable disk image from the Markdown content,
replacing the old manual `sudo mount -o loop` editing. The build:

1. `scripts/gen-emulator-content.mjs` strips frontmatter from `src/content/**` and writes a
   plain-text tree (`bio.txt`, `projects/<id>.txt`, `code/repos.txt`, …).
2. `scripts/build-image.sh` copies the pristine base rootfs (`root.bin`) and, inside a
   Docker container with `e2tools`, swaps in the freshly generated `/root` content — no
   privileged loop mount required — writing `public/emulator/root.bin`.

Markdown stays the single source of truth for both the file-navigation view and the
emulator. Re-run `just image` and commit `public/emulator/root.bin` after editing content.

## Legacy

The original site ran a jslinux emulator booting `root.bin` (an ext2 image edited via
`sudo mount -o loop`). During migration, the legacy `root/` content and `root.bin` remain
in the repo and are being ported to Markdown under `src/content/`. The emulator has been
modernized to a WASM-based build (v86, see above and #37); the `jslinux-mobile` submodule is
kept as reference until the final cleanup.
