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
just image      # build the emulator disk image (Dockerized) — WIP (#33)
just serve      # run the self-host container — WIP (#38)
```

## Legacy

The original site ran a jslinux emulator booting `root.bin` (an ext2 image edited via
`sudo mount -o loop`). During migration, the legacy `root/` content and `root.bin` remain
in the repo and are being ported to Markdown under `src/content/`. The emulator is being
modernized to a WASM-based build (see #37).
