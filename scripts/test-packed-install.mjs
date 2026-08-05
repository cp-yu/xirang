import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-packed-install-'));
const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const installedPackage = path.join(temporaryRoot, 'node_modules', 'xirang');
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

  const likec4Root = path.join(installedPackage, 'likec4');
  const likec4Runtime = path.join(likec4Root, 'packages', 'likec4');
  await fs.rm(likec4Root, { recursive: true, force: true });
  run(packageManager, [
    '--dir', 'likec4',
    '--filter', 'xirang-likec4',
    'deploy', '--legacy', '--prod', likec4Runtime,
  ], root);

  const runnerUrl = pathToFileURL(path.join(installedPackage, 'dist', 'commands', 'arch', 'runner.js')).href;
  const launchMode = run(process.execPath, [
    '--input-type=module',
    '--eval',
    `const { resolveLikeC4Command } = await import(${JSON.stringify(runnerUrl)}); process.stdout.write(resolveLikeC4Command([]).mode);`,
  ], temporaryRoot);
  assert.equal(launchMode, 'dist');
  await fs.access(path.join(likec4Runtime, 'node_modules', '@likec4', 'generators', 'package.json'));
  run(process.execPath, [path.join(likec4Runtime, 'bin', 'likec4.mjs'), '--help'], temporaryRoot);

  const help = run(installedBinary, ['--help'], temporaryRoot);
  assert.match(help, /\bsetup \[options\] \[path\]/);
  assert.match(help, /\bcandidate\b/);
  assert.doesNotMatch(help, /^\s+(init|bootstrap|migrate)\b/m);

  console.log('Packed production install command surface verified.');
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
