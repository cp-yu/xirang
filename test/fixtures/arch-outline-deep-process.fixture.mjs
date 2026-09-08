import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  formatArchitectureOutlineMarkdown,
  formatArchitectureOutlineText,
  outlineArchitecture,
} from '../../dist/commands/arch/outline.js';
import {
  formatArchitectureSnapshotMarkdown,
  formatArchitectureSnapshotText,
} from '../../dist/commands/arch/snapshot.js';
import { impactArchitecture } from '../../dist/commands/arch/impact.js';

const mode = process.argv[2];
const depth = mode === 'depths' ? 20_000 : 1_000;
const identities = Array.from({ length: depth }, (_, index) => `element-${String(index).padStart(4, '0')}`);

function list(key, values) {
  return `${key}:\n${values.map(item => `  - ${item}\n`).join('')}`;
}

function elementUnit(identity, kind, parent) {
  return `---\nentity: element-declaration\nidentity: ${identity}\nkind: ${kind}\nparent: ${parent === null ? 'null' : parent}\ntitle: ${JSON.stringify(identity)}\ndefinition: ${JSON.stringify(`Definition of ${identity}.`)}\n---\n`;
}

async function writeDeepModel(root) {
  const modelRoot = path.join(root, '.xirang', 'model');
  await Promise.all(['metamodel', 'elements', 'relationships', 'views'].map(partition =>
    fs.mkdir(path.join(modelRoot, partition), { recursive: true })));
  await fs.writeFile(path.join(modelRoot, 'metamodel', 'project.md'),
    `---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n${list('children', ['capability'])}---\n`, 'utf8');
  await fs.writeFile(path.join(modelRoot, 'metamodel', 'capability.md'),
    `---\nentity: element-kind\nidentity: capability\ncontract: optional\n${list('parents', ['project', 'capability'])}${list('children', ['capability'])}---\n`, 'utf8');
  const elements = [
    ...identities.slice(1).reverse().map((identity, index) => elementUnit(identity, 'capability', identities[depth - index - 2])),
    elementUnit(identities[0], 'project', null),
  ];
  // Write in bounded batches: 20k concurrent open handles exhaust the fd
  // limit on macOS and Windows (Linux tolerates it).
  const BATCH = 256;
  for (let start = 0; start < elements.length; start += BATCH) {
    await Promise.all(elements.slice(start, start + BATCH).map((content, offset) => {
      const index = start + offset;
      const identity = index < depth - 1 ? identities[depth - index - 1] : identities[0];
      return fs.writeFile(path.join(modelRoot, 'elements', `${identity}.md`), content, 'utf8');
    }));
  }
}

async function writeLeafModel(root) {
  const modelRoot = path.join(root, '.xirang', 'model');
  await Promise.all(['metamodel', 'elements', 'relationships', 'views'].map(partition =>
    fs.mkdir(path.join(modelRoot, partition), { recursive: true })));
  await fs.writeFile(path.join(modelRoot, 'metamodel', 'project.md'),
    `---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n${list('children', ['capability'])}---\n`, 'utf8');
  await fs.writeFile(path.join(modelRoot, 'metamodel', 'capability.md'),
    `---\nentity: element-kind\nidentity: capability\ncontract: optional\n${list('parents', ['project'])}children: []\n---\n`, 'utf8');
  await fs.writeFile(path.join(modelRoot, 'elements', 'project.root.md'),
    elementUnit('project.root', 'project', null), 'utf8');
  await fs.writeFile(path.join(modelRoot, 'elements', 'leaf.md'),
    elementUnit('leaf', 'capability', 'project.root'), 'utf8');
}

if (mode === 'depths') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-outline-deep-'));
  try {
    await writeDeepModel(root);
    const result = await outlineArchitecture(root);
    if (result.elements.find(element => element.identity === identities.at(-1))?.depth !== depth - 1) {
      throw new Error('deepest Element depth mismatch');
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
} else if (mode === 'formatters') {
  const elements = identities.map((identity, index) => ({
    identity,
    kind: index === 0 ? 'project' : 'capability',
    title: identity,
    parent: index === 0 ? null : identities[index - 1],
    children: index === depth - 1 ? [] : [identities[index + 1]],
    depth: index,
    definitionState: 'unloaded',
  }));
  const result = {
    elementDefinitionDepth: 0,
    elements,
    relations: [],
    metamodel: { elementKinds: [], relationshipKinds: [] },
    statistics: { elementCount: elements.length, relationshipCount: 0, kindCount: 0, loadedDefinitionCount: 0 },
  };
  if (!formatArchitectureOutlineText(result).includes(identities.at(-1))) throw new Error('text output omitted deepest Element');
  if (!formatArchitectureOutlineMarkdown(result).includes(identities.at(-1))) throw new Error('Markdown output omitted deepest Element');
} else if (mode === 'snapshot-formatters') {
  const elements = identities.map((identity, index) => ({
    identity,
    kind: index === 0 ? 'project' : 'capability',
    definition: `Definition of ${identity}.`,
    parent: index === 0 ? null : identities[index - 1],
    children: index === depth - 1 ? [] : [identities[index + 1]],
  }));
  const result = {
    elements,
    relations: [],
    metamodel: { elementKinds: [], relationshipKinds: [] },
    statistics: { elementCount: elements.length, relationshipCount: 0, kindCount: 0 },
  };
  if (!formatArchitectureSnapshotText(result).includes(identities.at(-1))) throw new Error('snapshot text output omitted deepest Element');
  if (!formatArchitectureSnapshotMarkdown(result).includes(identities.at(-1))) throw new Error('snapshot Markdown output omitted deepest Element');
} else if (mode === 'impact-leaf') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-impact-leaf-'));
  try {
    await writeLeafModel(root);
    const result = await impactArchitecture(root, ['leaf'], { depth: Number.MAX_SAFE_INTEGER });
    if (result.refinementContext.some(context => context.direction === 'descendant')) {
      throw new Error('leaf impact returned descendant context');
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
