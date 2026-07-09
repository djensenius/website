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
just image      # build the emulator disk image from Markdown (Dockerized, #33)
just serve      # run the self-host container — WIP (#38)
```

## Emulator disk image

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
in the repo and are being ported to Markdown under `src/content/`. The emulator is being
modernized to a WASM-based build (see #37).
