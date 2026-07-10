#!/usr/bin/env node
// Reflow hard-wrapped Markdown prose/list items into single logical lines so the
// terminal (bat/less) can soft-wrap to the real viewport width. Preserves YAML
// frontmatter, headings, list bullets, blockquotes, tables, code fences, blank
// lines, and explicit `\` hard breaks.
import { readFileSync, writeFileSync } from 'node:fs';

const isHeading = (l) => /^#{1,6}\s/.test(l);
const isListItem = (l) => /^\s*([-*+]|\d+[.)])\s+/.test(l);
const isBlockquote = (l) => /^\s*>/.test(l);
const isTable = (l) => /^\s*\|/.test(l);
const isThematic = (l) => /^\s*([-*_])(\s*\1){2,}\s*$/.test(l);
const isFence = (l) => /^\s*(```|~~~)/.test(l);

function reflow(src) {
  const lines = src.split('\n');
  const out = [];
  let buf = null;
  let inFront = false;
  let frontDone = false;
  let inFence = false;

  const flush = () => {
    if (buf !== null) {
      out.push(buf);
      buf = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Frontmatter: only a leading --- on line 0 starts it.
    if (!frontDone && !inFront && i === 0 && line.trim() === '---') {
      inFront = true;
      out.push(line);
      continue;
    }
    if (inFront) {
      out.push(line);
      if (line.trim() === '---') {
        inFront = false;
        frontDone = true;
      }
      continue;
    }

    if (isFence(line)) {
      flush();
      out.push(line);
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    if (line.trim() === '') {
      flush();
      out.push('');
      continue;
    }
    if (isHeading(line) || isThematic(line) || isTable(line)) {
      flush();
      out.push(line);
      continue;
    }
    if (isListItem(line) || isBlockquote(line)) {
      flush();
      buf = line.replace(/\s+$/, '');
      continue;
    }

    // Prose / continuation line.
    const text = line.trim();
    if (buf === null) {
      buf = line.replace(/\s+$/, '');
    } else if (/\\$/.test(buf)) {
      // Previous logical line ended with an explicit hard break — keep separate.
      flush();
      buf = line.replace(/\s+$/, '');
    } else {
      buf = buf.replace(/\s+$/, '') + ' ' + text;
    }
  }
  flush();
  return out.join('\n');
}

const files = process.argv.slice(2);
let changed = 0;
for (const f of files) {
  const before = readFileSync(f, 'utf8');
  const after = reflow(before);
  if (after !== before) {
    writeFileSync(f, after);
    changed++;
    console.log('reflowed:', f);
  }
}
console.log(`\n${changed} file(s) changed of ${files.length}`);
