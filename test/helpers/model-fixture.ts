import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PARTITIONS } from '../../src/core/model/types.js';

export interface ElementFixture {
  identity: string;
  kind?: string;
  parent?: string | null;
  title?: string;
  definition?: string;
  requirements?: string;
}

export interface ElementKindFixture {
  identity: string;
  contract?: 'required' | 'optional';
  root?: boolean;
  parents?: string[];
  children?: string[];
  body?: string;
}

export interface ModelFixture {
  elementKinds?: ElementKindFixture[];
  relationshipKinds?: Array<{ identity: string; sourceKinds?: string[]; targetKinds?: string[]; body?: string }>;
  elements?: ElementFixture[];
  relationships?: Array<{ source: string; kind: string; target: string }>;
  views?: Array<{ identity: string; include?: string; exclude?: string }>;
}

function list(key: string, values?: string[]): string {
  if (values === undefined) return '';
  if (values.length === 0) return `${key}: []\n`;
  return `${key}:\n${values.map(item => `  - ${item}\n`).join('')}`;
}

export function elementKindUnit(kind: ElementKindFixture): string {
  const content = `---\nentity: element-kind\nidentity: ${kind.identity}\ncontract: ${kind.contract ?? 'optional'}\n`
    + (kind.root ? 'root: true\n' : '')
    + list('parents', kind.parents)
    + list('children', kind.children)
    + `---\n${kind.body ?? ''}`;
  return content.endsWith('\n') ? content : `${content}\n`;
}

export function elementUnit(element: ElementFixture): string {
  const frontmatter = `---\nentity: element-declaration\nidentity: ${element.identity}\n`
    + `kind: ${element.kind ?? 'capability'}\n`
    + `parent: ${element.parent === undefined ? 'root' : element.parent === null ? 'null' : element.parent}\n`
    + `title: ${JSON.stringify(element.title ?? element.identity)}\n`
    + `definition: ${JSON.stringify(element.definition ?? `Definition of ${element.identity}.`)}\n---\n`;
  return element.requirements ? `${frontmatter}\n${element.requirements}\n` : frontmatter;
}

/** Writes a four-partition Semantic Model below `root` (a model root, not the project root). */
export async function writeModel(root: string, fixture: ModelFixture): Promise<void> {
  for (const partition of PARTITIONS) await fs.mkdir(path.join(root, partition), { recursive: true });
  for (const kind of fixture.elementKinds ?? []) {
    await fs.writeFile(path.join(root, 'metamodel', `${kind.identity}.md`), elementKindUnit(kind), 'utf8');
  }
  for (const kind of fixture.relationshipKinds ?? []) {
    const content = `---\nentity: relationship-kind\nidentity: ${kind.identity}\n`
      + list('sourceKinds', kind.sourceKinds) + list('targetKinds', kind.targetKinds) + `---\n${kind.body ?? ''}`;
    await fs.writeFile(
      path.join(root, 'metamodel', `${kind.identity}.md`),
      content.endsWith('\n') ? content : `${content}\n`,
      'utf8',
    );
  }
  for (const element of fixture.elements ?? []) {
    await fs.writeFile(path.join(root, 'elements', `${element.identity}.md`), elementUnit(element), 'utf8');
  }
  const byKind = new Map<string, string[]>();
  for (const relationship of fixture.relationships ?? []) {
    byKind.set(relationship.kind, [
      ...(byKind.get(relationship.kind) ?? []),
      `  - source: ${relationship.source}\n    kind: ${relationship.kind}\n    target: ${relationship.target}\n`,
    ]);
  }
  for (const [kind, entries] of byKind) {
    await fs.writeFile(path.join(root, 'relationships', `${kind}.yaml`), `relationships:\n${entries.join('')}`, 'utf8');
  }
  for (const view of fixture.views ?? []) {
    await fs.writeFile(path.join(root, 'views', `${view.identity}.md`),
      `---\nentity: authored-view\nidentity: ${view.identity}\ninclude: ${view.include ?? '"*"'}\n`
      + (view.exclude === undefined ? '' : `exclude: ${view.exclude}\n`)
      + '---\n', 'utf8');
  }
}

/** The canonical minimal model: one root kind, one Project Root. */
export function minimalModel(overrides: ModelFixture = {}): ModelFixture {
  return {
    elementKinds: [
      { identity: 'project', root: true },
      { identity: 'domain' },
      { identity: 'capability' },
      ...(overrides.elementKinds ?? []),
    ],
    elements: [
      { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: 'Project root definition.' },
      ...(overrides.elements ?? []),
    ],
    relationshipKinds: overrides.relationshipKinds,
    relationships: overrides.relationships,
    views: overrides.views,
  };
}

export async function writeProjectModel(projectRoot: string, fixture: ModelFixture): Promise<void> {
  await writeModel(path.join(projectRoot, '.xirang', 'model'), fixture);
}

export async function writeChangeDelta(
  projectRoot: string,
  changeName: string,
  files: Record<string, string>,
): Promise<string> {
  const changeDir = path.join(projectRoot, '.xirang', 'changes', changeName);
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(changeDir, ...relative.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf8');
  }
  return changeDir;
}
