import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { Validator } from '../../src/core/validation/validator.js';

describe('validateChangeDeltaSpecs cross-check against main spec', () => {
  const testDir = path.join(process.cwd(), 'test-cross-check-tmp');
  // Layout: <testDir>/.opsx/changes/test-change/specs/<cap>/spec.md
  //         <testDir>/.opsx/specs/<cap>/spec.md
  const changeDir = path.join(testDir, '.opsx', 'changes', 'test-change');
  const mainSpecsDir = path.join(testDir, '.opsx', 'specs');

  beforeEach(async () => {
    await fs.mkdir(path.join(changeDir, 'specs'), { recursive: true });
    await fs.mkdir(mainSpecsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function writeChangeSpec(capName: string, content: string) {
    const dir = path.join(changeDir, 'specs', capName);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'spec.md'), content);
  }

  async function writeMainSpec(capName: string, content: string) {
    const dir = path.join(mainSpecsDir, capName);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'spec.md'), content);
  }

  async function writeArchitecture(capIds: string[]) {
    const architectureDir = path.join(testDir, '.opsx', 'architecture');
    await fs.mkdir(path.join(architectureDir, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architectureDir, 'domains', 'test.c4'), `model {
  test = domain 'Test' {
${capIds.map((id, index) => `    capability_${index} = capability 'Test capability ${index}' {
      metadata { capabilityId '${id}' }
    }`).join('\n')}
  }
}
`);
  }

  async function writeV1Architecture() {
    const architectureDir = path.join(testDir, '.opsx', 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    await fs.writeFile(path.join(architectureDir, 'model.c4'), `opsx { languageVersion '1' }
specification {
  element project { opsx { root true contract required } }
  element workflow { opsx { contract required } }
  element note { opsx { contract optional } }
}
model {
  projectRoot = project 'Root' 'Project intent' {
    metadata { elementId 'project.root' }
    run = workflow 'Run' 'Run workflow' { metadata { elementId 'workflow.run' } }
    note = note 'Note' 'Optional note' { metadata { elementId 'note.info' } }
  }
}
`);
  }

  const mainSpecWithHeaders = (headers: string[]) => {
    const reqs = headers.map(h => `### Requirement: ${h}\nThe system SHALL do ${h}.\n\n#### Scenario: ${h} works\n- **WHEN** foo\n- **THEN** bar\n`).join('\n');
    return `# Test Spec\n\n## Purpose\nTest spec for cross-check validation.\n\n## Requirements\n\n${reqs}`;
  };

  const deltaSpec = (section: string, reqName: string) => {
    if (section === 'REMOVED') {
      return `## ${section} Requirements\n\n### Requirement: ${reqName}\n`;
    }
    if (section === 'RENAMED') {
      return `## RENAMED Requirements\n\n- FROM: \`### Requirement: ${reqName}\`\n- TO: \`### Requirement: New Name\`\n`;
    }
    return `## ${section} Requirements\n\n### Requirement: ${reqName}\nThe system SHALL do something.\n\n#### Scenario: Test\n- **WHEN** action\n- **THEN** result\n`;
  };

  it('should report ERROR when MODIFIED header not found in main spec', async () => {
    await writeMainSpec('foo', mainSpecWithHeaders(['Existing Header']));
    await writeChangeSpec('foo', deltaSpec('MODIFIED', 'Non Existent'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    const issue = report.issues.find(i => i.message.includes('MODIFIED') && i.message.includes('not found in main spec'));
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('ERROR');
    expect(issue!.message).toContain('Non Existent');
    expect(issue!.message).toContain('ADDED Requirements');
  });

  it('should report ERROR when ADDED header already exists in main spec', async () => {
    await writeMainSpec('foo', mainSpecWithHeaders(['Already Here']));
    await writeChangeSpec('foo', deltaSpec('ADDED', 'Already Here'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    const issue = report.issues.find(i => i.message.includes('ADDED') && i.message.includes('already exists'));
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('ERROR');
    expect(issue!.message).toContain('Already Here');
    expect(issue!.message).toContain('MODIFIED Requirements');
  });

  it('should report ERROR when REMOVED header not found in main spec', async () => {
    await writeMainSpec('foo', mainSpecWithHeaders(['Something Else']));
    await writeChangeSpec('foo', deltaSpec('REMOVED', 'Ghost'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    const issue = report.issues.find(i => i.message.includes('REMOVED') && i.message.includes('not found in main spec'));
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('ERROR');
    expect(issue!.message).toContain('Ghost');
  });

  it('should report ERROR when RENAMED FROM header not found in main spec', async () => {
    await writeMainSpec('foo', mainSpecWithHeaders(['Other']));
    await writeChangeSpec('foo', deltaSpec('RENAMED', 'Missing'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    const issue = report.issues.find(i => i.message.includes('RENAMED FROM') && i.message.includes('not found in main spec'));
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('ERROR');
    expect(issue!.message).toContain('Missing');
  });

  it('should report ERROR when main spec does not exist and MODIFIED is used', async () => {
    // No main spec written for 'nonexistent'
    await writeChangeSpec('nonexistent', deltaSpec('MODIFIED', 'Something'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    const issue = report.issues.find(i => i.message.includes('MODIFIED') && i.message.includes('non-existent main spec'));
    expect(issue).toBeDefined();
    expect(issue!.level).toBe('ERROR');
  });

  it('should pass when main spec does not exist and only ADDED is used', async () => {
    // No main spec for 'brand-new'
    await writeChangeSpec('brand-new', deltaSpec('ADDED', 'New Feature'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(true);
    expect(report.issues.filter(i => i.level === 'ERROR')).toHaveLength(0);
  });

  it('should match headers case-insensitively', async () => {
    await writeMainSpec('foo', mainSpecWithHeaders(['Foo Bar']));
    // MODIFIED with different case — should match
    await writeChangeSpec('foo', deltaSpec('MODIFIED', 'foo bar'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    const crossCheckErrors = report.issues.filter(i => i.message.includes('not found in main spec'));
    expect(crossCheckErrors).toHaveLength(0);
  });

  it('should pass when MODIFIED scenario operation labels are valid', async () => {
    await writeMainSpec('foo', mainSpecWithHeaders(['Valid Header']));
    await writeChangeSpec('foo', `## MODIFIED Requirements

### Requirement: Valid Header
The system SHALL do something.

#### Scenario: [MODIFIED] Existing path
- **WHEN** action
- **THEN** result

#### Scenario: [ADDED] New path
- **WHEN** new action
- **THEN** new result

#### Scenario: [REMOVED] Old path
- **WHEN** old action
- **THEN** old result
`);

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.issues.filter(i => i.level === 'ERROR')).toHaveLength(0);
  });

  it('should pass when MODIFIED header exists in main spec', async () => {
    await writeMainSpec('foo', mainSpecWithHeaders(['Valid Header']));
    await writeChangeSpec('foo', deltaSpec('MODIFIED', 'Valid Header'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    const crossCheckErrors = report.issues.filter(i => i.message.includes('not found in main spec') || i.message.includes('already exists'));
    expect(crossCheckErrors).toHaveLength(0);
  });

  it('should pass when ADDED header does not exist in main spec', async () => {
    await writeMainSpec('foo', mainSpecWithHeaders(['Existing']));
    await writeChangeSpec('foo', deltaSpec('ADDED', 'Brand New'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    const crossCheckErrors = report.issues.filter(i => i.message.includes('already exists'));
    expect(crossCheckErrors).toHaveLength(0);
  });

  it('should warn when frontmatter capability does not exist in LikeC4', async () => {
    await writeArchitecture(['cap.cli.archive']);
    await writeMainSpec('foo', `---
capabilities:
  - cap.cli.archive
  - cap.nonexistent
---
${mainSpecWithHeaders(['Existing'])}`);
    await writeChangeSpec('delta', deltaSpec('ADDED', 'Brand New'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    const warnings = report.issues.filter(i => i.level === 'WARNING');
    expect(warnings.some(i => i.message.includes('cap.nonexistent') && i.message.includes('foo'))).toBe(true);
    expect(warnings.some(i => i.message.includes('cap.cli.archive'))).toBe(false);
  });

  it('should report informational issues when main spec has no frontmatter capabilities', async () => {
    await writeArchitecture(['cap.cli.archive']);
    await writeMainSpec('foo', mainSpecWithHeaders(['Existing']));
    await writeMainSpec('empty-caps', `---
capabilities: []
---
${mainSpecWithHeaders(['Existing'])}`);
    await writeChangeSpec('delta', deltaSpec('ADDED', 'Brand New'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    const informational = report.issues.filter(i => i.level === 'INFO');
    expect(informational.some(i => i.message.includes('foo') && i.message.includes('capabilities frontmatter'))).toBe(true);
    expect(informational.some(i => i.message.includes('empty-caps') && i.message.includes('capabilities frontmatter'))).toBe(true);
  });

  it('should skip capability existence check when LikeC4 architecture is missing', async () => {
    await writeMainSpec('foo', `---
capabilities:
  - cap.nonexistent
---
${mainSpecWithHeaders(['Existing'])}`);
    await writeMainSpec('legacy', mainSpecWithHeaders(['Existing']));
    await writeChangeSpec('delta', deltaSpec('ADDED', 'Brand New'));

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.issues.some(i => i.message.includes('cap.nonexistent'))).toBe(false);
    expect(report.issues.some(i => i.level === 'INFO' && i.message.includes('legacy'))).toBe(true);
  });

  it('validates v1 formal and change-local singular bindings together', async () => {
    await writeV1Architecture();
    await writeMainSpec('project-contract', `---\nelement: project.root\n---\n${mainSpecWithHeaders(['Project'])}`);
    await writeChangeSpec('workflow-contract', `---\nelement: workflow.run\n---\n${deltaSpec('ADDED', 'Run')}`);

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.issues.filter(issue => issue.level === 'ERROR')).toEqual([]);
  });

  it('rejects v1 unknown, missing, legacy, and multiple-owner bindings', async () => {
    await writeV1Architecture();
    await writeMainSpec('project-contract', `---\nelement: project.root\n---\n${mainSpecWithHeaders(['Project'])}`);
    await writeMainSpec('unknown-owner', `---\nelement: missing.element\n---\n${mainSpecWithHeaders(['Unknown'])}`);
    await writeMainSpec('missing-owner', mainSpecWithHeaders(['Missing']));
    await writeMainSpec('legacy-owner', `---\ncapabilities: [cap.workflow.run]\n---\n${mainSpecWithHeaders(['Legacy'])}`);
    await writeMainSpec('multiple-owner', `---\nelement: [workflow.run, project.root]\n---\n${mainSpecWithHeaders(['Multiple'])}`);
    await writeChangeSpec('workflow-contract', `---\nelement: workflow.run\n---\n${deltaSpec('ADDED', 'Run')}`);

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ level: 'ERROR', path: expect.stringContaining('unknown-owner'), message: expect.stringContaining('missing.element') }),
      expect.objectContaining({ level: 'ERROR', path: expect.stringContaining('missing-owner'), message: expect.stringContaining('MISSING_SPEC_ELEMENT') }),
      expect.objectContaining({ level: 'ERROR', path: expect.stringContaining('legacy-owner'), message: expect.stringContaining('LEGACY_SPEC_OWNERSHIP') }),
      expect.objectContaining({ level: 'ERROR', path: expect.stringContaining('multiple-owner'), message: expect.stringContaining('MULTIPLE_SPEC_OWNERS') }),
    ]));
  });

  it('reports uncovered required contracts while allowing optional elements without Specs', async () => {
    await writeV1Architecture();
    await writeMainSpec('project-contract', `---\nelement: project.root\n---\n${mainSpecWithHeaders(['Project'])}`);
    await writeChangeSpec('project-delta', `---\nelement: project.root\n---\n${deltaSpec('ADDED', 'More Project')}`);

    const report = await new Validator().validateChangeDeltaSpecs(changeDir);

    expect(report.issues).toContainEqual(expect.objectContaining({
      level: 'ERROR',
      message: expect.stringContaining('MISSING_REQUIRED_CONTRACT'),
    }));
    expect(report.issues.some(issue => issue.message.includes('note.info'))).toBe(false);
  });
});
