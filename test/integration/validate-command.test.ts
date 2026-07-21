import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateArchitectureCommand } from '../../src/commands/arch/validate.js';
import { validateArchitectureDelta } from '../../src/validation/architecture-delta-validator.js';
import { runCLI } from '../helpers/run-cli.js';

describe('LikeC4 validation integration', () => {
  let root: string;
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
});
