import type { Command } from 'commander';
import { compileChange, readFormalSemanticModel } from '../../core/change-compiler.js';
import type { ElementDeclaration, SemanticModel } from '../../core/model/types.js';
import type { ChangeDiagnostic } from '../../core/semantic-diff.js';

export type RemovalDependencyType = 'descendant' | 'relationship';

export interface RemovalDependency {
  type: RemovalDependencyType;
  identity: string;
  detail: string;
}

export interface RemovalPlan {
  subject: { id: string; title: string };
  change: string | null;
  context: Array<{ type: 'parent'; identity: string; detail: string }>;
  handled: RemovalDependency[];
  unresolved: RemovalDependency[];
  requiredCount: number;
  diagnostics: ChangeDiagnostic[];
}

function dependencyKey(item: RemovalDependency): string {
  return `${item.type}:${item.identity}`;
}

function dependencies(model: SemanticModel, subject: string): RemovalDependency[] {
  const parents = new Map(model.elements.map(element => [element.declaration.identity, element.declaration.parent]));
  const result: RemovalDependency[] = [];

  for (const identity of parents.keys()) {
    if (identity === subject) continue;
    let parent = parents.get(identity) ?? null;
    while (parent) {
      if (parent === subject) {
        result.push({ type: 'descendant', identity: `element:${identity}`, detail: `${identity} remains contained by ${subject}` });
        break;
      }
      parent = parents.get(parent) ?? null;
    }
  }

  for (const relationship of model.relationships) {
    if (relationship.source !== subject && relationship.target !== subject) continue;
    result.push({
      type: 'relationship',
      identity: `relationship:${relationship.source}|${relationship.kind}|${relationship.target}`,
      detail: `${relationship.source} -[${relationship.kind}]-> ${relationship.target}`,
    });
  }
  return result.sort((left, right) => dependencyKey(left).localeCompare(dependencyKey(right)));
}

function findDeclaration(models: SemanticModel[], identity: string): ElementDeclaration | undefined {
  for (const model of models) {
    const found = model.elements.find(element => element.declaration.identity === identity);
    if (found) return found.declaration;
  }
  return undefined;
}

export async function planRemove(
  projectRoot: string,
  identity: string,
  change?: string,
): Promise<RemovalPlan> {
  const formal = (await readFormalSemanticModel(projectRoot)).model;
  const compiled = change ? await compileChange(projectRoot, change) : null;
  if (compiled && compiled.target === null) {
    throw new Error(compiled.diagnostics.map(item => `${item.code}: ${item.message}`).join('\n'));
  }
  const target = compiled?.target ?? formal;
  const subject = findDeclaration([target, formal], identity);
  if (!subject) throw new Error(`Element not found: ${identity}`);

  const formalDependencies = dependencies(formal, subject.identity);
  const unresolved = dependencies(target, subject.identity);
  const unresolvedKeys = new Set(unresolved.map(dependencyKey));
  const handled = change ? formalDependencies.filter(item => !unresolvedKeys.has(dependencyKey(item))) : [];
  const parent = findDeclaration([target, formal], subject.identity)?.parent ?? null;
  const parentElement = parent ? findDeclaration([target, formal], parent) : undefined;

  return {
    subject: { id: subject.identity, title: subject.title },
    change: change ?? null,
    context: parentElement ? [{ type: 'parent', identity: `element:${parentElement.identity}`, detail: parentElement.title }] : [],
    handled,
    unresolved,
    requiredCount: unresolved.length,
    diagnostics: compiled?.diagnostics ?? [],
  };
}

export function renderRemovalPlan(plan: RemovalPlan): string {
  const lines = [
    `Removal plan: ${plan.subject.id}`,
    `Required before target can validate: ${plan.requiredCount}`,
    '',
    'Handled',
    ...(plan.handled.length ? plan.handled.map(item => `  ✓ ${item.type}: ${item.identity}`) : ['  None.']),
    '',
    'Unresolved',
    ...(plan.unresolved.length ? plan.unresolved.map(item => `  - ${item.type}: ${item.identity}`) : ['  None.']),
  ];
  if (plan.context.length) lines.push('', 'Context', ...plan.context.map(item => `  ${item.type}: ${item.identity}`));
  if (plan.diagnostics.length) lines.push('', 'Diagnostics', ...plan.diagnostics.map(item => `  ${item.level} ${item.code}: ${item.message}`));
  return `${lines.join('\n')}\n`;
}

export function registerPlanRemoveCommand(arch: Command): void {
  arch
    .command('plan-remove <element-id>')
    .description('Plan explicit reconciliation required before removing an Element')
    .option('--change <name>', 'Analyze a selected active change target')
    .option('--json', 'Output structured JSON')
    .action(async (identity: string, options: { change?: string; json?: boolean }) => {
      try {
        const result = await planRemove(process.cwd(), identity, options.change);
        if (options.json) console.log(JSON.stringify(result, null, 2));
        else console.log(renderRemovalPlan(result).trimEnd());
        process.exitCode = 0;
      } catch (error) {
        console.error((error as Error).message);
        process.exitCode = 1;
      }
    });
}
