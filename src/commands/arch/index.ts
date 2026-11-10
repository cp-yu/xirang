import { diagnostic } from '../../utils/output.js';
import path from 'node:path';
import type { Command } from 'commander';
import { formatArchitectureQueryText, queryArchitecture } from './query.js';
import { validateArchitectureCommand } from './validate.js';
import { exportArchitecture, type ExportFormat } from './export.js';
import { registerPlanRemoveCommand } from './plan-remove.js';
import { formatArchitectureSearchText, searchArchitecture } from './search.js';
import { formatArchitectureImpactText, impactArchitecture } from './impact.js';
import {
  formatArchitectureOutlineMarkdown,
  formatArchitectureOutlineText,
  outlineArchitecture,
} from './outline.js';
import {
  formatArchitectureSnapshotMarkdown,
  formatArchitectureSnapshotText,
  snapshotArchitecture,
  treeToSnapshotJson,
} from './snapshot.js';

export function registerArchCommand(program: Command): void {
  const arch = program.command('arch').description('Query, search, analyze, validate, and export the Semantic Model');
  arch.command('query <element-ids...>')
    .description('Read complete Declarations and optional Contracts for explicit Element identities')
    .option('--contract', 'Inline complete Element Contracts for the requested identities')
    .option('--json', 'Output canonical JSON')
    .action(async (elementIds, options) => {
      try {
        const result = await queryArchitecture(process.cwd(), elementIds, {
          contract: options.contract,
        });
        console.log(options.json ? JSON.stringify(result) : formatArchitectureQueryText(result));
      } catch (error) { diagnostic((error as Error).message); process.exitCode = 1; }
    });
  arch.command('search <query>')
    .description('Search Semantic Model Elements and their Contracts')
    .option('--limit <n>', 'Maximum matches returned after stable sorting')
    .option('--json', 'Output canonical JSON')
    .action(async (query, options) => {
      try {
        const result = await searchArchitecture(process.cwd(), query, {
          limit: options.limit === undefined ? undefined : Number(options.limit),
        });
        console.log(options.json ? JSON.stringify(result) : formatArchitectureSearchText(result));
      } catch (error) {
        diagnostic((error as Error).message);
        process.exitCode = 1;
      }
    });
  arch.command('impact <element-ids...>')
    .description('Project Semantic Model context around focus Elements')
    .option('--depth <n>', 'Relationship and descendant depth', '2')
    .option('--paths', 'Include the full depth-bounded Relationship subgraph and canonical shortest paths')
    .option('--json', 'Output canonical JSON')
    .action(async (elementIds, options) => {
      try {
        const result = await impactArchitecture(process.cwd(), elementIds, {
          depth: Number(options.depth),
          paths: options.paths,
        });
        console.log(options.json ? JSON.stringify(result) : formatArchitectureImpactText(result));
      } catch (error) {
        diagnostic((error as Error).message);
        process.exitCode = 1;
      }
    });
  arch.command('outline')
    .description('Project complete Element hierarchy with explicitly selected semantic expansions')
    .option('--definitions', 'Load Element Definitions according to project configuration')
    .option('--definition-depth <n>', 'Select Definitions and limit loading to this hierarchy depth')
    .option('--relationships', 'Include all persisted Relationships')
    .option('--metamodel', 'Include all Element and Relationship Kind declarations')
    .option('--format <format>', 'text, markdown, or json', 'text')
    .action(async options => {
      if (options.json) options.format = 'json';
      if (!['text', 'markdown', 'json'].includes(options.format)) {
        diagnostic(`Unknown format: ${options.format}. Allowed choices are text, markdown, json.`);
        process.exitCode = 1;
        return;
      }
      if (options.definitionDepth !== undefined && !/^\d+$/.test(options.definitionDepth)) {
        diagnostic('Definition depth must be a non-negative integer');
        process.exitCode = 1;
        return;
      }
      try {
        const result = await outlineArchitecture(process.cwd(), {
          definitions: options.definitions || options.definitionDepth !== undefined,
          definitionDepth: options.definitionDepth === undefined
            ? undefined
            : Number(options.definitionDepth),
          relationships: options.relationships,
          metamodel: options.metamodel,
        });
        if (options.format === 'json') {
          console.log(JSON.stringify(result));
        } else if (options.format === 'markdown') {
          console.log(formatArchitectureOutlineMarkdown(result));
        } else {
          console.log(formatArchitectureOutlineText(result));
        }
      } catch (error) {
        diagnostic((error as Error).message);
        process.exitCode = 1;
      }
    });
  arch.command('snapshot')
    .description('Project the complete Semantic Model skeleton (Declarations, Relationships, Metamodel) without Contracts')
    .option('--format <format>', 'text, markdown, or json', 'text')
    .action(async options => {
      if (options.json) options.format = 'json';
      if (!['text', 'markdown', 'json'].includes(options.format)) {
        diagnostic(`Unknown format: ${options.format}. Allowed choices are text, markdown, json.`);
        process.exitCode = 1;
        return;
      }
      try {
        const result = await snapshotArchitecture(process.cwd());
        if (options.format === 'json') {
          console.log(JSON.stringify(treeToSnapshotJson(result)));
        } else if (options.format === 'markdown') {
          console.log(formatArchitectureSnapshotMarkdown(result));
        } else {
          console.log(formatArchitectureSnapshotText(result));
        }
      } catch (error) {
        diagnostic((error as Error).message);
        process.exitCode = 1;
      }
    });
  arch.command('validate')
    .description('Validate .xirang/model/, or the Expected Semantic Model of an active change')
    .option('--change <name>', 'Validate the Expected Semantic Model of an active change')
    .option('--json', 'Output canonical JSON')
    .action(async options => {
      try {
        const result = await validateArchitectureCommand(process.cwd(), { change: options.change });
        if (result.errors.length || result.warnings.length) {
          if (options.json) console.error(JSON.stringify({ issues: [...result.errors, ...result.warnings] }));
          else for (const error of [...result.errors, ...result.warnings]) diagnostic(`${error.code}: ${error.message}`);
        }
        if (!result.success) process.exitCode = 1;
      } catch (error) {
        diagnostic((error as Error).message);
        process.exitCode = 1;
      }
    });
  arch.command('export')
    .description('Generate LikeC4 artifacts and export them as images')
    .option('--format <format>', 'png, svg, or pdf', 'png')
    .option('--output <dir>', 'output directory', 'docs/architecture')
    .action(async options => {
      const output = path.resolve(options.output);
      await exportArchitecture(process.cwd(), { format: options.format as ExportFormat, output });
      console.log(options.json ? JSON.stringify({ output }) : output);
    });
  registerPlanRemoveCommand(arch);
}
