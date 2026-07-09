import { describe, it, expect } from 'vitest';
import { buildFs } from './gen-v86-fs.mjs';

const S_IFREG = 0x8000;
const S_IFDIR = 0x4000;

describe('buildFs', () => {
  it('emits a version-3 filesystem with correct total size', () => {
    const { fsjson } = buildFs([{ path: 'a.txt', contents: 'hello\n' }]);
    expect(fsjson.version).toBe(3);
    expect(fsjson.size).toBe(Buffer.byteLength('hello\n'));
    expect(Array.isArray(fsjson.fsroot)).toBe(true);
  });

  it('addresses file bodies by an 8-char sha256 prefix and stores them', () => {
    const { fsjson, store } = buildFs([{ path: 'a.txt', contents: 'hello\n' }]);
    const [name, size, , mode, uid, gid, filename] = fsjson.fsroot[0];
    expect(name).toBe('a.txt');
    expect(size).toBe(6);
    expect(mode & S_IFREG).toBe(S_IFREG);
    expect(uid).toBe(0);
    expect(gid).toBe(0);
    expect(filename).toMatch(/^[0-9a-f]{8}\.bin$/);
    expect(store.get(filename).toString('utf8')).toBe('hello\n');
  });

  it('nests directories with children as the node target', () => {
    const { fsjson } = buildFs([
      { path: 'projects/one.txt', contents: 'x' },
      { path: 'projects/two.txt', contents: 'y' },
    ]);
    const dir = fsjson.fsroot.find((n) => n[0] === 'projects');
    expect(dir[3] & S_IFDIR).toBe(S_IFDIR);
    const children = dir[6];
    expect(children.map((c) => c[0])).toEqual(['one.txt', 'two.txt']);
  });

  it('sorts entries deterministically regardless of input order', () => {
    const input = [
      { path: 'b.txt', contents: '1' },
      { path: 'a.txt', contents: '2' },
    ];
    const first = buildFs(input).fsjson;
    const second = buildFs([...input].reverse()).fsjson;
    expect(first).toEqual(second);
    expect(first.fsroot.map((n) => n[0])).toEqual(['a.txt', 'b.txt']);
  });

  it('deduplicates identical bodies to a single store entry', () => {
    const { store } = buildFs([
      { path: 'a.txt', contents: 'same' },
      { path: 'b.txt', contents: 'same' },
    ]);
    expect(store.size).toBe(1);
  });
});
