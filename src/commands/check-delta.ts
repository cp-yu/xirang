import { promises as fs } from 'fs';
import path from 'path';
import type { Command } from 'commander';
import { extractRequirementsSection, normalizeRequirementName } from '../core/parsers/requirement-blocks.js';

type Operation = 'ADDED' | 'MODIFIED' | 'REMOVED' | 'RENAMED_FROM';
type Status = 'ok' | 'missing' | 'conflicts';

interface OperationEntry {
  operation: Operation;
  requirement: string;
}

interface CheckDeltaOptions {
  change?: string;
  caps?: string;
  added?: string[];
  modified?: string[];
  removed?: string[];
  renamedFrom?: string[];
  json?: boolean;
}

interface CheckDeltaItem {
  cap: string;
  mainSpec: string;
  available: string[];
  ok: OperationEntry[];
  missing: OperationEntry[];
  conflicts: OperationEntry[];
  error?: string;
}

interface CheckDeltaReport {
  change?: string;
  valid: boolean;
  items: CheckDeltaItem[];
}

function collect(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

function splitCaps(caps?: string): string[] {
  return (caps ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function operationEntries(options: CheckDeltaOptions): OperationEntry[] {
  return [
    ...(options.added ?? []).map((requirement) => ({ operation: 'ADDED' as const, requirement })),
    ...(options.modified ?? []).map((requirement) => ({ operation: 'MODIFIED' as const, requirement })),
    ...(options.removed ?? []).map((requirement) => ({ operation: 'REMOVED' as const, requirement })),
    ...(options.renamedFrom ?? []).map((requirement) => ({ operation: 'RENAMED_FROM' as const, requirement })),
  ];
}

function classify(entry: OperationEntry, availableNames: Set<string>): Status {
  const exists = availableNames.has(normalizeRequirementName(entry.requirement));
  if (entry.operation === 'ADDED') return exists ? 'conflicts' : 'ok';
  return exists ? 'ok' : 'missing';
}

function relativeSpecPath(specId: string): string {
  return path.join('openspec', 'specs', specId, 'spec.md');
}

export class CheckDeltaCommand {
  async execute(options: CheckDeltaOptions): Promise<void> {
    const caps = splitCaps(options.caps);
    if (caps.length === 0) {
      this.fail('--caps is required', options.json);
      return;
    }

    const entries = operationEntries(options);
    const items = await Promise.all(caps.map((cap) => this.checkCap(cap, entries)));
    const valid = items.every((item) => !item.error && item.missing.length === 0 && item.conflicts.length === 0);
    const report: CheckDeltaReport = { change: options.change, valid, items };

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      this.printHuman(report);
    }
    process.exitCode = valid ? 0 : 1;
  }

  private async checkCap(cap: string, entries: OperationEntry[]): Promise<CheckDeltaItem> {
    const mainSpec = relativeSpecPath(cap);
    try {
      const content = await fs.readFile(path.join(process.cwd(), mainSpec), 'utf-8');
      const available = extractRequirementsSection(content).bodyBlocks.map((block) => block.name);
      const availableNames = new Set(available.map(normalizeRequirementName));
      const item: CheckDeltaItem = { cap, mainSpec, available, ok: [], missing: [], conflicts: [] };
      for (const entry of entries) item[classify(entry, availableNames)].push(entry);
      return item;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      return {
        cap,
        mainSpec,
        available: [],
        ok: [],
        missing: [],
        conflicts: [],
        error: `${mainSpec} was not found. --caps expects spec ids / spec directory names.`,
      };
    }
  }

  private fail(message: string, json?: boolean): void {
    if (json) {
      console.log(JSON.stringify({ valid: false, items: [], error: message }, null, 2));
    } else {
      console.error(message);
    }
    process.exitCode = 1;
  }

  private printHuman(report: CheckDeltaReport): void {
    for (const item of report.items) {
      if (item.error) {
        console.error(item.error);
        continue;
      }
      console.log(`Spec: ${item.cap}`);
      console.log(`Main spec: ${item.mainSpec}`);
      console.log('Available requirements:');
      for (const requirement of item.available) console.log(`- ${requirement}`);
      this.printEntries('OK', item.ok);
      this.printEntries('Missing', item.missing);
      for (const entry of item.conflicts) {
        console.log(`Conflict: ${entry.operation} ${entry.requirement}`);
        if (entry.operation === 'ADDED') console.log('Use MODIFIED instead.');
      }
    }
  }

  private printEntries(label: 'OK' | 'Missing', entries: OperationEntry[]): void {
    for (const entry of entries) console.log(`${label}: ${entry.operation} ${entry.requirement}`);
  }
}

export function registerCheckDeltaCommand(program: Command): void {
  program
    .command('check-delta')
    .description('Preflight planned delta spec requirement references')
    .option('--change <name>', 'Change name for report context')
    .option('--caps <spec-ids>', 'Comma-separated spec ids / spec directory names')
    .option('--added <requirement>', 'Planned ADDED requirement header', collect, [])
    .option('--modified <requirement>', 'Planned MODIFIED requirement header', collect, [])
    .option('--removed <requirement>', 'Planned REMOVED requirement header', collect, [])
    .option('--renamed-from <requirement>', 'Planned RENAMED FROM source requirement header', collect, [])
    .option('--json', 'Output as JSON')
    .action(async (options: CheckDeltaOptions) => {
      try {
        const command = new CheckDeltaCommand();
        await command.execute(options);
      } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });
}
