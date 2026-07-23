import type { Command } from 'commander';
import { compileChange, readFormalSemanticModel } from '../../core/change-compiler.js';
import type { ChangeDiagnostic } from '../../core/semantic-diff.js';
import type { SemanticElement, TargetSemanticModel } from '../../utils/semantic-model.js';

export type RemovalDependencyType = 'descendant' | 'relationship' | 'spec-binding' | 'reference';

export interface RemovalDependency {
  type: RemovalDependencyType;
  identity: string;
  detail: string;
}

export interface RemovalPlan {
  subject: { id: string; fqn: string; title: string };
  change: string | null;
  context: Array<{ type: 'parent'; identity: string; detail: string }>;
  handled: RemovalDependency[];
  unresolved: RemovalDependency[];
  requiredCount: number;
  diagnostics: ChangeDiagnostic[];
}

function relationIdentity(source: string, kind: string, target: string): string {
  return `${source}|${kind}|${target}`;
}

function dependencyKey(item: RemovalDependency): string {
  return `${item.type}:${item.identity}`;
}

function containsReference(value: string | string[], subject: string): boolean {
  return Array.isArray(value) ? value.includes(subject) : value === subject;
}

function dependencies(model: TargetSemanticModel, subject: string): RemovalDependency[] {
  const elements = new Map(model.architecture.elements.map(element => [element.id, element]));
  const result: RemovalDependency[] = [];

  for (const element of model.architecture.elements) {
    if (element.id === subject) continue;
    let parent = element.parent;
    while (parent) {
      if (parent === subject) {
        result.push({ type: 'descendant', identity: `element:${element.id}`, detail: `${element.id} remains contained by ${subject}` });
        break;
      }
      parent = elements.get(parent)?.parent ?? null;
    }
    for (const [key, value] of Object.entries(element.metadata)) {
      if (containsReference(value, subject)) result.push({
        type: 'reference', identity: `reference:${element.id}:metadata.${key}`,
        detail: `${element.id} metadata.${key} references ${subject}`,
      });
    }
  }

  for (const relation of model.architecture.relations) {
    if (relation.source === subject || relation.target === subject) result.push({
      type: 'relationship',
      identity: `relationship:${relationIdentity(relation.source, relation.kind, relation.target)}`,
      detail: `${relation.source} -[${relation.kind}]-> ${relation.target}`,
    });
  }
  for (const contract of model.contracts) {
    if (contract.elementId === subject) result.push({
      type: 'spec-binding', identity: `spec:${contract.specId}`, detail: `${contract.specId} binds ${subject}`,
    });
  }
  return result.sort((left, right) => dependencyKey(left).localeCompare(dependencyKey(right)));
}

function findSubject(models: TargetSemanticModel[], identityOrFqn: string): SemanticElement | undefined {
  for (const model of models) {
    const found = model.architecture.elements.find(element => element.id === identityOrFqn || element.fqn === identityOrFqn);
    if (found) return found;
  }
  return undefined;
}

export async function planRemove(
  projectRoot: string,
  identityOrFqn: string,
  change?: string,
): Promise<RemovalPlan> {
  const formal = await readFormalSemanticModel(projectRoot);
  const compiled = change ? await compileChange(projectRoot, change) : null;
  if (compiled && compiled.target === null) {
    throw new Error(compiled.diagnostics.map(item => `${item.code}: ${item.message}`).join('\n'));
  }
  const target = compiled?.target ?? formal;
  const subject = findSubject([target, formal], identityOrFqn);
  if (!subject) throw new Error(`Element not found: ${identityOrFqn}`);

  const formalDependencies = dependencies(formal, subject.id);
  const unresolved = dependencies(target, subject.id);
  const unresolvedKeys = new Set(unresolved.map(dependencyKey));
  const handled = change ? formalDependencies.filter(item => !unresolvedKeys.has(dependencyKey(item))) : [];
  const parent = target.architecture.elements.find(item => item.id === subject.id)?.parent
    ?? formal.architecture.elements.find(item => item.id === subject.id)?.parent;
  const parentElement = parent
    ? target.architecture.elements.find(item => item.id === parent) ?? formal.architecture.elements.find(item => item.id === parent)
    : undefined;

  return {
    subject: { id: subject.id, fqn: subject.fqn, title: subject.title },
    change: change ?? null,
    context: parentElement ? [{ type: 'parent', identity: `element:${parentElement.id}`, detail: parentElement.title }] : [],
    handled,
    unresolved,
    requiredCount: unresolved.length,
    diagnostics: compiled?.diagnostics ?? [],
  };
}

export function renderRemovalPlan(plan: RemovalPlan): string {
  const lines = [
    `Removal plan: ${plan.subject.id}`,
    `Current FQN: ${plan.subject.fqn}`,
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
    .command('plan-remove <element-id-or-fqn>')
    .description('Plan explicit reconciliation required before removing an architecture element')
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
