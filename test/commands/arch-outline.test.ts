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
import { runCLI } from '../helpers/run-cli.js';
import { writeProjectModel } from '../helpers/model-fixture.js';

const CONTRACT = '## Specification\n\n### Section: Hidden behavior\nThe system SHALL behave.\n\n#### Acceptance Case: Hidden acceptanceCase\n- **WHEN** invoked\n- **THEN** it works';
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
          sections: CONTRACT,
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
          sections: CONTRACT,
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
  }, 180_000); // deep tests create 20k files; removal exceeds 30s on Windows/macOS

  it('defaults to hierarchy navigation and expands semantic partitions only when selected', async () => {
    const navigation = await outlineArchitecture(root);
    expect(navigation.elements[0]).toMatchObject({ identity: expect.any(String), kind: expect.any(String), title: expect.any(String), depth: expect.any(Number) });
    expect(navigation.elements.every(element => !('definition' in element) && !('definitionState' in element))).toBe(true);
    expect(navigation).not.toHaveProperty('relations');
    expect(navigation).not.toHaveProperty('metamodel');

    const expanded = await outlineArchitecture(root, { definitions: true, relationships: true, metamodel: true });
    expect(expanded.definitionDepth).toBe(2);
    expect(expanded.relations).toEqual([{ source: 'authorize-payment', kind: 'invokes', target: 'audit-payment' }]);
    expect(expanded.metamodel).toBeDefined();
    expect(expanded.metamodel!.elementKinds).toHaveLength(4);
    expect(expanded.elements.filter(element => element.depth <= 2).every(element => element.definitionState === 'loaded' && typeof element.definition === 'string')).toBe(true);
    expect(expanded.elements.filter(element => element.depth > 2).every(element => element.definitionState === 'unloaded' && !('definition' in element))).toBe(true);
  });

  it('CLI defaults to navigation and supports explicit projection flags', async () => {
    const navigation = await runCLI(['arch', 'outline', '--format', 'json'], { cwd: root });
    const expanded = await runCLI([
      'arch', 'outline', '--definitions', '--relationships', '--metamodel', '--format', 'json',
    ], { cwd: root });
    expect(navigation.exitCode).toBe(0);
    expect(JSON.parse(navigation.stdout)).not.toHaveProperty('relations');
    expect(JSON.parse(navigation.stdout)).not.toHaveProperty('metamodel');
    expect(JSON.parse(navigation.stdout).elements.every((element: object) => !('definition' in element))).toBe(true);
    expect(expanded.exitCode).toBe(0);
    expect(JSON.parse(expanded.stdout).relations).toHaveLength(1);
    expect(JSON.parse(expanded.stdout).metamodel.elementKinds).toHaveLength(4);
  });

  it('projects the complete hierarchy without Views or Contracts', async () => {
    const result = await outlineArchitecture(root, { definitions: true, relationships: true, metamodel: true });

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
    expect(result.metamodel).toBeDefined();
    expect(result.metamodel!.elementKinds).toContainEqual(expect.objectContaining({
      identity: 'project',
      contract: 'required',
      root: true,
      children: ['area'],
      body: 'Project kind definition.',
    }));
    expect(result.metamodel!.relationshipKinds).toContainEqual(expect.objectContaining({
      identity: 'invokes',
      sourceKinds: ['operation'],
      targetKinds: ['operation'],
      body: 'Invokes kind definition.',
    }));
    expect(JSON.stringify(result)).not.toMatch(/payments-view|Hidden behavior|Hidden acceptanceCase|sections|acceptanceCases/);
  });

  it('loads complete Definitions through configured depth when selected', async () => {
    const result = await outlineArchitecture(root, { definitions: true });

    expect(result.definitionDepth).toBe(2);
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
    definitionDepth: 1
`);

    const configured = await outlineArchitecture(root, { definitions: true });
    const overridden = await outlineArchitecture(root, { definitionDepth: 0 });
    const repeated = await outlineArchitecture(root, { definitions: true });

    expect(configured.definitionDepth).toBe(1);
    expect(configured.elements.filter(element => element.definitionState === 'loaded').map(element => element.depth))
      .toEqual([1, 0]);
    expect(overridden.definitionDepth).toBe(0);
    expect(overridden.elements.filter(element => element.definitionState === 'loaded').map(element => element.identity))
      .toEqual(['project.root']);
    expect(repeated).toEqual(configured);
    expect(await fs.readFile(configPath, 'utf8')).toContain('definitionDepth: 1');
  });

  it('renders text and markdown from the canonical result without truncating Definitions', async () => {
    const result = await outlineArchitecture(root, { definitions: true, relationships: true, metamodel: true });
    const text = formatArchitectureOutlineText(result);
    const markdown = formatArchitectureOutlineMarkdown(result);

    expect(text).toContain('project.root (project) Project');
    expect(text).toContain('Project definition.');
    expect(text).toContain('payment-processing (capability) Payment Processing | Processing definition.');
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
    // size variance on macOS arm64 and Windows. A recursion bug fails fast via
    // stack overflow, while slow filesystems (WSL2 DrvFS tmpdirs) only inflate
    // wall-clock time, so 240s keeps the timing budget from masking a pass.
    await expect(execFileAsync(process.execPath, [
      '--stack-size=512',
      fixture,
      mode,
    ], { cwd: process.cwd(), timeout: 240_000 })).resolves.toMatchObject({ stderr: '' });
  }, 300_000);

  it('is deterministic and does not create project state', async () => {
    const before = (await fs.readdir(root, { recursive: true })).sort();
    const first = await outlineArchitecture(root);
    const second = await outlineArchitecture(root);
    const after = (await fs.readdir(root, { recursive: true })).sort();

    expect(second).toEqual(first);
    expect(after).toEqual(before);
  });
});
