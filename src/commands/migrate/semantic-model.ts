import ora from 'ora';
import { migrateSemanticModel, type SemanticModelMigrationOptions } from '../../migration/semantic-model-migrator.js';

export interface MigrateSemanticModelOptions extends SemanticModelMigrationOptions {
  candidate?: string;
  json?: boolean;
}

export async function migrateSemanticModelCommand(projectRoot: string, options: MigrateSemanticModelOptions = {}): Promise<void> {
  const result = await migrateSemanticModel(projectRoot, {
    candidatePath: options.candidatePath ?? options.candidate,
    promote: options.promote,
    yes: options.yes,
  });
  if (options.json) {
    console.log(JSON.stringify(result.report, null, 2));
    return;
  }
  console.log(`Candidate written to ${result.candidatePath}`);
  console.log(`Resolved mappings: ${result.report.resolvedMappings.length}`);
  if (result.report.gaps.length) {
    console.log(`Review gaps: ${result.report.gaps.length}`);
    for (const gap of result.report.gaps) console.log(`${gap.code}: ${gap.message}`);
  }
  if (result.promoted) console.log('Semantic model promotion completed');
}

export async function runMigrateSemanticModel(projectRoot: string, options: MigrateSemanticModelOptions = {}): Promise<void> {
  try {
    await migrateSemanticModelCommand(projectRoot, options);
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: (error as Error).message }));
    }
    ora().fail(`Error: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}
