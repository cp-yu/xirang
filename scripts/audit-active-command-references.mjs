import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const activeRoots = [
  'src',
  'docs',
  'README.md',
  'schemas',
  '.pi/skills',
  '.claude/skills',
];
const historyRoots = ['.opsx/changes/archive', '.opsx/history'];
const patterns = [
  ['opsx init', /\bopsx\s+init\b/],
  ['opsx bootstrap', /\bopsx\s+bootstrap\b/],
  ['opsx migrate', /\bopsx\s+migrate\b/],
  ['opsx-bootstrap-arch', /\bopsx-bootstrap-arch\b/],
  ['bootstrap-arch', /\bbootstrap-arch\b/],
  ['experimental workflow', /\bexperimental workflow\b/],
];
const allowedActive = new Set([
  'src/core/shared/skill-generation.ts',
]);

async function exists(target) {
  return fs.lstat(target).then(() => true, () => false);
}

async function collect(relative) {
  const absolute = path.join(root, relative);
  if (!await exists(absolute)) return [];
  const stat = await fs.lstat(absolute);
  if (stat.isSymbolicLink()) return [];
  if (stat.isFile()) return [relative];
  const files = [];
  for (const entry of await fs.readdir(absolute, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    files.push(...await collect(path.posix.join(relative.replaceAll('\\', '/'), entry.name)));
  }
  return files;
}

async function scan(roots) {
  const findings = [];
  for (const scope of roots) {
    for (const file of await collect(scope)) {
      let content;
      try {
        content = await fs.readFile(path.join(root, file), 'utf8');
      } catch {
        continue;
      }
      const lines = content.split('\n');
      for (let index = 0; index < lines.length; index += 1) {
        for (const [token, pattern] of patterns) {
          if (pattern.test(lines[index])) findings.push({ file, line: index + 1, token });
        }
      }
    }
  }
  return findings;
}

const active = (await scan(activeRoots)).filter(({ file }) => !allowedActive.has(file));
const historical = await scan(historyRoots);

console.log(`Active stale references: ${active.length}`);
for (const finding of active) console.log(`  ${finding.file}:${finding.line} ${finding.token}`);
console.log(`Historical references: ${historical.length}`);
for (const finding of historical) console.log(`  ${finding.file}:${finding.line} ${finding.token}`);

if (active.length > 0) process.exitCode = 1;
