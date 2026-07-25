import { XIRANG_DIR_NAME } from '../core/config.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import ora from 'ora';
import path from 'path';
import { Validator } from '../core/validation/validator.js';
import { isInteractive, resolveNoInteractive } from '../utils/interactive.js';
import { getActiveChangeIds, getSpecIds } from '../utils/item-discovery.js';
import { nearestMatches } from '../utils/match.js';
import type { ValidationReport } from '../core/validation/types.js';
import { buildUpdatedSpec, findSpecUpdates } from '../core/specs-apply.js';
import { extractRequirementsSection } from '../core/parsers/requirement-blocks.js';
import { validateArchitecture } from '../utils/architecture-validator.js';
import { readLikeC4Architecture } from '../utils/likec4-reader.js';
import { validateArchitectureCommand } from './arch/validate.js';
import { compileChange, type CompiledChange } from '../core/change-compiler.js';
import { conciseDiffEntries, renderChangeDiff } from '../core/change-diff-renderer.js';

type ItemType = 'change' | 'spec';
type ArtifactScope = 'specs' | 'architecture-delta';

interface ExecuteOptions {
  all?: boolean;
  changes?: boolean;
  specs?: boolean;
  change?: string;
  artifacts?: string;
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
      await this.validateExplicitChange(options.change, {
        artifactScope: this.normalizeArtifactScope(options.artifacts),
        rawArtifactScope: options.artifacts,
        strict: !!options.strict,
        json: !!options.json,
      });
      return;
    }

    if (options.artifacts) {
      console.error('--artifacts requires --change <name>. Supported artifact scopes: specs, architecture-delta');
      process.exitCode = 1;
      return;
    }

    // Handle bulk flags first
    if (options.all || options.changes || options.specs) {
      await this.runBulkValidation({
        changes: !!options.all || !!options.changes,
        specs: !!options.all || !!options.specs,
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
    await this.validateDirectItem(itemName, { typeOverride, strict: !!options.strict, json: !!options.json });
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'spec') return v;
    return undefined;
  }

  private normalizeArtifactScope(value?: string): ArtifactScope | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'specs' || v === 'architecture-delta') return v;
    return undefined;
  }

  private async runInteractiveSelector(opts: { strict: boolean; json: boolean; concurrency?: string }): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    const choice = await select({
      message: 'What would you like to validate?',
      choices: [
        { name: 'All (changes + specs)', value: 'all' },
        { name: 'All changes', value: 'changes' },
        { name: 'All specs', value: 'specs' },
        { name: 'Pick a specific change or spec', value: 'one' },
      ],
    });

    if (choice === 'all') return this.runBulkValidation({ changes: true, specs: true }, opts);
    if (choice === 'changes') return this.runBulkValidation({ changes: true, specs: false }, opts);
    if (choice === 'specs') return this.runBulkValidation({ changes: false, specs: true }, opts);

    // one
    const [changes, specs] = await Promise.all([getActiveChangeIds(), getSpecIds()]);
    const items: { name: string; value: { type: ItemType; id: string } }[] = [];
    items.push(...changes.map(id => ({ name: `change/${id}`, value: { type: 'change' as const, id } })));
    items.push(...specs.map(id => ({ name: `spec/${id}`, value: { type: 'spec' as const, id } })));
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
    console.error('  xirang validate --specs');
    console.error('  xirang validate <item-name>');
    console.error('Or run in an interactive terminal.');
  }

  private async validateDirectItem(itemName: string, opts: { typeOverride?: ItemType; strict: boolean; json: boolean }): Promise<void> {
    const [changes, specs] = await Promise.all([getActiveChangeIds(), getSpecIds()]);
    const isChange = changes.includes(itemName);
    const isSpec = specs.includes(itemName);

    const type = opts.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);

    if (!type) {
      console.error(`Unknown item '${itemName}'`);
      const suggestions = nearestMatches(itemName, [...changes, ...specs]);
      if (suggestions.length) console.error(`Did you mean: ${suggestions.join(', ')}?`);
      process.exitCode = 1;
      return;
    }

    if (!opts.typeOverride && isChange && isSpec) {
      console.error(`Ambiguous item '${itemName}' matches both a change and a spec.`);
      console.error('Pass --type change|spec, or use: xirang change validate / xirang spec validate');
      process.exitCode = 1;
      return;
    }

    await this.validateByType(type, itemName, opts);
  }

  private async validateExplicitChange(id: string, opts: { artifactScope?: ArtifactScope; rawArtifactScope?: string; strict: boolean; json: boolean }): Promise<void> {
    if (opts.rawArtifactScope && !opts.artifactScope) {
      console.error(`Unknown artifact scope '${opts.rawArtifactScope}'. Supported artifact scopes: specs, architecture-delta`);
      process.exitCode = 1;
      return;
    }

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
    const result = opts.artifactScope
      ? { report: await this.validateChangeReports(validator, changeDir, opts.artifactScope) }
      : await this.validateChangeWithPreview(validator, id, changeDir);
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
    const file = path.join(process.cwd(), XIRANG_DIR_NAME, 'specs', id, 'spec.md');
    const start = Date.now();
    const report = await validator.validateSpec(file);
    const durationMs = Date.now() - start;
    this.printReport('spec', id, report, durationMs, opts.json);
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
      console.log(`${type === 'change' ? 'Change' : 'Specification'} '${id}' is valid`);
    } else {
      console.error(`${type === 'change' ? 'Change' : 'Specification'} '${id}' has issues`);
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
  ): Promise<{ report: ValidationReport; compiled?: CompiledChange }> {
    const architecture = await readLikeC4Architecture(process.cwd()).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (architecture?.profile !== 'v1') return { report: await this.validateChangeReports(validator, changeDir) };

    const compiled = await compileChange(process.cwd(), id);
    const specsReport = await validator.validateChangeDeltaSpecs(changeDir, {
      projectRoot: process.cwd(),
      architecture,
      knownElementIds: new Set(compiled.target?.architecture.elements.map(element => element.id) ?? architecture.elements.map(element => element.id)),
      skipSpecBindingValidation: compiled.target !== null,
    });
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
    return { report: mergeValidationReports(specsReport, compilerReport), compiled };
  }

  private printNextSteps(type: ItemType): void {
    const bullets: string[] = [];
    if (type === 'change') {
      bullets.push('- Ensure change has deltas in specs/: use headers ## ADDED/MODIFIED/REMOVED Requirements');
      bullets.push('- Each requirement MUST include at least one #### Scenario: block');
      bullets.push('- Debug parsed deltas: xirang change show <id> --json --deltas-only');
    } else {
      bullets.push('- Ensure spec includes ## Purpose and ## Requirements sections');
      bullets.push('- Each requirement MUST include at least one #### Scenario: block');
      bullets.push('- Re-run with --json to see structured report');
    }
    console.error('Next steps:');
    bullets.forEach(b => console.error(`  ${b}`));
  }

  private async runBulkValidation(scope: { changes: boolean; specs: boolean }, opts: { strict: boolean; json: boolean; concurrency?: string; noInteractive?: boolean }): Promise<void> {
    const spinner = !opts.json && !opts.noInteractive ? ora('Validating...').start() : undefined;
    const [changeIds, specIds] = await Promise.all([
      scope.changes ? getActiveChangeIds() : Promise.resolve<string[]>([]),
      scope.specs ? getSpecIds() : Promise.resolve<string[]>([]),
    ]);

    const DEFAULT_CONCURRENCY = 6;
    const maxSuggestions = 5; // used by nearestMatches
    const concurrency = normalizeConcurrency(opts.concurrency) ?? normalizeConcurrency(process.env.XIRANG_CONCURRENCY) ?? DEFAULT_CONCURRENCY;
    const validator = new Validator(opts.strict);
    const queue: Array<() => Promise<BulkItemResult>> = [];

    for (const id of changeIds) {
      queue.push(async () => {
        const start = Date.now();
        const changeDir = path.join(process.cwd(), XIRANG_DIR_NAME, 'changes', id);
        const report = await this.validateChangeReports(validator, changeDir);
        const durationMs = Date.now() - start;
        return { id, type: 'change' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }
    for (const id of specIds) {
      queue.push(async () => {
        const start = Date.now();
        const file = path.join(process.cwd(), XIRANG_DIR_NAME, 'specs', id, 'spec.md');
        const report = await validator.validateSpec(file);
        const durationMs = Date.now() - start;
        return { id, type: 'spec' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }

    if (queue.length === 0) {
      spinner?.stop();

      const summary = {
        totals: { items: 0, passed: 0, failed: 0 },
        byType: {
          ...(scope.changes ? { change: { items: 0, passed: 0, failed: 0 } } : {}),
          ...(scope.specs ? { spec: { items: 0, passed: 0, failed: 0 } } : {}),
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
              const res: BulkItemResult = { id: getPlannedId(currentIndex, changeIds, specIds) ?? 'unknown', type: getPlannedType(currentIndex, changeIds, specIds) ?? 'change', valid: false, issues: [{ level: 'ERROR', path: 'file', message }], durationMs: 0 };
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
        ...(scope.specs ? { spec: summarizeType(results, 'spec') } : {}),
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

  private async validateChangeReports(validator: Validator, changeDir: string, artifactScope?: ArtifactScope): Promise<ValidationReport> {
    if (artifactScope === 'specs') return validator.validateChangeDeltaSpecs(changeDir);
    if (artifactScope === 'architecture-delta') return this.validateArchitectureDeltaReport(changeDir);

    const formal = await readLikeC4Architecture(process.cwd()).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (formal?.profile === 'v1') return this.validateCombinedV1Change(validator, changeDir);

    const specsReport = await validator.validateChangeDeltaSpecs(changeDir);
    const architectureDelta = path.join(changeDir, 'architecture-delta.c4');
    if (!await fileExists(architectureDelta)) return specsReport;
    return mergeValidationReports(specsReport, await this.validateArchitectureDeltaReport(changeDir));
  }

  private async validateCombinedV1Change(validator: Validator, changeDir: string): Promise<ValidationReport> {
    const projectRoot = process.cwd();
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-combined-validation-'));
    const targetArchitecture = path.join(workspace, XIRANG_DIR_NAME, 'architecture');
    const targetSpecs = path.join(workspace, XIRANG_DIR_NAME, 'specs');
    const architectureDelta = path.join(changeDir, 'architecture-delta.c4');
    try {
      await copySourceTree(path.join(projectRoot, XIRANG_DIR_NAME, 'architecture'), targetArchitecture, true);
      await copySourceTree(path.join(projectRoot, XIRANG_DIR_NAME, 'specs'), targetSpecs);

      if (await fileExists(architectureDelta)) {
        const modulePath = path.join(targetArchitecture, 'deltas', `${path.basename(changeDir)}.c4`);
        await fs.mkdir(path.dirname(modulePath), { recursive: true });
        await fs.copyFile(architectureDelta, modulePath);
      }

      const updates = await findSpecUpdates(changeDir, targetSpecs);
      for (const update of updates) {
        const { rebuilt } = await buildUpdatedSpec(update, path.basename(changeDir), projectRoot);
        if (extractRequirementsSection(rebuilt).bodyBlocks.length === 0) {
          await fs.rm(path.dirname(update.target), { recursive: true, force: true });
          continue;
        }
        await fs.mkdir(path.dirname(update.target), { recursive: true });
        await fs.writeFile(update.target, rebuilt);
      }

      const architecture = await readLikeC4Architecture(workspace);
      const architectureResult = await validateArchitecture(workspace, architecture);
      const graphIssues = architectureResult.errors.map(error => ({
        level: 'ERROR' as const,
        path: 'architecture-delta.c4',
        message: `${error.code}: ${error.message}`,
      }));
      const graphReport: ValidationReport = {
        valid: graphIssues.length === 0,
        issues: graphIssues,
        summary: { errors: graphIssues.length, warnings: 0, info: 0 },
      };
      const specsReport = await validator.validateChangeDeltaSpecs(changeDir, {
        projectRoot: workspace,
        architecture,
        specsDirectory: targetSpecs,
      });
      return mergeValidationReports(graphReport, specsReport);
    } catch (error) {
      const issues = [{
        level: 'ERROR' as const,
        path: await fileExists(architectureDelta) ? 'architecture-delta.c4' : 'file',
        message: (error as Error).message,
      }];
      return { valid: false, issues, summary: { errors: 1, warnings: 0, info: 0 } };
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }

  private async validateArchitectureDeltaReport(changeDir: string): Promise<ValidationReport> {
    try {
      const result = await validateArchitectureCommand(process.cwd(), { deltaPath: path.join(changeDir, 'architecture-delta.c4') });
      const issues = result.errors.map(error => ({ level: 'ERROR' as const, path: 'architecture-delta.c4', message: error.message }));
      return { valid: result.success, issues, summary: { errors: issues.length, warnings: 0, info: 0 } };
    } catch (error) {
      const issues = [{ level: 'ERROR' as const, path: 'architecture-delta.c4', message: (error as Error).message }];
      return { valid: false, issues, summary: { errors: 1, warnings: 0, info: 0 } };
    }
  }
}

async function fileExists(file: string): Promise<boolean> {
  try { await fs.access(file); return true; } catch { return false; }
}

async function copySourceTree(source: string, target: string, excludeLikeC4Cache = false): Promise<void> {
  await fs.mkdir(target, { recursive: true });
  await fs.cp(source, target, {
    recursive: true,
    filter: file => !excludeLikeC4Cache || path.basename(file) !== '.likec4',
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
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

function getPlannedId(index: number, changeIds: string[], specIds: string[]): string | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return changeIds[index];
  const specIndex = index - totalChanges;
  return specIds[specIndex];
}

function getPlannedType(index: number, changeIds: string[], specIds: string[]): ItemType | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return 'change';
  const specIndex = index - totalChanges;
  if (specIndex >= 0 && specIndex < specIds.length) return 'spec';
  return undefined;
}
