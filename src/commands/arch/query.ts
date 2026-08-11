import { deriveLocalNames } from '../../core/likec4/local-names.js';
import type {
  ElementDeclaration,
  Requirement,
  SemanticModel,
} from '../../core/model/types.js';
import { compareCodePoints } from '../../utils/stable-order.js';
import { readValidArchitecture } from './reader.js';

export interface ArchQueryOptions {
  contract?: boolean;
}

export interface QueryElement extends ElementDeclaration {
  contract: 'required' | 'optional';
  hasContract: boolean;
  requirements?: Requirement[];
}

export interface ArchQueryResult {
  elements: Record<string, QueryElement>;
}

function isDerivedFqn(model: SemanticModel, id: string): boolean {
  if (!id.includes('.') || model.elements.length === 0) return false;
  const names = deriveLocalNames(model.elements);
  return model.elements.some(element => names.pathOf(element.declaration.identity) === id);
}

export async function queryArchitecture(
  projectRoot: string,
  elementIds: string[],
  options: ArchQueryOptions = {},
): Promise<ArchQueryResult> {
  const model = await readValidArchitecture(projectRoot);
  const requestedIds = [...new Set(elementIds)].sort(compareCodePoints);
  if (requestedIds.length === 0) {
    throw new Error('At least one Element identity is required');
  }

  const modelElements = new Map(
    model.elements.map(element => [element.declaration.identity, element]),
  );
  for (const identity of requestedIds) {
    if (modelElements.has(identity)) continue;
    if (isDerivedFqn(model, identity)) {
      throw new Error(`Element must use stable identity, not FQN: ${identity}. Use xirang arch search first.`);
    }
    throw new Error(`Element not found: ${identity}`);
  }

  const kinds = new Map(model.elementKinds.map(kind => [kind.identity, kind]));
  const elements = Object.fromEntries(requestedIds.map(identity => {
    const element = modelElements.get(identity)!;
    const result: QueryElement = {
      ...element.declaration,
      contract: kinds.get(element.declaration.kind)?.contract ?? 'optional',
      hasContract: element.requirements.length > 0,
      ...(options.contract ? { requirements: element.requirements } : {}),
    };
    return [identity, result];
  }));

  return { elements };
}

export function formatArchitectureQueryText(result: ArchQueryResult): string {
  const blocks = Object.values(result.elements).map(element => {
    const lines = [
      `Element: ${element.identity}`,
      `Type: ${element.kind}`,
      `Title: ${element.title}`,
      `Definition: ${element.definition}`,
      `Parent: ${element.parent ?? '(none)'}`,
      `Contract: ${element.contract}${element.hasContract ? '' : ' (absent)'}`,
    ];
    const appendBody = (body: string, indentation: string): void => {
      for (const line of body.split('\n')) lines.push(`${indentation}${line}`);
    };
    for (const requirement of element.requirements ?? []) {
      lines.push(`  Requirement: ${requirement.name}`);
      appendBody(requirement.body, '    ');
      for (const scenario of requirement.scenarios) {
        lines.push(`    Scenario: ${scenario.name}`);
        appendBody(scenario.body, '      ');
      }
    }
    return lines.join('\n');
  });
  return blocks.join('\n\n');
}
