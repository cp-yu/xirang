import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { validateTaskStructure } from '../../../src/core/parsers/task-structure.js';

const validTasks = (verifies = '`elements/example.md` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"') => `## 1. Actions

- [ ] A1 Implement validation
- [ ] A2 Refactor parser

## 2. Checks

- [ ] C1 Verify invalid input is rejected
  - Covers: A1
  - Verifies: ${verifies}
  - Test action: reuse
  - Command: \`pnpm test\`

- [ ] C2 Verify behavior is unchanged
  - Covers: A2
  - Verifies: ${verifies}
  - Test action: reuse
  - Evidence: parser fixture output
`;

describe('validateTaskStructure', () => {
  it('accepts the task template Verifies and Preserves path examples', () => {
    const template = fs.readFileSync(path.join(process.cwd(), 'schemas/semantic-model/templates/tasks.md'), 'utf8');
    const verifiesPaths = [...template.matchAll(/- Verifies: `([^`]+)`/g)]
      .map((match) => match[1].replace(/<(?:identity|capability)>/g, 'example'));
    const preservesPath = template.match(/- Preserves: `([^`]+)`/)?.[1]
      .replace(/<(?:identity|capability)>/g, 'example');
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
`,
    });
    const projectRoot = path.dirname(tempDir);
    const formalElementPath = path.join(projectRoot, '.xirang', 'model', 'elements', 'example.md');
    fs.mkdirSync(path.dirname(formalElementPath), { recursive: true });
    fs.writeFileSync(formalElementPath, `## Specification

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
`);

    try {
      expect(verifiesPaths).toHaveLength(2);
      expect(preservesPath).toBeDefined();
      for (const [field, elementPath] of [
        ...verifiesPaths.map((entry) => ['Verifies', entry] as const),
        ['Preserves', preservesPath!] as const,
      ]) {
        const result = validateTaskStructure(`### Task 1: Template path

**Goal**: Validate the template path.

**Files**:
- Test: \`test/core/parsers/task-structure.test.ts\`

**Sections**:
- Keep template examples accepted by the parser

#### Checks

- [ ] C1 Verify template path
  - ${field}: \`${elementPath}\` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"
  - Test action: reuse
  - Command: \`pnpm test\`
`, { changeDir: tempDir });

        expect(result.valid).toBe(true);
        expect(result.issues.map((issue) => issue.code)).not.toContain('invalid-verifies-path');
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
      fs.rmSync(path.join(projectRoot, '.xirang'), { recursive: true, force: true });
    }
  });

  it('accepts Actions and Checks with covered executable checks', () => {
    const result = validateTaskStructure(validTasks('manual verification'));

    expect(result.valid).toBe(true);
    expect(result.actions).toEqual(['A1', 'A2']);
    expect(result.checks).toEqual(['C1', 'C2']);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'verifies-cross-check-skipped',
      'verifies-cross-check-skipped',
    ]);
  });

  it('reports missing sections', () => {
    const result = validateTaskStructure('- [ ] A1 Implement');

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'missing-actions-section',
      'missing-checks-section',
    ]);
  });

  it('reports dangling Covers references', () => {
    const result = validateTaskStructure(`## 1. Actions

- [ ] A1 Implement

## 2. Checks

- [ ] C1 Verify
  - Covers: A2
  - Verifies: manual verification
  - Test action: reuse
  - Expect: behavior passes
`);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('dangling-covers');
  });

  it('reports malformed action and check IDs', () => {
    const result = validateTaskStructure(`## 1. Actions

- [ ] 1.1 Implement

## 2. Checks

- [ ] 2.1 Verify
  - Covers: A1
  - Verifies: manual verification
  - Test action: reuse
  - Expect: behavior passes
`);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('malformed-action-id');
    expect(result.issues.map((issue) => issue.code)).toContain('malformed-check-id');
  });

  it('reports actions not covered by any check', () => {
    const result = validateTaskStructure(`## 1. Actions

- [ ] A1 Implement
- [ ] A2 Implement more

## 2. Checks

- [ ] C1 Verify
  - Covers: A1
  - Verifies: manual verification
  - Test action: reuse
  - Expect: behavior passes
`);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('uncovered-action');
  });

  it('reports checks without Verifies fields', () => {
    const result = validateTaskStructure(`## 1. Actions

- [ ] A1 Implement

## 2. Checks

- [ ] C1 Verify
  - Covers: A1
  - Expect: behavior passes
`);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('missing-verifies');
  });

  it('reports checks without executable evidence fields', () => {
    const result = validateTaskStructure(`## 1. Actions

- [ ] A1 Implement

## 2. Checks

- [ ] C1 Verify
  - Covers: A1
  - Verifies: manual verification
  - Test action: reuse
`);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('missing-evidence-field');
  });

  it('validates Verifies references against change-local Element units', () => {
    const tempDir = createChangeDir({
      'example.md': `## MODIFIED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
`,
    });

    try {
      const result = validateTaskStructure(validTasks(), { changeDir: tempDir });

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports invalid Verifies Element paths', () => {
    const tempDir = createChangeDir({ 'example.md': '### Section: Parser behavior\n' });

    try {
      for (const verifies of [
        '`.xirang/model/elements/example.md` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"',
        '`/tmp/example/spec.md` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"',
        '`elements/../example.md` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"',
        '`elements\\example.md` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"',
      ]) {
        const result = validateTaskStructure(validTasks(verifies), { changeDir: tempDir });

        expect(result.valid).toBe(false);
        expect(result.issues.map((issue) => issue.code)).toContain('invalid-verifies-path');
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports missing Verifies spec references', () => {
    const tempDir = createChangeDir({ 'example.md': '### Section: Parser behavior\n' });

    try {
      const result = validateTaskStructure(
        validTasks('`elements/missing.md` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"'),
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('missing-verifies-element');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports missing Verifies section and acceptanceCase references', () => {
    const tempDir = createChangeDir({
      'example.md': `## MODIFIED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
`,
    });

    try {
      const missingSection = validateTaskStructure(
        validTasks('`elements/example.md` / Section "Missing" / Acceptance Case "Valid tasks pass"'),
        { changeDir: tempDir }
      );
      const missingAcceptanceCase = validateTaskStructure(
        validTasks('`elements/example.md` / Section "Parser behavior" / Acceptance Case "Missing"'),
        { changeDir: tempDir }
      );

      expect(missingSection.valid).toBe(false);
      expect(missingSection.issues.map((issue) => issue.code)).toContain('missing-verifies-section');
      expect(missingAcceptanceCase.valid).toBe(false);
      expect(missingAcceptanceCase.issues.map((issue) => issue.code)).toContain('missing-verifies-acceptance-case');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('downgrades Verifies cross-checking to warning when no change Element units exist', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-task-'));

    try {
      const result = validateTaskStructure(validTasks('manual verification'), { changeDir: tempDir });

      expect(result.valid).toBe(true);
      expect(result.issues.every((issue) => issue.severity === 'warning')).toBe(true);
      expect(result.issues.map((issue) => issue.code)).toEqual([
        'verifies-cross-check-skipped',
        'verifies-cross-check-skipped',
      ]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('accepts coarse Task sections with Goal, Files, Sections, and Checks', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
`,
    });

    try {
      const result = validateTaskStructure(
        `### Task 1: Parser support

**Goal**: Parse coarse tasks.

**Files**:
- Modify: \`src/core/parsers/task-structure.ts\`
- Test: \`test/core/parsers/task-structure.test.ts\`

**Sections**:
- Read Goal, Files, Sections, and Checks
- Keep sections bounded

#### Checks

- [ ] C1 Verify coarse task parsing
  - Verifies: \`elements/example.md\` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"
  - Test action: reuse
  - Command: \`pnpm test test/core/parsers/task-structure.test.ts\`
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(true);
      expect(result.format).toBe('coarse-tasks');
      expect(result.actions).toEqual(['Task 1']);
      expect(result.checks).toEqual(['C1']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports missing coarse Task fields and excessive sections', () => {
    const result = validateTaskStructure(`### Task 1: Missing fields

**Sections**:
- one
- two
- three
- four
- five
- six

#### Checks

- [ ] C1 Verify
  - Verifies: manual verification
  - Test action: reuse
  - Expect: done
`);

    expect(result.valid).toBe(false);
    expect(result.format).toBe('coarse-tasks');
    expect(result.issues.map((issue) => issue.code)).toContain('missing-task-goal');
    expect(result.issues.map((issue) => issue.code)).toContain('missing-task-files');
    expect(result.issues.map((issue) => issue.code)).toContain('too-many-task-sections');
  });
});

function createChangeDir(units: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-task-'));
  for (const [relativePath, content] of Object.entries(units)) {
    const target = path.join(tempDir, 'elements', relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return tempDir;
}

describe('canonical AcceptanceCase references', () => {
  it('matches Verifies acceptanceCase references by exact canonical title', () => {
    const tempDir = createChangeDir({
      'example.md': `## MODIFIED Sections

### Section: Parser behavior
The system SHALL validate task references.

#### Acceptance Case: Valid tasks pass
- **WHEN** validation runs
- **THEN** the task reference is valid
`,
    });

    try {
      const result = validateTaskStructure(validTasks(), { changeDir: tempDir });

      expect(result.valid).toBe(true);
      expect(result.issues.map((issue) => issue.code)).not.toContain('unknown-verifies-acceptanceCase');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('ignores the word AcceptanceCase inside Section titles when parsing anchors', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: 支持伪代码形式的 AcceptanceCase 正文
The system SHALL accept pseudocode bodies.

#### Acceptance Case: 纯伪代码正文
- **WHEN** a pseudocode body is authored
- **THEN** the body is accepted
`,
    });

    try {
      const result = validateTaskStructure(
        '### Task 1: Anchor\n\n**Goal**: Verify anchors.\n\n**Files**:\n- Test: `test/a.ts`\n\n**Sections**:\n- Keep anchors consistent\n\n#### Checks\n\n- [ ] C1 Verify\n  - Verifies: `elements/example.md` / Section "支持伪代码形式的 AcceptanceCase 正文" / Acceptance Case "纯伪代码正文"\n  - Test action: reuse\n  - Command: `pnpm test`\n',
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(true);
      expect(result.issues.map((issue) => issue.code)).not.toContain('missing-verifies-acceptance-case');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('REMOVED section anchoring', () => {
  it('accepts Verifies with REMOVED Section without AcceptanceCase', () => {
    const tempDir = createChangeDir({
      'example.md': `## REMOVED Sections

### Section: Deprecated feature
`,
    });

    try {
      const result = validateTaskStructure(
        `### Task 1: Remove feature

**Goal**: Remove deprecated feature.

**Files**:
- Delete: \`src/deprecated.ts\`

**Sections**:
- Remove all traces of deprecated feature

#### Checks

- [ ] C1 Verify feature removed
  - Verifies: \`elements/example.md\` / REMOVED Section "Deprecated feature"
  - Test action: reuse
  - Command: \`grep -r "deprecated" src/ || true\`
  - Expect: no matches found
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(true);
      expect(result.checks).toEqual(['C1']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports error when REMOVED section is missing from spec', () => {
    const tempDir = createChangeDir({
      'example.md': `## REMOVED Sections

### Section: Deprecated feature
`,
    });

    try {
      const result = validateTaskStructure(
        `### Task 1: Remove feature

**Goal**: Remove missing feature.

**Files**:
- Delete: \`src/missing.ts\`

**Sections**:
- Remove all traces

#### Checks

- [ ] C1 Verify feature removed
  - Verifies: \`elements/example.md\` / REMOVED Section "Missing feature"
  - Test action: reuse
  - Command: \`grep -r "missing" src/ || true\`
  - Expect: no matches found
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('missing-verifies-section');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('accepts a Section-only Verifies for non-REMOVED anchors', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: New feature

#### Acceptance Case: Feature works
`,
    });

    try {
      const result = validateTaskStructure(
        `### Task 1: Add feature

**Goal**: Implement new feature.

**Files**:
- Create: \`src/feature.ts\`

**Sections**:
- Implement feature

#### Checks

- [ ] C1 Verify feature
  - Verifies: \`elements/example.md\` / Section "New feature"
  - Test action: reuse
  - Command: \`pnpm test\`
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('Preserves field anchoring', () => {
  it('resolves Formal Elements from a canonical Change directory', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-task-project-'));
    const changeDir = path.join(projectRoot, '.xirang', 'changes', 'demo');
    const formalElementPath = path.join(projectRoot, '.xirang', 'model', 'elements', 'auth.md');
    fs.mkdirSync(changeDir, { recursive: true });
    fs.mkdirSync(path.dirname(formalElementPath), { recursive: true });
    fs.writeFileSync(formalElementPath, `## Specification

### Section: Login behavior

#### Acceptance Case: User authenticates
`);

    try {
      const result = validateTaskStructure(`### Task 1: Refactor login

**Goal**: Keep login behavior.

**Files**:
- Modify: \`src/auth.ts\`

**Sections**:
- Preserve login

#### Checks

- [ ] C1 Verify login
  - Preserves: \`.xirang/model/elements/auth.md\` / Section "Login behavior" / Acceptance Case "User authenticates"
  - Test action: reuse
  - Command: \`pnpm test\`
`, { changeDir });

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it('accepts Preserves with Formal Element path and AcceptanceCase', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: Temp spec
`,
    });

    const projectRoot = path.dirname(tempDir);
    const formalElementPath = path.join(projectRoot, '.xirang', 'model', 'elements', 'auth.md');
    fs.mkdirSync(path.dirname(formalElementPath), { recursive: true });
    fs.writeFileSync(
      formalElementPath,
      `## Specification

### Section: Login behavior

#### Acceptance Case: User authenticates
`
    );

    try {
      const result = validateTaskStructure(
        `### Task 1: Refactor login

**Goal**: Refactor login code without behavior change.

**Files**:
- Modify: \`src/auth/login.ts\`

**Sections**:
- Keep behavior unchanged

#### Checks

- [ ] C1 Verify behavior preserved
  - Preserves: \`.xirang/model/elements/auth.md\` / Section "Login behavior" / Acceptance Case "User authenticates"
  - Test action: reuse
  - Command: \`pnpm test src/auth/login.test.ts\`
  - Expect: old function loginUser no longer exists
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(true);
      expect(result.checks).toEqual(['C1']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
      fs.rmSync(path.join(projectRoot, '.xirang'), { recursive: true, force: true });
    }
  });

  it('rejects Preserves with change-local path', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: Temp spec

#### Acceptance Case: Test
`,
    });

    try {
      const result = validateTaskStructure(
        `### Task 1: Refactor

**Goal**: Refactor code.

**Files**:
- Modify: \`src/code.ts\`

**Sections**:
- Keep behavior unchanged

#### Checks

- [ ] C1 Verify behavior
  - Preserves: \`elements/example.md\` / Section "Temp spec" / Acceptance Case "Test"
  - Test action: reuse
  - Command: \`pnpm test\`
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('invalid-verifies-path');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects Preserves with absolute path', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: Temp spec
`,
    });

    try {
      const result = validateTaskStructure(
        `### Task 1: Refactor

**Goal**: Refactor code.

**Files**:
- Modify: \`src/code.ts\`

**Sections**:
- Keep behavior unchanged

#### Checks

- [ ] C1 Verify behavior
  - Preserves: \`/.xirang/model/elements/auth.md\` / Section "Test" / Acceptance Case "Test"
  - Test action: reuse
  - Command: \`pnpm test\`
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('invalid-verifies-path');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects Preserves with parent traversal', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: Temp spec
`,
    });

    try {
      const result = validateTaskStructure(
        `### Task 1: Refactor

**Goal**: Refactor code.

**Files**:
- Modify: \`src/code.ts\`

**Sections**:
- Keep behavior unchanged

#### Checks

- [ ] C1 Verify behavior
  - Preserves: \`xirang/../model/elements/auth.md\` / Section "Test" / Acceptance Case "Test"
  - Test action: reuse
  - Command: \`pnpm test\`
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('invalid-verifies-path');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects Preserves with backslash path', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: Temp spec
`,
    });

    try {
      const result = validateTaskStructure(
        `### Task 1: Refactor

**Goal**: Refactor code.

**Files**:
- Modify: \`src/code.ts\`

**Sections**:
- Keep behavior unchanged

#### Checks

- [ ] C1 Verify behavior
  - Preserves: \`xirang\\model\\elements\\auth.md\` / Section "Test" / Acceptance Case "Test"
  - Test action: reuse
  - Command: \`pnpm test\`
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('invalid-verifies-path');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('does not relax Verifies path rules', () => {
    const tempDir = createChangeDir({
      'example.md': `## ADDED Sections

### Section: Temp spec

#### Acceptance Case: Test
`,
    });

    const projectRoot = path.dirname(tempDir);
    const formalElementPath = path.join(projectRoot, '.xirang', 'model', 'elements', 'auth.md');
    fs.mkdirSync(path.dirname(formalElementPath), { recursive: true });
    fs.writeFileSync(
      formalElementPath,
      `## Specification

### Section: Login

#### Acceptance Case: Works
`
    );

    try {
      const result = validateTaskStructure(
        `### Task 1: Add feature

**Goal**: Add new feature.

**Files**:
- Create: \`src/feature.ts\`

**Sections**:
- Implement feature

#### Checks

- [ ] C1 Verify feature
  - Verifies: \`.xirang/model/elements/auth.md\` / Section "Login" / Acceptance Case "Works"
  - Test action: reuse
  - Command: \`pnpm test\`
`,
        { changeDir: tempDir }
      );

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('invalid-verifies-path');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
      fs.rmSync(path.join(projectRoot, '.xirang'), { recursive: true, force: true });
    }
  });
});

describe.each(['actions-checks', 'coarse-tasks'] as const)('Test action validation in %s', (format) => {
  const tasks = (declaration: string) => `${format === 'actions-checks'
    ? '## Actions\n\n- [ ] A1 Implement\n\n## Checks'
    : '### Task 1: Implement\n\n**Goal**: Deliver behavior\n\n**Files**:\n- Modify: `src/feature.ts`\n\n**Sections**:\n- Implement behavior\n\n#### Checks'}

- [ ] C1 Verify behavior
  ${format === 'actions-checks' ? '- Covers: A1' : ''}
  - Verifies: manual verification
${declaration}
  - Command: run verification
`;

  it.each(['reuse', 'modify', 'add', 'delete', 'one-time'])('accepts %s', (action) => {
    expect(validateTaskStructure(tasks(`  - Test action: ${action}`)).valid).toBe(true);
  });

  it.each([
    ['', 'missing-test-action'],
    ['  - Test action:', 'invalid-test-action'],
    ['  - Test action: update', 'invalid-test-action'],
    ['  - Test action: reuse, add', 'invalid-test-action'],
    ['  - Test action: reuse\n  - Test action: reuse', 'invalid-test-action'],
    ['  - Test action: invalid\n  - Test action: add', 'invalid-test-action'],
  ])('rejects declaration %j', (declaration, code) => {
    const content = tasks(declaration);
    const result = validateTaskStructure(content);
    expect(result.valid).toBe(false);
    expect(result.issues.filter(issue => issue.severity === 'error')).toEqual([{
      code,
      severity: 'error',
      line: content.split('\n').findIndex(line => line.startsWith('- [ ] C1')) + 1,
      message: expect.stringMatching(/Check C1.*reuse, modify, add, delete, one-time/),
    }]);
  });

  it('does not treat a declaration in a code fence as the Check action', () => {
    const result = validateTaskStructure(tasks('```md\n  - Test action: add\n```'));
    expect(result.issues.map(issue => issue.code)).toContain('missing-test-action');
  });

  it('requires evidence for one-time Checks', () => {
    const content = tasks('  - Test action: one-time').replace('  - Command: run verification', '');
    const result = validateTaskStructure(content);
    expect(result.valid).toBe(false);
    expect(result.issues.map(issue => issue.code)).toContain('missing-evidence-field');
  });
});

describe('coarse Task file declaration checks', () => {
  const coarseTasks = (filesA: string, filesB: string) => `### Task 1: First

**Goal**: Deliver first behavior.

**Files**:
${filesA}
**Sections**:
- Keep file declarations consistent

#### Checks

- [ ] C1 Verify first behavior
  - Verifies: \`elements/example.md\` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"
  - Test action: reuse
  - Command: \`pnpm test\`

### Task 2: Second

**Goal**: Deliver second behavior.

**Files**:
${filesB}
**Sections**:
- Keep file declarations consistent

#### Checks

- [ ] C2 Verify second behavior
  - Verifies: \`elements/example.md\` / Section "Parser behavior" / Acceptance Case "Valid tasks pass"
  - Test action: reuse
  - Command: \`pnpm test\`
`;

  const createChangeDir = (files: Record<string, string>): string => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-structure-'));
    const elementsDir = path.join(tempDir, 'elements');
    fs.mkdirSync(elementsDir, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(elementsDir, name), content);
    }
    return tempDir;
  };

  it('reports conflicting Create declarations on the same path', () => {
    const tempDir = createChangeDir({ 'example.md': `## ADDED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
` });
    try {
      const result = validateTaskStructure(
        coarseTasks('- Create: `src/shared.ts`\n', '- Create: `src/shared.ts`\n'),
        { changeDir: tempDir }
      );
      expect(result.issues.map((issue) => issue.code)).toContain('task-file-conflict');
      expect(result.valid).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports Delete conflicting with any other declaration on the same path', () => {
    const tempDir = createChangeDir({ 'example.md': `## ADDED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
` });
    try {
      const result = validateTaskStructure(
        coarseTasks('- Modify: `src/shared.ts`\n', '- Delete: `src/shared.ts`\n'),
        { changeDir: tempDir }
      );
      expect(result.issues.map((issue) => issue.code)).toContain('task-file-conflict');
      expect(result.valid).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports Modify or Delete before a later Create as dependency order', () => {
    const tempDir = createChangeDir({ 'example.md': `## ADDED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
` });
    try {
      const result = validateTaskStructure(
        coarseTasks('- Modify: `src/shared.ts`\n', '- Create: `src/shared.ts`\n'),
        { changeDir: tempDir }
      );
      expect(result.issues.map((issue) => issue.code)).toContain('task-dependency-order');
      expect(result.valid).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('accepts Create followed by Modify on the same path', () => {
    const tempDir = createChangeDir({ 'example.md': `## ADDED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
` });
    try {
      const result = validateTaskStructure(
        coarseTasks('- Create: `src/shared.ts`\n', '- Modify: `src/shared.ts`\n'),
        { changeDir: tempDir }
      );
      expect(result.issues.map((issue) => issue.code)).not.toContain('task-file-conflict');
      expect(result.issues.map((issue) => issue.code)).not.toContain('task-dependency-order');
      expect(result.valid).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('accepts sequential Modify declarations on the same path', () => {
    const tempDir = createChangeDir({ 'example.md': `## ADDED Sections

### Section: Parser behavior

#### Acceptance Case: Valid tasks pass
` });
    try {
      const result = validateTaskStructure(
        coarseTasks('- Modify: `src/shared.ts`\n', '- Modify: `src/shared.ts`\n'),
        { changeDir: tempDir }
      );
      expect(result.valid).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
