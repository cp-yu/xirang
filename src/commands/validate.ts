import { XIRANG_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'fs';
import ora from 'ora';
import path from 'path';
import { Validator } from '../core/validation/validator.js';
import { isInteractive, resolveNoInteractive } from '../utils/interactive.js';
import { getActiveChangeIds, getContractElementIds } from '../utils/item-discovery.js';
import { nearestMatches } from '../utils/match.js';
import type { ValidationReport } from '../core/validation/types.js';
import { readFormalSemanticModel, compileChange, type CompiledChange } from '../core/change-compiler.js';
import { conciseDiffEntries, renderChangeDiff } from '../core/change-diff-renderer.js';
import { validateTaskStructure } from '../core/parsers/task-structure.js';

type ItemType = 'change' | 'contract';

interface ExecuteOptions {
  all?: boolean;
  changes?: boolean;
  contracts?: boolean;
  change?: string;
  type?: string;
  strict?: boolean;
  json?: boolean;
  noInteractive?: boolean;
  interactive?: boolean; // Commander sets this to false when --no-interactive is used
  concurrency?: string;
}

interface BulkItemResult {
  id: string;
  type: ItemType;
  valid: boolean;
  issues: { level: 'ERROR' | 'WARNING' | 'INFO'; path: string; message: string }[];
  durationMs: number;
}

export class ValidateCommand {
  async execute(itemName: string | undefined, options: ExecuteOptions = {}): Promise<void> {
    const interactive = isInteractive(options);

    if (options.change) {
      await this.validateExplicitChange(options.change, { strict: !!options.strict, json: !!options.json });
      return;
    }

    // Handle bulk flags first
    if (options.all || options.changes || options.contracts) {
      await this.runBulkValidation({
        changes: !!options.all || !!options.changes,
        contracts: !!options.all || !!options.contracts,
      }, { strict: !!options.strict, json: !!options.json, concurrency: options.concurrency, noInteractive: resolveNoInteractive(options) });
      return;
    }

    // No item and no flags
    if (!itemName) {
      if (interactive) {
        await this.runInteractiveSelector({ strict: !!options.strict, json: !!options.json, concurrency: options.concurrency });
        return;
      }
      this.printNonInteractiveHint();
      process.exitCode = 1;
      return;
    }

    // Direct item validation with type detection or override
    const typeOverride = this.normalizeType(options.type);
    if (options.type && !typeOverride) {
      console.error(`Invalid type '${options.type}'. Expected change|contract.`);
      process.exitCode = 1;
      return;
    }
    await this.validateDirectItem(itemName, { typeOverride, strict: !!options.strict, json: !!options.json });
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'contract') return v;
    return undefined;
  }

  private async runInteractiveSelector(opts: { strict: boolean; json: boolean; concurrency?: string }): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    const choice = await select({
      message: 'What would you like to validate?',
      choices: [
        { name: 'All (changes + contracts)', value: 'all' },
        { name: 'All changes', value: 'changes' },
        { name: 'All Element Contracts', value: 'contracts' },
        { name: 'Pick a specific change or contract', value: 'one' },
      ],
    });

    if (choice === 'all') return this.runBulkValidation({ changes: true, contracts: true }, opts);
    if (choice === 'changes') return this.runBulkValidation({ changes: true, contracts: false }, opts);
    if (choice === 'contracts') return this.runBulkValidation({ changes: false, contracts: true }, opts);

    const [changes, contracts] = await Promise.all([getActiveChangeIds(), getContractElementIds()]);
    const items: { name: string; value: { type: ItemType; id: string } }[] = [];
    items.push(...changes.map(id => ({ name: `change/${id}`, value: { type: 'change' as const, id } })));
    items.push(...contracts.map(id => ({ name: `contract/${id}`, value: { type: 'contract' as const, id } })));
    if (items.length === 0) {
      console.error('No items found to validate.');
      process.exitCode = 1;
      return;
    }
    const picked = await select<{ type: ItemType; id: string }>({ message: 'Pick an item', choices: items });
    await this.validateByType(picked.type, picked.id, opts);
  }

  private printNonInteractiveHint(): void {
    console.error('Nothing to validate. Try one of:');
    console.error('  xirang validate --all');
    console.error('  xirang validate --changes');
    console.error('  xirang validate --contracts');
    console.error('  xirang validate <item-name>');
    console.error('Or run in an interactive terminal.');
  }

  private async validateDirectItem(itemName: string, opts: { typeOverride?: ItemType; strict: boolean; json: boolean }): Promise<void> {
    const [changes, contracts] = await Promise.all([getActiveChangeIds(), getContractElementIds()]);
    const isChange = changes.includes(itemName);
    const isContract = contracts.includes(itemName);

    const type = opts.typeOverride ?? (isChange ? 'change' : isContract ? 'contract' : undefined);

    if (!type) {
      console.error(`Unknown item '${itemName}'`);
      const suggestions = nearestMatches(itemName, [...changes, ...contracts]);
      if (suggestions.length) console.error(`Did you mean: ${suggestions.join(', ')}?`);
      process.exitCode = 1;
      return;
    }

    if (!opts.typeOverride && isChange && isContract) {
      console.error(`Ambiguous item '${itemName}' matches both a change and an Element Contract.`);
      console.error('Pass --type change|contract.');
      process.exitCode = 1;
      return;
    }

    await this.validateByType(type, itemName, opts);
  }

  private async validateExplicitChange(id: string, opts: { strict: boolean; json: boolean }): Promise<void> {
    const changes = await getActiveChangeIds();
    if (!changes.includes(id)) {
      console.error(`Unknown change '${id}'`);
      const suggestions = nearestMatches(id, changes);
      if (suggestions.length) console.error(`Did you mean: ${suggestions.join(', ')}?`);
      process.exitCode = 1;
      return;
    }

    const validator = new Validator(opts.strict);
    const changeDir = path.join(process.cwd(), XIRANG_DIR_NAME, 'changes', id);
    const start = Date.now();
    const result = await this.validateChangeWithPreview(validator, id, changeDir);
    const durationMs = Date.now() - start;
    this.printReport('change', id, result.report, durationMs, opts.json, result.compiled);
    process.exitCode = result.report.valid ? 0 : 1;
  }

  private async validateByType(type: ItemType, id: string, opts: { strict: boolean; json: boolean }): Promise<void> {
    const validator = new Validator(opts.strict);
    if (type === 'change') {
      const changeDir = path.join(process.cwd(), XIRANG_DIR_NAME, 'changes', id);
      const start = Date.now();
      const result = await this.validateChangeWithPreview(validator, id, changeDir);
      const durationMs = Date.now() - start;
      this.printReport('change', id, result.report, durationMs, opts.json, result.compiled);
      // Non-zero exit if invalid (keeps enriched output test semantics)
      process.exitCode = result.report.valid ? 0 : 1;
      return;
    }
    const start = Date.now();
    const report = await validateElementContract(validator, id);
    const durationMs = Date.now() - start;
    this.printReport('contract', id, report, durationMs, opts.json);
    process.exitCode = report.valid ? 0 : 1;
  }

  private printReport(type: ItemType, id: string, report: { valid: boolean; issues: any[] }, durationMs: number, json: boolean, compiled?: CompiledChange): void {
    if (json) {
      const preview = compiled ? {
        diagnostics: compiled.diagnostics,
        summary: compiled.diff.summary,
        entries: conciseDiffEntries(compiled.diff),
      } : {};
      const out = { items: [{ id, type, valid: report.valid, issues: report.issues, durationMs, ...preview }], summary: { totals: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 }, byType: { [type]: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 } } }, version: '1.0' };
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (report.valid) {
      console.log(`${type === 'change' ? 'Change' : 'Element Contract'} '${id}' is valid`);
    } else {
      console.error(`${type === 'change' ? 'Change' : 'Element Contract'} '${id}' has issues`);
      for (const issue of report.issues) {
        const label = issue.level === 'ERROR' ? 'ERROR' : issue.level;
        const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
        console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
      }
      this.printNextSteps(type);
    }
    if (compiled) {
      console.log('Effective change preview');
      console.log(renderChangeDiff(compiled.diff).trimEnd());
    }
  }

  private async validateChangeWithPreview(
    validator: Validator,
    id: string,
    changeDir: string,
  ): Promise<{ report: ValidationReport; compiled: CompiledChange }> {
    const compiled = await compileChange(process.cwd(), id);
    const notationReport = await validator.validateChangeDeltaSpecs(changeDir);
    const compilerIssues = compiled.diagnostics.map(item => ({
      level: item.level,
      path: item.path,
      message: `${item.code}: ${item.message}`,
    }));
    const compilerReport: ValidationReport = {
      valid: compiled.valid,
      issues: compilerIssues,
      summary: {
        errors: compilerIssues.filter(item => item.level === 'ERROR').length,
        warnings: compilerIssues.filter(item => item.level === 'WARNING').length,
        info: 0,
      },
    };
    return { report: mergeValidationReports(notationReport, compilerReport, await this.validateTasksStructure(changeDir)), compiled };
  }

  private async validateTasksStructure(changeDir: string): Promise<ValidationReport> {
    const tasksPath = path.join(changeDir, 'tasks.md');
    const content = await fs.readFile(tasksPath, 'utf8').catch(() => '');
    if (content === '') {
      return { valid: true, issues: [], summary: { errors: 0, warnings: 0, info: 0 } };
    }

    const result = validateTaskStructure(content, { changeDir });
    const issues = result.issues.map((issue) => ({
      level: issue.severity === 'error' ? 'ERROR' as const : 'WARNING' as const,
      path: 'tasks.md',
      ...(issue.line ? { line: issue.line } : {}),
      message: `${issue.code}: ${issue.message}`,
    }));

    return {
      valid: result.valid,
      issues,
      summary: {
        errors: issues.filter((issue) => issue.level === 'ERROR').length,
        warnings: issues.filter((issue) => issue.level === 'WARNING').length,
        info: 0,
      },
    };
  }

  private printNextSteps(type: ItemType): void {
    const bullets: string[] = [];
    if (type === 'change') {
      bullets.push('- Ensure the change carries deltas in elements/: use headers ## ADDED/MODIFIED/REMOVED Requirements');
      bullets.push('- Each requirement MUST include at least one #### Scenario: block');
      bullets.push('- Re-run with xirang validate --change <id> --json for structured diagnostics');
    } else {
      bullets.push('- Ensure the Element unit carries a ## Requirements section');
      bullets.push('- Each requirement MUST include at least one #### Scenario: block');
      bullets.push('- Re-run with --json to see structured report');
    }
    console.error('Next steps:');
    bullets.forEach(b => console.error(`  ${b}`));
  }

  private async runBulkValidation(scope: { changes: boolean; contracts: boolean }, opts: { strict: boolean; json: boolean; concurrency?: string; noInteractive?: boolean }): Promise<void> {
    const spinner = !opts.json && !opts.noInteractive ? ora('Validating...').start() : undefined;
    const [changeIds, contractIds] = await Promise.all([
      scope.changes ? getActiveChangeIds() : Promise.resolve<string[]>([]),
      scope.contracts ? getContractElementIds() : Promise.resolve<string[]>([]),
    ]);

    const DEFAULT_CONCURRENCY = 6;
    const concurrency = normalizeConcurrency(opts.concurrency) ?? normalizeConcurrency(process.env.XIRANG_CONCURRENCY) ?? DEFAULT_CONCURRENCY;
    const validator = new Validator(opts.strict);
    const queue: Array<() => Promise<BulkItemResult>> = [];

    for (const id of changeIds) {
      queue.push(async () => {
        const start = Date.now();
        const changeDir = path.join(process.cwd(), XIRANG_DIR_NAME, 'changes', id);
        const { report } = await this.validateChangeWithPreview(validator, id, changeDir);
        const durationMs = Date.now() - start;
        return { id, type: 'change' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }
    for (const id of contractIds) {
      queue.push(async () => {
        const start = Date.now();
        const report = await validateElementContract(validator, id);
        const durationMs = Date.now() - start;
        return { id, type: 'contract' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }

    if (queue.length === 0) {
      spinner?.stop();

      const summary = {
        totals: { items: 0, passed: 0, failed: 0 },
        byType: {
          ...(scope.changes ? { change: { items: 0, passed: 0, failed: 0 } } : {}),
          ...(scope.contracts ? { contract: { items: 0, passed: 0, failed: 0 } } : {}),
        },
      } as const;

      if (opts.json) {
        const out = { items: [] as BulkItemResult[], summary, version: '1.0' };
        console.log(JSON.stringify(out, null, 2));
      } else {
        console.log('No items found to validate.');
      }

      process.exitCode = 0;
      return;
    }

    const results: BulkItemResult[] = [];
    let index = 0;
    let running = 0;
    let passed = 0;
    let failed = 0;

    await new Promise<void>((resolve) => {
      const next = () => {
        while (running < concurrency && index < queue.length) {
          const currentIndex = index++;
          const task = queue[currentIndex];
          running++;
          if (spinner) spinner.text = `Validating (${currentIndex + 1}/${queue.length})...`;
          task()
            .then(res => {
              results.push(res);
              if (res.valid) passed++; else failed++;
            })
            .catch((error: any) => {
              const message = error?.message || 'Unknown error';
              const res: BulkItemResult = { id: getPlannedId(currentIndex, changeIds, contractIds) ?? 'unknown', type: getPlannedType(currentIndex, changeIds, contractIds) ?? 'change', valid: false, issues: [{ level: 'ERROR', path: 'file', message }], durationMs: 0 };
              results.push(res);
              failed++;
            })
            .finally(() => {
              running--;
              if (index >= queue.length && running === 0) resolve();
              else next();
            });
        }
      };
      next();
    });

    spinner?.stop();

    results.sort((a, b) => a.id.localeCompare(b.id));
    const summary = {
      totals: { items: results.length, passed, failed },
      byType: {
        ...(scope.changes ? { change: summarizeType(results, 'change') } : {}),
        ...(scope.contracts ? { contract: summarizeType(results, 'contract') } : {}),
      },
    } as const;

    if (opts.json) {
      const out = { items: results, summary, version: '1.0' };
      console.log(JSON.stringify(out, null, 2));
    } else {
      for (const res of results) {
        if (res.valid) console.log(`✓ ${res.type}/${res.id}`);
        else console.error(`✗ ${res.type}/${res.id}`);
      }
      console.log(`Totals: ${summary.totals.passed} passed, ${summary.totals.failed} failed (${summary.totals.items} items)`);
    }

    process.exitCode = failed > 0 ? 1 : 0;
  }

}

/** Contracts are addressed by Element identity; their storage unit comes from the model index. */
async function validateElementContract(validator: Validator, identity: string): Promise<ValidationReport> {
  const parsed = await readFormalSemanticModel(process.cwd());
  const element = parsed.model.elements.find(item => item.declaration.identity === identity);
  if (!element) {
    return { valid: false, issues: [{ level: 'ERROR', path: 'file', message: `Element not found: ${identity}` }], summary: { errors: 1, warnings: 0, info: 0 } };
  }
  return validator.validateElementContract(element, parsed.index.moduleOf(identity)?.path ?? `elements/${identity}.md`);
}

function mergeValidationReports(...reports: ValidationReport[]): ValidationReport {
  const issues = reports.flatMap((report) => report.issues);
  const errors = reports.reduce((sum, report) => sum + report.summary.errors, 0);
  const warnings = reports.reduce((sum, report) => sum + report.summary.warnings, 0);
  const info = reports.reduce((sum, report) => sum + report.summary.info, 0);
  const valid = reports.every((report) => report.valid);

  return {
    valid,
    issues,
    summary: {
      errors,
      warnings,
      info,
    },
  };
}

function summarizeType(results: BulkItemResult[], type: ItemType) {
  const filtered = results.filter(r => r.type === type);
  const items = filtered.length;
  const passed = filtered.filter(r => r.valid).length;
  const failed = items - passed;
  return { items, passed, failed };
}

function normalizeConcurrency(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return n;
}

function getPlannedId(index: number, changeIds: string[], contractIds: string[]): string | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return changeIds[index];
  const contractIndex = index - totalChanges;
  return contractIds[contractIndex];
}

function getPlannedType(index: number, changeIds: string[], contractIds: string[]): ItemType | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return 'change';
  const contractIndex = index - totalChanges;
  if (contractIndex >= 0 && contractIndex < contractIds.length) return 'contract';
  return undefined;
}
