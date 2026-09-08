import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  formatArchitectureOutlineMarkdown,
  formatArchitectureOutlineText,
  outlineArchitecture,
} from '../../src/commands/arch/outline.js';
import { writeProjectModel } from '../helpers/model-fixture.js';

const CONTRACT = '## Requirements\n\n### Requirement: Hidden behavior\nThe system SHALL behave.\n\n#### Scenario: Hidden scenario\n- **WHEN** invoked\n- **THEN** it works';
const execFileAsync = promisify(execFile);

describe('architecture outline', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-outline-'));
    await writeProjectModel(root, {
      elementKinds: [
        {
          identity: 'project',
          contract: 'required',
          root: true,
          children: ['area'],
          body: 'Project kind definition.',
        },
        {
          identity: 'area',
          parents: ['project'],
          children: ['capability'],
          body: 'Area kind definition.',
        },
        {
          identity: 'capability',
          parents: ['area'],
          children: ['operation'],
          body: 'Capability kind definition.',
        },
        {
          identity: 'operation',
          parents: ['capability'],
          body: 'Operation kind definition.',
        },
      ],
      relationshipKinds: [
        {
          identity: 'invokes',
          sourceKinds: ['operation'],
          targetKinds: ['operation'],
          body: 'Invokes kind definition.',
        },
      ],
      elements: [
        {
          identity: 'project.root',
          kind: 'project',
          parent: null,
          title: 'Project',
          definition: 'Project definition.',
          requirements: CONTRACT,
        },
        {
          identity: 'payments',
          kind: 'area',
          parent: 'project.root',
          title: 'Payments',
          definition: 'Payments definition.',
        },
        {
          identity: 'payment-processing',
          kind: 'capability',
          parent: 'payments',
          title: 'Payment Processing',
          definition: 'Processing definition.',
        },
        {
          identity: 'authorize-payment',
          kind: 'operation',
          parent: 'payment-processing',
          title: 'Authorize Payment',
          definition: 'Authorization definition.',
          requirements: CONTRACT,
        },
        {
          identity: 'audit-payment',
          kind: 'operation',
          parent: 'payment-processing',
          title: 'Audit Payment',
          definition: 'Audit definition.',
        },
      ],
      relationships: [
        { source: 'authorize-payment', kind: 'invokes', target: 'audit-payment' },
      ],
      views: [{ identity: 'payments-view' }],
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('projects the complete hierarchy, relationships, and metamodel without Views or Contracts', async () => {
    const result = await outlineArchitecture(root);

    expect(result.elements.map(element => element.identity)).toEqual([
      'audit-payment',
      'authorize-payment',
      'payment-processing',
      'payments',
      'project.root',
    ]);
    expect(result.elements.find(element => element.identity === 'project.root')).toMatchObject({
      title: 'Project',
      parent: null,
      children: ['payments'],
      depth: 0,
    });
    expect(result.elements.find(element => element.identity === 'authorize-payment')).toMatchObject({
      parent: 'payment-processing',
      depth: 3,
    });
    expect(result.relations).toEqual([
      { source: 'authorize-payment', kind: 'invokes', target: 'audit-payment' },
    ]);
    expect(result.metamodel.elementKinds).toContainEqual(expect.objectContaining({
      identity: 'project',
      contract: 'required',
      root: true,
      children: ['area'],
      body: 'Project kind definition.',
    }));
    expect(result.metamodel.relationshipKinds).toContainEqual(expect.objectContaining({
      identity: 'invokes',
      sourceKinds: ['operation'],
      targetKinds: ['operation'],
      body: 'Invokes kind definition.',
    }));
    expect(JSON.stringify(result)).not.toMatch(/payments-view|Hidden behavior|Hidden scenario|requirements|scenarios/);
  });

  it('loads complete Definitions through depth 2 by default and omits deeper Definitions', async () => {
    const result = await outlineArchitecture(root);

    expect(result.elementDefinitionDepth).toBe(2);
    for (const element of result.elements.filter(element => element.depth <= 2)) {
      expect(element.definitionState).toBe('loaded');
      expect(element.definition).toBeTypeOf('string');
    }
    for (const element of result.elements.filter(element => element.depth > 2)) {
      expect(element.definitionState).toBe('unloaded');
      expect(element).not.toHaveProperty('definition');
    }
  });

  it('uses project config and supports a stateless one-shot depth override', async () => {
    const configDir = path.join(root, '.xirang');
    const configPath = path.join(configDir, 'config.yaml');
    await fs.writeFile(configPath, `schema: semantic-model
architecture:
  outline:
    elementDefinitionDepth: 1
`);

    const configured = await outlineArchitecture(root);
    const overridden = await outlineArchitecture(root, { definitionDepth: 0 });
    const repeated = await outlineArchitecture(root);

    expect(configured.elementDefinitionDepth).toBe(1);
    expect(configured.elements.filter(element => element.definitionState === 'loaded').map(element => element.depth))
      .toEqual([1, 0]);
    expect(overridden.elementDefinitionDepth).toBe(0);
    expect(overridden.elements.filter(element => element.definitionState === 'loaded').map(element => element.identity))
      .toEqual(['project.root']);
    expect(repeated).toEqual(configured);
    expect(await fs.readFile(configPath, 'utf8')).toContain('elementDefinitionDepth: 1');
  });

  it('renders text and markdown from the canonical result without truncating Definitions', async () => {
    const result = await outlineArchitecture(root, { definitionDepth: 1 });
    const text = formatArchitectureOutlineText(result);
    const markdown = formatArchitectureOutlineMarkdown(result);

    expect(text).toContain('project.root (project) Project');
    expect(text).toContain('Project definition.');
    expect(text).toContain('payment-processing (capability) Payment Processing | [definition unloaded]');
    expect(text).toMatch(/└── |├── /);
    expect(markdown).toContain('- project.root (project) Project');
    expect(markdown).toContain('  - payments (area) Payments');
    expect(markdown).toContain('[definition unloaded]');
    expect(`${text}\n${markdown}`).not.toContain('...');
  });

  it.each(['depths', 'formatters'])('handles deep hierarchy %s without call-stack recursion', async mode => {
    const fixture = path.join(process.cwd(), 'test', 'fixtures', 'arch-outline-deep-process.fixture.mjs');

    // A 20k-deep chain overflows a 512KB stack only if outline work recurses
    // per depth level; the headroom above --stack-size=128 absorbs V8 frame
    // size variance on macOS arm64 and Windows. 90s covers slow Windows fs.
    await expect(execFileAsync(process.execPath, [
      '--stack-size=512',
      fixture,
      mode,
    ], { cwd: process.cwd(), timeout: 90_000 })).resolves.toMatchObject({ stderr: '' });
  }, 120_000);

  it('is deterministic and does not create project state', async () => {
    const before = (await fs.readdir(root, { recursive: true })).sort();
    const first = await outlineArchitecture(root);
    const second = await outlineArchitecture(root);
    const after = (await fs.readdir(root, { recursive: true })).sort();

    expect(second).toEqual(first);
    expect(after).toEqual(before);
  });
});
