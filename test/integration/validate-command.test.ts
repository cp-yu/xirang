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
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract required children [area] } }
  element area { xirang { contract optional parents [project] children [operation] } }
  element operation { xirang { contract required parents [area] } }
  element artifact { xirang { contract optional parents [operation] } }
  relationship invokes
  relationship produces { xirang { sourceKinds [operation] targetKinds [artifact] } }
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
    const spec = path.join(root, '.xirang', 'specs', 'project-contract');
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
    const change = path.join(root, '.xirang', 'changes', name);
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
    const domains = path.join(root, '.xirang', 'architecture', 'domains');
    await fs.mkdir(domains, { recursive: true });
    await fs.writeFile(path.join(root, '.xirang', 'architecture', 'specification.c4'), 'specification { element domain element capability }');
    await fs.writeFile(path.join(domains, 'core.c4'), "model { core = domain 'Core' }");
    await fs.writeFile(path.join(root, '.xirang', 'architecture', 'views.c4'), 'views { view index { include * } }');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should validate LikeC4 architecture', async () => {
    const result = await validateArchitectureCommand(root, { runLikeC4: vi.fn().mockResolvedValue(undefined) });
    expect(result.success).toBe(true);
  });

  it('should apply v1 semantic validation without rewriting the source', async () => {
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    const modelPath = path.join(architecture, 'model.c4');
    const source = `xirang { languageVersion '1' }
      specification { element project { xirang { root true contract required } } element product { xirang { contract optional } } }
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
    const change = path.join(root, '.xirang', 'changes', 'invalid-native');
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
    await fs.writeFile(delta, `architectureDelta {
  ADDED {
    element 'payment.run' {
      kind 'operation'
      parent 'payments'
      title 'Run'
      summary 'Run payments'
      metadata { elementId 'payment.run' }
    }
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
    await fs.writeFile(delta, `architectureDelta {
  ADDED {
    relationship 'payments' -[invokes]-> 'settlements'
    relationship 'payments' -[invokes]-> 'settlements'
  }
}
`);

    const result = await validateArchitectureCommand(root, { deltaPath: delta });

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ code: 'CONFLICTING_IDENTITY_OPERATIONS' }));
  });

  it('should validate graph and Specs in one v1 target context', async () => {
    await writeV1Project();
    await writeChange('combined-target', `architectureDelta {
  ADDED {
    element 'payment.run' {
      kind 'operation'
      parent 'payments'
      title 'Run'
      summary 'Run payments'
      metadata { elementId 'payment.run' }
    }
  }
}
`, 'payment.run');

    const result = await runCLI(['validate', '--change', 'combined-target', '--json'], { cwd: root });

    expect(result.exitCode, `${result.stderr}\n${result.stdout}`).toBe(0);
    expect(JSON.parse(result.stdout).items[0]).toMatchObject({ valid: true, issues: [] });
  });

  it.each([
    {
      name: 'missing-target',
      delta: `architectureDelta { ADDED { element 'payment.run' { kind 'operation' parent 'payments.missing' title 'Run' summary 'Run payments' metadata { elementId 'payment.run' } } } }`,
      message: 'UNKNOWN_PARENT',
    },
    {
      name: 'invalid-endpoint',
      delta: `architectureDelta { ADDED {
  element 'payment.run' { kind 'operation' parent 'payments' title 'Run' summary 'Run payments' metadata { elementId 'payment.run' } }
  element 'payment.store' { kind 'operation' parent 'payments' title 'Store' summary 'Store receipts' metadata { elementId 'payment.store' } }
  element 'payment.receipt' { kind 'artifact' parent 'payment.store' title 'Receipt' summary 'Receipt data' metadata { elementId 'payment.receipt' } }
  relationship 'payment.receipt' -[produces]-> 'payment.run'
} }`,
      message: 'INVALID_RELATIONSHIP_SOURCE_KIND',
    },
    {
      name: 'invalid-containment',
      delta: `architectureDelta { ADDED { element 'payment.receipt' { kind 'artifact' parent 'payments' title 'Receipt' summary 'Receipt data' metadata { elementId 'payment.receipt' } } } }`,
      message: 'INVALID_PARENT_KIND',
    },
    {
      name: 'duplicate-identity',
      delta: `architectureDelta { ADDED { element 'project.root' { kind 'operation' parent 'payments' title 'Run' summary 'Run payments' metadata { elementId 'project.root' } } } }`,
      message: 'ADDED_IDENTITY_EXISTS',
    },
  ])('should reject $name in the combined v1 target', async ({ name, delta, message }) => {
    await writeV1Project();
    await writeChange(name, delta);

    const result = await runCLI(['validate', '--change', name, '--json'], { cwd: root });

    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain(message);
  });
});
