import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-packed-install-'));
const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const installedBinary = path.join(
  temporaryRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'xirang.cmd' : 'xirang'
);

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: 'true',
      XIRANG_NO_COMPLETIONS: '1',
    },
    timeout: 300_000,
  });

  if (result.status !== 0) {
    throw new Error([
      `Command failed: ${command} ${args.join(' ')}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }

  return result.stdout;
}

try {
  run(packageManager, ['build'], root);
  const packOutput = run(packageManager, ['pack', '--pack-destination', temporaryRoot], root);
  const tarballName = packOutput.trim().split(/\r?\n/).at(-1);
  assert(tarballName, 'pnpm pack did not report a tarball path');

  const tarballPath = path.isAbsolute(tarballName)
    ? tarballName
    : path.join(root, tarballName);
  run(npm, ['install', '--no-audit', '--no-fund', tarballPath], temporaryRoot);

  const help = run(installedBinary, ['--help'], temporaryRoot);
  assert.match(help, /\bsetup \[options\] \[path\]/);
  assert.match(help, /\bcandidate\b/);
  assert.doesNotMatch(help, /^\s+(init|bootstrap|migrate)\b/m);

  console.log('Packed install command surface verified.');
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
