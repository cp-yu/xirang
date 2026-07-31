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
console.log('\nRebuilding LikeC4...');
try {
  execFileSync('pnpm', ['--dir', 'likec4', 'build'], { stdio: 'inherit' });
  console.log('\n✅ LikeC4 rebuilt successfully!');
} catch (error) {
  console.error('\n❌ LikeC4 rebuild failed!');
  process.exit(1);
}
