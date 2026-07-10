import { V86 } from '../public/emulator/v86/libv86.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'emulator', 'v86');
const url = (p) => join(dir, p);

const emulator = new V86({
  wasm_path: url('v86.wasm'),
  memory_size: 256 * 1024 * 1024,
  vga_memory_size: 2 * 1024 * 1024,
  bios: { url: url('bios/seabios.bin') },
  vga_bios: { url: url('bios/vgabios.bin') },
  bzimage: { url: url('buildroot-bzimage.bin') },
  initrd: { url: url('buildroot-initrd.bin') },
  filesystem: {
    basefs: { url: url('fs.json') },
    baseurl: url('fs') + '/',
  },
  cmdline: 'console=ttyS0 console=tty0 tsc=reliable mitigations=off random.trust_cpu=on noapic',
  autostart: true,
});

let out = '';
emulator.add_listener('serial0-output-byte', (byte) => {
  out += String.fromCharCode(byte);
  process.stdout.write(String.fromCharCode(byte));
});

function send(cmd) {
  emulator.serial0_send(cmd + '\n');
}

const start = Date.now();
const timeout = 180000;
let stage = 0;

const timer = setInterval(async () => {
  if (Date.now() - start > timeout) {
    console.error('\n\n[HARNESS] TIMEOUT');
    clearInterval(timer);
    await emulator.destroy();
    process.exit(2);
  }
  if (stage === 0 && /[#$%]\s*$/.test(out.slice(-8))) {
    stage = 1;
    out = '';
    send('ls /mnt && ls /mnt/info && echo LISTED && head -3 /mnt/info/bio.txt && echo DONE_MARKER');
  } else if (stage === 1 && out.includes('DONE_MARKER')) {
    stage = 2;
    clearInterval(timer);
    const ok =
      out.includes('info') &&
      out.includes('bio.txt') &&
      out.includes('projects') &&
      out.includes('LISTED');
    console.error(`\n\n[HARNESS] mount+list ${ok ? 'PASS' : 'FAIL'}`);
    await emulator.destroy();
    process.exit(ok ? 0 : 1);
  }
}, 500);
