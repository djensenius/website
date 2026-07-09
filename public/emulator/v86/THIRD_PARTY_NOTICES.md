# Third-party notices — v86 emulator assets

The files in this directory are prebuilt third-party binaries, redistributed here
so the in-browser emulator works offline. They are not products of this repository.
Each is listed below with its upstream project, license, and source pointer.

| File | Component | License | Source |
| --- | --- | --- | --- |
| `v86.wasm`, `libv86.mjs` | [v86](https://github.com/copy/v86) — x86 emulator | BSD-2-Clause (see `V86-LICENSE`) | https://github.com/copy/v86 (npm package `v86`) |
| `bios/seabios.bin` | [SeaBIOS](https://www.seabios.org/) | LGPL-3.0-or-later | https://github.com/coreboot/seabios — redistributed via https://github.com/copy/v86/tree/master/bios |
| `bios/vgabios.bin` | Bochs/LGPL VGABIOS | LGPL-2.1-or-later | https://github.com/copy/v86/tree/master/bios (`COPYING.LESSER`) |
| `buildroot-bzimage.bin` | Linux kernel 5.6.x + [Buildroot](https://buildroot.org/) userland | GPL-2.0 (kernel) + per-package licenses (buildroot) | Built by v86: https://github.com/copy/v86 (`tools/docker/buildroot`); kernel source: https://www.kernel.org/ |

## License texts

- **v86** — `V86-LICENSE` in this directory.
- **SeaBIOS** — LGPL-3.0: https://www.gnu.org/licenses/lgpl-3.0.html
- **VGABIOS** — LGPL-2.1: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
- **Linux kernel** — GPL-2.0: https://www.kernel.org/doc/html/latest/process/license-rules.html
- **Buildroot** — per-package; overview: https://buildroot.org/downloads/manual/manual.html#legal-info

### Source availability (GPL/LGPL)

The BIOS and kernel binaries are unmodified upstream builds redistributed by the
v86 project. Their complete corresponding source is available from the upstream
links above (SeaBIOS, kernel.org, Buildroot) and from the v86 repository, which
contains the build tooling used to produce `buildroot-bzimage.bin`.
