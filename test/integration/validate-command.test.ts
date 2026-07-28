import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateArchitectureCommand } from '../../src/commands/arch/validate.js';
import { readModelTree } from '../../src/core/model/parser.js';
import { modelRoot } from '../../src/core/model/paths.js';
import { runCLI } from '../helpers/run-cli.js';
import { writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

const PROJECT_CONTRACT = '## Requirements\n\n### Requirement: Project intent\nThe project SHALL preserve its intent.\n\n#### Scenario: Preserve\n- **WHEN** the model changes\n- **THEN** the intent remains';
const OPERATION_CONTRACT = '## Requirements\n\n### Requirement: Run payment\nThe system SHALL run the payment operation.\n\n#### Scenario: Run\n- **WHEN** payment is requested\n- **THEN** the operation runs';

describe('Semantic Model validation integration', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-model-validation-'));
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', contract: 'required', root: true, children: ['area'] },
        { identity: 'area', parents: ['project'], children: ['operation'] },
        { identity: 'operation', contract: 'required', parents: ['area'] },
        { identity: 'artifact', parents: ['operation'] },
      ],
      relationshipKinds: [
        { identity: 'invokes' },
        { identity: 'produces', sourceKinds: ['operation'], targetKinds: ['artifact'] },
      ],
      elements: [
        { identity: 'project.root', kind: 'project', parent: null, title: 'Root', definition: 'Project intent', requirements: PROJECT_CONTRACT },
        { identity: 'payments', kind: 'area', parent: 'project.root', title: 'Payments', definition: 'Payment area' },
        { identity: 'settlements', kind: 'area', parent: 'project.root', title: 'Settlements', definition: 'Settlement area' },
      ],
    });
    await fs.mkdir(path.join(root, '.xirang', 'changes'), { recursive: true });
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  async function writeChange(name: string, files: Record<string, string>): Promise<string> {
    const change = await writeChangeDelta(root, name, files);
    await fs.writeFile(path.join(change, 'proposal.md'), '# Change');
    return change;
  }

  function addOperation(identity: string, parent: string, contract = OPERATION_CONTRACT): string {
    return `---\noperation: ADDED\nentity: element-declaration\nidentity: ${identity}\nkind: operation\nparent: ${parent}\ntitle: Run\ndefinition: Run payment\n---\n\n`
      + `## ADDED Requirements\n\n${contract.replace('## Requirements\n\n', '')}\n`;
  }

  it('validates the Formal Semantic Model', async () => {
    expect(await validateArchitectureCommand(root)).toEqual({ success: true, errors: [], warnings: [] });
  });

  it('applies semantic validation without rewriting the source', async () => {
    const before = await readModelTree(modelRoot(root));
    await fs.writeFile(path.join(modelRoot(root), 'elements', 'orphan.md'),
      '---\nentity: element-declaration\nidentity: orphan\nkind: area\nparent: ghost\ntitle: Orphan\ndefinition: S\n---\n');

    const result = await validateArchitectureCommand(root);

    expect(result.success).toBe(false);
    expect(result.errors.map(item => item.code)).toContain('MISSING_PARENT');
    for (const [file, bytes] of before) {
      expect((await readModelTree(modelRoot(root))).get(file)).toEqual(bytes);
    }
  });

  it('validates the Expected Semantic Model of a change', async () => {
    await writeChange('add-operation', { 'elements/payment.run.md': addOperation('payment.run', 'payments') });

    const result = await validateArchitectureCommand(root, { change: 'add-operation' });

    expect(result, JSON.stringify(result)).toMatchObject({ success: true, errors: [] });
  });

  it('rejects an unknown containment target in a change', async () => {
    await writeChange('bad-parent', { 'elements/payment.run.md': addOperation('payment.run', 'ghost') });

    const result = await validateArchitectureCommand(root, { change: 'bad-parent' });

    expect(result.success).toBe(false);
    expect(result.errors.map(item => item.code)).toContain('MISSING_PARENT');
  });

  it('rejects invalid relation endpoints in a change target', async () => {
    await writeChange('bad-relation', {
      'elements/payment.run.md': addOperation('payment.run', 'payments'),
      'relationships/produces.yaml': 'relationships:\n  - operation: ADDED\n    source: payment.run\n    kind: produces\n    target: payments\n',
    });

    const result = await validateArchitectureCommand(root, { change: 'bad-relation' });

    expect(result.success).toBe(false);
    expect(result.errors.map(item => item.code)).toContain('INVALID_RELATION_ENDPOINT');
  });

  it('rejects a required Contract missing from the change target', async () => {
    await writeChange('missing-contract', {
      'elements/payment.run.md': '---\noperation: ADDED\nentity: element-declaration\nidentity: payment.run\nkind: operation\nparent: payments\ntitle: Run\ndefinition: Run payment\n---\n',
    });

    const result = await validateArchitectureCommand(root, { change: 'missing-contract' });

    expect(result.success).toBe(false);
    expect(result.errors.map(item => item.code)).toContain('MISSING_REQUIRED_CONTRACT');
  });

  it('validates the Semantic Model and Contracts in one change target through the CLI', async () => {
    await writeChange('cli-change', { 'elements/payment.run.md': addOperation('payment.run', 'payments') });

    const result = await runCLI(['arch', 'validate', '--change', 'cli-change', '--json'], { cwd: root });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ success: true, errors: [] });
  });

  it('no longer accepts the removed --delta option', async () => {
    const result = await runCLI(['arch', 'validate', '--delta', 'anything.c4'], { cwd: root });

    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("unknown option '--delta'");
  });
});
