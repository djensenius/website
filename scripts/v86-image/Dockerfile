# Reproducible build environment for the v86 in-browser Linux image.
# Buildroot refuses to run as root, so we build as an unprivileged user.
FROM debian:bookworm-slim

# Buildroot + Linux kernel + host-rust (for bat/eza) build dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends \
      bash bc binutils bison build-essential bzip2 ca-certificates cpio \
      file flex g++ gawk gcc git gzip libelf-dev libncurses-dev libssl-dev \
      make patch perl python3 rsync sed tar unzip wget which xz-utils lz4 \
    && rm -rf /var/lib/apt/lists/*

ARG UID=1000
ARG GID=1000
# The host GID may already exist in Debian (e.g. macOS staff=20 == dialout).
# Reuse it if so, otherwise create it; then create the build user.
RUN if ! getent group "${GID}" >/dev/null; then groupadd -g "${GID}" builder; fi \
    && useradd -m -u "${UID}" -g "${GID}" -s /bin/bash builder

USER builder
WORKDIR /home/builder
ENTRYPOINT ["/bin/bash", "/src/build.sh"]
