import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCLI } from '../helpers/run-cli.js';

const architecture = `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract optional } }
  element capability { xirang { contract optional parents [project] } }
  relationship invokes
}
model {
  project_root = project 'Root' 'Root summary' {
    metadata { elementId 'project.root' }
    existing = capability 'Existing' 'Existing summary' {
      metadata { elementId 'existing.id' status 'active' }
    }
  }
}
`;

const formalSpec = `---
element: existing.id
---

# Existing

## Purpose
Existing contract.

## Requirements

### Requirement: Existing behavior
The system SHALL return the existing result.

#### Scenario: Existing scenario
- **WHEN** the behavior runs
- **THEN** the existing result is returned
`;

const changeSpec = `---
element: existing.id
---

## MODIFIED Requirements

### Requirement: Existing behavior
The system SHALL return the changed result.

#### Scenario: Existing scenario
- **WHEN** the behavior runs
- **THEN** the changed result is returned
`;

const validDelta = `architectureDelta {
  MODIFIED {
    element 'existing.id' {
      kind 'capability'
      parent 'project.root'
      title 'Existing'
      summary 'Changed summary'
      metadata { elementId 'existing.id' }
    }
  }
}
`;

describe('diff command', () => {
  const root = path.join(process.cwd(), 'test-diff-command-tmp');
  const changeDir = path.join(root, '.xirang', 'changes', 'change-a');

  beforeEach(async () => {
    await fs.mkdir(path.join(root, '.xirang', 'architecture'), { recursive: true });
    await fs.mkdir(path.join(root, '.xirang', 'specs', 'existing'), { recursive: true });
    await fs.mkdir(path.join(changeDir, 'specs', 'existing'), { recursive: true });
    await fs.writeFile(path.join(root, '.xirang', 'architecture', 'model.c4'), architecture);
    await fs.writeFile(path.join(root, '.xirang', 'specs', 'existing', 'spec.md'), formalSpec);
    await fs.writeFile(path.join(changeDir, 'specs', 'existing', 'spec.md'), changeSpec);
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), validDelta);
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('projects one compiled result to JSON and scope-filtered text', async () => {
    const jsonResult = await runCLI(['diff', '--change', 'change-a', '--json'], { cwd: root });
    const specsResult = await runCLI(['diff', '--change', 'change-a', '--scope', 'specs'], { cwd: root });
    const architectureResult = await runCLI(['diff', '--change', 'change-a', '--scope', 'architecture'], { cwd: root });

    expect(jsonResult.stderr).toBe('');
    expect(jsonResult.exitCode).toBe(0);
    const json = JSON.parse(jsonResult.stdout);
    expect(json).toMatchObject({ schemaVersion: '1', change: 'change-a', valid: true });
    expect(json.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ scope: 'specs', kind: 'requirement', identity: 'existing#Existing behavior' }),
      expect.objectContaining({ scope: 'architecture', kind: 'element', identity: 'existing.id' }),
    ]));
    expect(specsResult.stdout).toContain('Specs');
    expect(specsResult.stdout).not.toContain('Architecture\n');
    expect(architectureResult.stdout).toContain('Architecture');
    expect(architectureResult.stdout).not.toContain('Specs\n');
    expect(await fs.readdir(changeDir)).not.toContain('effective-change.md');
  });

  it('retains Architecture diff when a malformed change Spec makes the result invalid', async () => {
    await fs.writeFile(path.join(changeDir, 'specs', 'existing', 'spec.md'), `---
element: existing.id
---

## MODIFIED Requirements

### Requirement: Existing behavior
This text has no normative keyword.
`);

    const result = await runCLI(['diff', '--change', 'change-a', '--json'], { cwd: root });
    const json = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(1);
    expect(json.valid).toBe(false);
    expect(json.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining('specs/existing/spec.md') }),
    ]));
    expect(json.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ scope: 'architecture', kind: 'element', identity: 'existing.id' }),
    ]));
  });

  it('writes deterministic reports and replaces stale success with a failed report', async () => {
    const first = await runCLI(['diff', '--change', 'change-a', '--write'], { cwd: root });
    const reportPath = path.join(changeDir, 'effective-change.md');
    expect(first.stderr).toBe('');
    const firstReport = await fs.readFile(reportPath, 'utf8');
    const second = await runCLI(['diff', '--change', 'change-a', '--write'], { cwd: root });
    const secondReport = await fs.readFile(reportPath, 'utf8');

    expect(first.exitCode).toBe(0);
    expect(second.exitCode).toBe(0);
    expect(secondReport).toBe(firstReport);
    expect(firstReport).toContain('Status: Passed');
    expect(firstReport).not.toContain('generatedAt');

    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `architectureDelta { ADDED { extend root { } } }`);
    const failed = await runCLI(['diff', '--change', 'change-a', '--write'], { cwd: root });
    const failedReport = await fs.readFile(reportPath, 'utf8');

    expect(failed.exitCode).toBe(1);
    expect(failedReport).toContain('Status: Failed');
    expect(failedReport).not.toBe(firstReport);
    expect(failedReport).toContain('Unsupported architecture delta syntax: extend');
  });
});
