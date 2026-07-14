import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BUILT_IN_SCHEMA_IDS, getSchemaDir, resolveSchema } from '../core/artifact-graph/index.js';

interface ValidationIssue {
  level: 'error';
  path: string;
  message: string;
}

interface SchemaValidationResult {
  name: string;
  path: string;
  valid: boolean;
  issues: ValidationIssue[];
}

function unknownSchema(name: string): Error {
  return new Error(`Schema '${name}' not found. Available schemas: ${BUILT_IN_SCHEMA_IDS.join(', ')}`);
}

function inspectSchema(name: string) {
  const schemaDir = getSchemaDir(name);
  if (!schemaDir) throw unknownSchema(name);
  return { name, source: 'package' as const, path: schemaDir };
}

function validateBuiltInSchema(name: string, verbose: boolean): SchemaValidationResult {
  const schemaDir = getSchemaDir(name);
  if (!schemaDir) throw unknownSchema(name);
  const issues: ValidationIssue[] = [];
  const stages = [
    'YAML parsing',
    'Zod validation',
    'File definitions',
    'Template existence',
    'Dependency graph',
    'File references',
  ];
  if (verbose) stages.forEach((stage) => console.log(`  ${stage}...`));

  let schema;
  try {
    schema = resolveSchema(name);
  } catch (error) {
    issues.push({ level: 'error', path: 'schema.yaml', message: (error as Error).message });
    return { name, path: schemaDir, valid: false, issues };
  }

  for (const artifact of schema.artifacts) {
    const templatePath = path.join(schemaDir, 'templates', artifact.template);
    if (!fs.existsSync(templatePath)) {
      issues.push({
        level: 'error',
        path: `artifacts.${artifact.id}.template`,
        message: `Template file '${artifact.template}' not found for artifact '${artifact.id}'`,
      });
    }
  }
  return { name, path: schemaDir, valid: issues.length === 0, issues };
}

export function registerSchemaCommand(program: Command): void {
  const schema = program.command('schema').description('Inspect built-in workflow schemas');

  schema
    .command('which [name]')
    .description('Show the package location of a built-in schema')
    .option('--json', 'Output as JSON')
    .option('--all', 'List all built-in schemas')
    .action((name: string | undefined, options: { json?: boolean; all?: boolean }) => {
      try {
        const results = options.all
          ? BUILT_IN_SCHEMA_IDS.map(inspectSchema)
          : [inspectSchema(name ?? '')];
        if (options.json) console.log(JSON.stringify(options.all ? results : results[0], null, 2));
        else results.forEach((result) => console.log(`Schema: ${result.name}\nSource: package\nPath: ${result.path}`));
      } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });

  schema
    .command('validate [name]')
    .description('Validate one or all built-in schemas')
    .option('--json', 'Output as JSON')
    .option('--verbose', 'Show validation stages')
    .action((name: string | undefined, options: { json?: boolean; verbose?: boolean }) => {
      try {
        const names = name ? [name] : [...BUILT_IN_SCHEMA_IDS];
        const results = names.map((id) => validateBuiltInSchema(id, Boolean(options.verbose && !options.json)));
        const valid = results.every((result) => result.valid);
        if (options.json) {
          console.log(JSON.stringify(name ? results[0] : { valid, schemas: results }, null, 2));
        } else {
          results.forEach((result) => console.log(`${result.valid ? '✓' : '✗'} ${result.name}`));
        }
        if (!valid) process.exitCode = 1;
      } catch (error) {
        if (options.json) console.log(JSON.stringify({ valid: false, error: (error as Error).message }, null, 2));
        else console.error(`Error: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });
}
