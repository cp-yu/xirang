import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateArchitectureCommand } from '../../src/commands/arch/validate.js';
import { validateArchitectureDelta } from '../../src/validation/architecture-delta-validator.js';
import { runCLI } from '../helpers/run-cli.js';

describe('LikeC4 validation integration', () => {
  let root: string;
  const validDeltaSpec = (element: string) => `---
element: ${element}
---
## ADDED Requirements

### Requirement: Run payment

The system SHALL run the payment operation.

#### Scenario: Run

- **WHEN** payment is requested
- **THEN** the operation runs
`;

  async function writeV1Project() {
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), `opsx { languageVersion '1' }
specification {
  element project { opsx { root true contract required children [area] } }
  element area { opsx { contract optional parents [project] children [operation] } }
  element operation { opsx { contract required parents [area] } }
  element artifact { opsx { contract optional parents [operation] } }
  relationship invokes
  relationship produces { opsx { sourceKinds [operation] targetKinds [artifact] } }
}
model {
  projectRoot = project 'Root' 'Project intent' {
    metadata { elementId 'project.root' }
    payments = area 'Payments' 'Payment area' {
      metadata { elementId 'payments' }
    }
    settlements = area 'Settlements' 'Settlement area' {
      metadata { elementId 'settlements' }
    }
  }
}
`);
    const spec = path.join(root, '.opsx', 'specs', 'project-contract');
    await fs.mkdir(spec, { recursive: true });
    await fs.writeFile(path.join(spec, 'spec.md'), `---
element: project.root
---
# Project

## Purpose
Project contract for validation.

## Requirements

### Requirement: Project intent

The project SHALL preserve its intent.

#### Scenario: Preserve

- **WHEN** the model changes
- **THEN** the intent remains
`);
  }

  async function writeChange(name: string, deltaContent: string, specElement?: string) {
    const change = path.join(root, '.opsx', 'changes', name);
    await fs.mkdir(change, { recursive: true });
    await fs.writeFile(path.join(change, 'proposal.md'), '# Change');
    await fs.writeFile(path.join(change, 'architecture-delta.c4'), deltaContent);
    if (specElement) {
      const spec = path.join(change, 'specs', 'run-payment');
      await fs.mkdir(spec, { recursive: true });
      await fs.writeFile(path.join(spec, 'spec.md'), validDeltaSpec(specElement));
    } else {
      await fs.writeFile(path.join(change, '.specs-noop'), '');
    }
    return change;
  }

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-likec4-validation-'));
    const domains = path.join(root, '.opsx', 'architecture', 'domains');
    await fs.mkdir(domains, { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'architecture', 'specification.c4'), 'specification { element domain element capability }');
    await fs.writeFile(path.join(domains, 'core.c4'), "model { core = domain 'Core' }");
    await fs.writeFile(path.join(root, '.opsx', 'architecture', 'views.c4'), 'views { view index { include * } }');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should validate LikeC4 architecture', async () => {
    const result = await validateArchitectureCommand(root, { runLikeC4: vi.fn().mockResolvedValue(undefined) });
    expect(result.success).toBe(true);
  });

  it('should apply v1 semantic validation without rewriting the source', async () => {
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    const modelPath = path.join(architecture, 'model.c4');
    const source = `opsx { languageVersion '1' }
      specification { element project { opsx { root true contract required } } element product { opsx { contract optional } } }
      model { product = product 'Product' 'Product intent' { metadata { elementId 'product.main' } } }`;
    await fs.writeFile(modelPath, source);

    const result = await validateArchitectureCommand(root, { runLikeC4: vi.fn().mockResolvedValue(undefined) });

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ code: 'MISSING_PROJECT_ROOT' }));
    expect(await fs.readFile(modelPath, 'utf8')).toBe(source);
  });

  it('should validate architecture-delta.c4', async () => {
    const delta = path.join(root, 'architecture-delta.c4');
    await fs.writeFile(delta, "model { extend core { added = capability 'Added' } }");
    expect(await validateArchitectureDelta(root, delta)).toEqual({ valid: true, issues: [] });
  });

  it('should use native LikeC4 validation for change deltas', async () => {
    const change = path.join(root, '.opsx', 'changes', 'invalid-native');
    await fs.mkdir(change, { recursive: true });
    await fs.writeFile(path.join(change, 'proposal.md'), '# Invalid native delta');
    await fs.writeFile(path.join(change, '.specs-noop'), '');
    await fs.writeFile(path.join(change, 'architecture-delta.c4'), "model { core.missing -> core.other }");
    const result = await runCLI(['validate', '--change', 'invalid-native', '--json'], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('architecture-delta.c4');
  });

  it('should check extend target exists', async () => {
    const delta = path.join(root, 'architecture-delta.c4');
    await fs.writeFile(delta, "model { extend missing { added = capability 'Added' } }");
    const result = await validateArchitectureDelta(root, delta);
    expect(result.valid).toBe(false);
    expect(result.issues[0].message).toBe('Cannot extend nonexistent domain: missing');
  });

  it('should validate a v1 graph target through arch validate --delta', async () => {
    await writeV1Project();
    const delta = path.join(root, 'architecture-delta.c4');
    await fs.writeFile(delta, `model {
  extend projectRoot.payments {
    run = operation 'Run' 'Run payments' { metadata { elementId 'payment.run' } }
  }
}
`);

    const result = await validateArchitectureCommand(root, {
      deltaPath: delta,
      runLikeC4: vi.fn().mockResolvedValue(undefined),
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid v1 relations in a delta target', async () => {
    await writeV1Project();
    const delta = path.join(root, 'architecture-delta.c4');
    await fs.writeFile(delta, `model {
  projectRoot.payments -[invokes]-> projectRoot.settlements
  projectRoot.payments -[invokes]-> projectRoot.settlements
}
`);

    const result = await validateArchitectureDelta(root, delta);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ message: expect.stringContaining('DUPLICATE_RELATION') }));
  });

  it('should validate graph and Specs in one v1 target context', async () => {
    await writeV1Project();
    await writeChange('combined-target', `model {
  extend projectRoot.payments {
    run = operation 'Run' 'Run payments' {
      metadata { elementId 'payment.run' }
    }
  }
}
`, 'payment.run');

    const result = await runCLI(['validate', '--change', 'combined-target', '--json'], { cwd: root });

    expect(result.exitCode, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).items[0]).toMatchObject({ valid: true, issues: [] });
  });

  it.each([
    {
      name: 'missing-target',
      delta: `model { extend projectRoot.payments.missing { run = operation 'Run' 'Run payments' { metadata { elementId 'payment.run' } } } }`,
      message: 'projectRoot.payments.missing',
    },
    {
      name: 'invalid-endpoint',
      delta: `model {
  extend projectRoot.payments {
    run = operation 'Run' 'Run payments' { metadata { elementId 'payment.run' } }
    store = operation 'Store' 'Store receipts' {
      metadata { elementId 'payment.store' }
      receipt = artifact 'Receipt' 'Receipt data' { metadata { elementId 'payment.receipt' } }
    }
  }
  projectRoot.payments.store.receipt -[produces]-> projectRoot.payments.run
}`,
      message: 'INVALID_RELATION_ENDPOINT',
    },
    {
      name: 'invalid-containment',
      delta: `model { extend projectRoot.payments { receipt = artifact 'Receipt' 'Receipt data' { metadata { elementId 'payment.receipt' } } } }`,
      message: 'INVALID_CONTAINMENT',
    },
    {
      name: 'duplicate-identity',
      delta: `model { extend projectRoot.payments { run = operation 'Run' 'Run payments' { metadata { elementId 'project.root' } } } }`,
      message: 'DUPLICATE_ELEMENT_ID',
    },
  ])('should reject $name in the combined v1 target', async ({ name, delta, message }) => {
    await writeV1Project();
    await writeChange(name, delta);

    const result = await runCLI(['validate', '--change', name, '--json'], { cwd: root });

    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain(message);
  });
});
