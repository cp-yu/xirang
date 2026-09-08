#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const runTsc = (args = []) => {
  const tscPath = require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tscPath, ...args], { stdio: 'inherit' });
};

console.log('🔨 Building Xirang...\n');

// Clean dist directory
if (existsSync('dist')) {
  console.log('Cleaning dist directory...');
  rmSync('dist', { recursive: true, force: true });
}

// Run TypeScript compiler (use local version explicitly)
console.log('Compiling TypeScript...');
try {
  runTsc(['--version']);
  runTsc();
  console.log('\n✅ TypeScript compiled successfully!');
} catch (error) {
  console.error('\n❌ TypeScript compilation failed!');
  process.exit(1);
}

// Rebuild LikeC4 packages (diagram, react, likec4-spa, likec4 CLI, __app__)
// Skip when the vendored likec4 workspace is not installed yet (e.g. root-only
// `pnpm install` in CI or fresh clones); `pnpm likec4:install && pnpm likec4:build`
// builds it explicitly.
if (!existsSync('likec4/node_modules')) {
  console.warn('\n⚠️  likec4 workspace is not installed — skipping LikeC4 rebuild.');
  console.warn('   Run `pnpm likec4:install && pnpm likec4:build` to build it.');
} else {
  console.log('\nRebuilding LikeC4...');
  try {
    execFileSync('pnpm', ['--dir', 'likec4', 'build'], { stdio: 'inherit' });
    console.log('\n✅ LikeC4 rebuilt successfully!');
  } catch (error) {
    console.error('\n❌ LikeC4 rebuild failed!');
    process.exit(1);
  }
}
