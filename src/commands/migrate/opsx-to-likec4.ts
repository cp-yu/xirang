import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { convertOpsxToLikeC4 } from '../../migration/converters/opsx-to-likec4.js';
import { generateLikeC4Files, renderLikeC4Files } from '../../migration/generators/likec4-file-generator.js';
import { verifyMigration } from '../../migration/migration-verifier.js';

export interface MigrateOpsxOptions { dryRun?: boolean; agentVerify?: boolean }

async function validateLikeC4(projectRoot: string): Promise<void> {
  const architecture = path.join(projectRoot, 'openspec', 'architecture');
  const bin = fileURLToPath(new URL('../../../node_modules/likec4/bin/likec4.mjs', import.meta.url));
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [bin, 'validate', architecture], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(output.trim() || `LikeC4 validation failed (${code})`)));
  });
}

export async function migrateOpsxToLikeC4(projectRoot: string, options: MigrateOpsxOptions = {}): Promise<void> {
  const model = await convertOpsxToLikeC4(projectRoot);
  if (options.dryRun) {
    console.log('Preview of generated files');
    for (const file of renderLikeC4Files(model)) console.log(`\n${file.relativePath}\n${file.content.slice(0, 500)}`);
    return;
  }

  await generateLikeC4Files(projectRoot, model);
  await validateLikeC4(projectRoot);
  const openspec = path.join(projectRoot, 'openspec');
  await Promise.all([
    fs.rename(path.join(openspec, 'project.opsx.yaml'), path.join(openspec, 'project.opsx.yaml.backup')),
    fs.rename(path.join(openspec, 'project.opsx.relations.yaml'), path.join(openspec, 'project.opsx.relations.yaml.backup')),
  ]);
  console.log('✓ LikeC4 validation passed');
  console.log(`✓ Migrated ${model.domains.length} domains`);
  console.log(`✓ Migrated ${model.domains.reduce((total, domain) => total + domain.capabilities.length, 0)} capabilities`);
  console.log(`✓ Migrated ${model.relations.length} relations`);
  if (options.agentVerify) {
    const report = await verifyMigration(projectRoot, model);
    console.log(JSON.stringify(report, null, 2));
    if (!report.valid) throw new Error('Migration verification failed');
  }
}
