# Self-host container for the modernized site (issue #38).
#
# Optional backup/experiment host for the DeskPi rack — production stays on
# GitHub Pages (#30). Multi-stage: build the static Astro site with Node, then
# serve the plain `dist/` output with Caddy (clean URLs + gzip, no Node runtime).
#
# The emulator's Buildroot binaries (~24 MB) are not committed to git; they are
# pulled from the public `emulator-image` release at build time (no auth needed
# because the repo is public). Override V86_IMAGE_REPO / V86_IMAGE_TAG to build
# from a fork or a different release.
#
#   docker build -t djensenius-website .
#   docker run --rm -p 8080:80 djensenius-website   # http://localhost:8080

# ---- Stage 1: build the static site -----------------------------------------
FROM node:26-slim AS build

# SITE_URL/BASE_PATH feed Astro's `site`/`base`. Defaults suit a root-served
# self-host; the GitHub Pages deploy passes its own values.
ARG SITE_URL=https://jensenius.com
ARG BASE_PATH=/
ARG V86_IMAGE_REPO=djensenius/website
ARG V86_IMAGE_TAG=emulator-image
ENV SITE_URL=${SITE_URL} \
    BASE_PATH=${BASE_PATH}

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies against the lockfile first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Bring in the rest of the source and build.
COPY . .

# Fetch the uncommitted emulator kernel/initrd from the public release so the
# terminal actually boots in the served site.
RUN base="https://github.com/${V86_IMAGE_REPO}/releases/download/${V86_IMAGE_TAG}" \
    && mkdir -p public/emulator/v86 \
    && for f in buildroot-bzimage.bin buildroot-initrd.bin; do \
         echo "==> Fetching ${f}"; \
         curl -fsSL "${base}/${f}" -o "public/emulator/v86/${f}"; \
         test -s "public/emulator/v86/${f}"; \
       done

RUN npm run build

# ---- Stage 2: serve the static output ---------------------------------------
FROM caddy:2-alpine AS runtime

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

EXPOSE 80
