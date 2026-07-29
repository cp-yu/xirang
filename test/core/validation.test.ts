import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { Validator } from '../../src/core/validation/validator.js';
import {
  ScenarioSchema,
  RequirementSchema,
} from '../../src/core/schemas/index.js';

describe('Validation Schemas', () => {
  describe('ScenarioSchema', () => {
    it('should validate a valid scenario', () => {
      const scenario = {
        rawText: 'Given a user is logged in\nWhen they click logout\nThen they are redirected to login page',
      };
      
      const result = ScenarioSchema.safeParse(scenario);
      expect(result.success).toBe(true);
    });

    it('should reject scenario with empty text', () => {
      const scenario = {
        rawText: '',
      };
      
      const result = ScenarioSchema.safeParse(scenario);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Scenario text cannot be empty');
      }
    });
  });

  describe('RequirementSchema', () => {
    it('should validate a valid requirement', () => {
      const requirement = {
        text: 'The system SHALL provide user authentication',
        scenarios: [
          {
            rawText: 'Given a user with valid credentials\nWhen they submit the login form\nThen they are authenticated',
          },
        ],
      };
      
      const result = RequirementSchema.safeParse(requirement);
      expect(result.success).toBe(true);
    });

    it('should reject requirement without SHALL or MUST', () => {
      const requirement = {
        text: 'The system provides user authentication',
        scenarios: [
          {
            rawText: 'Given a user\nWhen they login\nThen authenticated',
          },
        ],
      };
      
      const result = RequirementSchema.safeParse(requirement);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Requirement must contain SHALL or MUST keyword');
      }
    });

    it('should reject requirement without scenarios', () => {
      const requirement = {
        text: 'The system SHALL provide user authentication',
        scenarios: [],
      };
      
      const result = RequirementSchema.safeParse(requirement);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Requirement must have at least one scenario');
      }
    });
  });

});

/** Requirement deltas live in the change's `elements/` partition. */
async function writeDeltaUnit(changeDir: string, body: string, identity = 'test-spec'): Promise<void> {
  const elements = path.join(changeDir, 'elements');
  await fs.mkdir(elements, { recursive: true });
  await fs.writeFile(
    path.join(elements, `${identity}.md`),
    `---\noperation: MODIFIED\nentity: element-declaration\nidentity: ${identity}\nkind: capability\nparent: root\ntitle: T\ndefinition: S\n---\n\n${body}`,
  );
}

describe('Validator', () => {
  const testDir = path.join(process.cwd(), 'test-validation-tmp');
  
  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('validateChangeDeltaSpecs with metadata', () => {
    it('should validate requirement with metadata before SHALL/MUST text', async () => {
      const changeDir = path.join(testDir, 'test-change');

      const deltaSpec = `# Test Spec

## ADDED Requirements

### Requirement: Circuit Breaker State Management SHALL be implemented
**ID**: REQ-CB-001
**Priority**: P1 (High)

The system MUST implement a circuit breaker with three states.

#### Scenario: Normal operation
**Given** the circuit breaker is in CLOSED state
**When** a request is made
**Then** the request is executed normally`;

      await writeDeltaUnit(changeDir, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('should validate requirement with SHALL in text but not in header', async () => {
      const changeDir = path.join(testDir, 'test-change-2');

      const deltaSpec = `# Test Spec

## ADDED Requirements

### Requirement: Error Handling
**ID**: REQ-ERR-001
**Priority**: P2

The system SHALL handle all errors gracefully.

#### Scenario: Error occurs
**Given** an error condition
**When** an error occurs
**Then** the error is logged and user is notified`;

      await writeDeltaUnit(changeDir, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('should fail when requirement text lacks SHALL/MUST', async () => {
      const changeDir = path.join(testDir, 'test-change-3');

      const deltaSpec = `# Test Spec

## ADDED Requirements

### Requirement: Logging Feature
**ID**: REQ-LOG-001

The system will log all events.

#### Scenario: Event occurs
**Given** an event
**When** it occurs
**Then** it is logged`;

      await writeDeltaUnit(changeDir, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(false);
      expect(report.summary.errors).toBeGreaterThan(0);
      expect(report.issues.some(i => i.message.includes('must contain SHALL or MUST'))).toBe(true);
    });

    it('should handle requirements without metadata fields', async () => {
      const changeDir = path.join(testDir, 'test-change-4');

      const deltaSpec = `# Test Spec

## ADDED Requirements

### Requirement: Simple Feature
The system SHALL implement this feature.

#### Scenario: Basic usage
**Given** a condition
**When** an action occurs
**Then** a result happens`;

      await writeDeltaUnit(changeDir, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('should treat delta headers case-insensitively', async () => {
      const changeDir = path.join(testDir, 'test-change-mixed-case');

      const deltaSpec = `# Test Spec

## Added Requirements

### Requirement: Mixed Case Handling
The system MUST support mixed case delta headers.

#### Scenario: Case insensitive parsing
**Given** a delta file with mixed case headers
**When** validation runs
**Then** the delta is detected`;

      await writeDeltaUnit(changeDir, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
      expect(report.summary.warnings).toBe(0);
      expect(report.summary.info).toBe(0);
    });

    it('should reject invalid scenario operation labels in change specs', async () => {
      const cases = [
        {
          change: 'unknown-label',
          body: '#### Scenario: [UPDATED] 场景',
          message: 'Scenario operation metadata',
        },
        {
          change: 'malformed-label',
          body: '#### [ADDED] Scenario: 场景',
          message: 'Scenario operation metadata',
        },
        {
          change: 'removed-in-added',
          body: '#### Scenario: [REMOVED] 旧场景',
          message: 'Scenario operation metadata',
        },
      ];

      for (const item of cases) {
        const changeDir = path.join(testDir, item.change);
        await writeDeltaUnit(
          changeDir,
          `## ADDED Requirements

### Requirement: Label Validation
The system SHALL validate labels.

${item.body}
- **WHEN** action
- **THEN** result`,
        );

        const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);

        expect(report.valid).toBe(false);
        expect(report.issues.length).toBeGreaterThan(0);
      }
    });

    it('should reject a REMOVED Scenario label before target-set validation', async () => {
      const changeDir = path.join(testDir, 'surviving-scenarios');
      await writeDeltaUnit(
        changeDir,
        `## MODIFIED Requirements

### Requirement: Label Validation
The system SHALL validate labels.

#### Scenario: [REMOVED] 旧场景
- **WHEN** old
- **THEN** gone`,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(false);
      expect(report.issues.some(i => i.message.includes('Unsupported Scenario operation metadata [REMOVED]'))).toBe(true);
    });

    it('should reject [MODIFIED] label under ADDED Requirements', async () => {
      const changeDir = path.join(testDir, 'modified-under-added');
      await writeDeltaUnit(
        changeDir,
        `## ADDED Requirements

### Requirement: Label Validation
The system SHALL validate labels.

#### Scenario: [ADDED] 新场景
- **WHEN** new
- **THEN** result

#### Scenario: [MODIFIED] 修改场景
- **WHEN** action
- **THEN** result`,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(false);
      expect(report.issues.some(i => i.message.includes('Unsupported Scenario operation metadata [MODIFIED]'))).toBe(true);
    });

    it('should accept unlabeled MODIFIED scenarios without writing labels', async () => {
      const projectRoot = path.join(testDir, 'unlabeled-project');
      const changeDir = path.join(projectRoot, '.xirang', 'changes', 'unlabeled-modified-scenario');
      const content = `## MODIFIED Requirements

### Requirement: Label Validation
The system SHALL validate labels.

#### Scenario: 场景
- **WHEN** action
- **THEN** result`;
      await writeDeltaUnit(changeDir, content);
      const unitPath = path.join(changeDir, 'elements', 'test-spec.md');
      const before = await fs.readFile(unitPath, 'utf-8');

      const report = await new Validator(false).validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.issues.filter(i => i.level === 'ERROR')).toHaveLength(0);
      expect(await fs.readFile(unitPath, 'utf-8')).toBe(before);
    });
  });

  describe('requirement reader fidelity (fence, multi-line, metadata, whole-word)', () => {
    async function writeChangeDelta(name: string, deltaSpec: string): Promise<string> {
      const changeDir = path.join(testDir, name);
      await writeDeltaUnit(changeDir, deltaSpec);
      return changeDir;
    }

    it('multi-line: SHALL on a later body line is recognized', async () => {
      const changeDir = await writeChangeDelta(
        'fidelity-multi-line',
        `## ADDED Requirements

### Requirement: Wrapped keyword
The system performs the described behavior and it
continues onto a second line where SHALL appears in full.

#### Scenario: Wrapped
- **WHEN** handled
- **THEN** accepted`,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('metadata-only body carrying MUST is accepted', async () => {
      const changeDir = await writeChangeDelta(
        'fidelity-metadata-only',
        `## ADDED Requirements

### Requirement: Constraint only
**Constraint**: The system MUST enforce the limit.

#### Scenario: Enforced
- **WHEN** limit exceeded
- **THEN** rejected`,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('fence-after-body: prose after fenced block supplies keyword', async () => {
      const changeDir = await writeChangeDelta(
        'fidelity-fence-after-body',
        `## ADDED Requirements

### Requirement: Fence first
\`\`\`bash
# not the requirement text
echo hello
\`\`\`
The system SHALL handle fenced examples before the prose line.

#### Scenario: Handled
- **WHEN** read
- **THEN** prose is used`,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('fence: Scenario inside fence is not a surviving scenario', async () => {
      const changeDir = await writeChangeDelta(
        'fidelity-fence-scenario',
        `## ADDED Requirements

### Requirement: Fenced scenario only
The system SHALL do something real.

\`\`\`markdown
#### Scenario: not a real scenario
- **WHEN** example
- **THEN** stays fenced
\`\`\``,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
      expect(report.valid).toBe(false);
      expect(
        report.issues.some(i =>
          i.message.includes('at least one canonical unlabeled Scenario'),
        ),
      ).toBe(true);
    });

    it('surviving: unlabeled real scenario coexists with fenced example', async () => {
      const changeDir = await writeChangeDelta(
        'fidelity-surviving-mixed',
        `## ADDED Requirements

### Requirement: Mixed scenarios
The system SHALL accept real scenarios only.

#### Scenario: Real one
- **WHEN** real
- **THEN** counts

\`\`\`markdown
#### Scenario: example only
- **WHEN** fenced
- **THEN** ignored
\`\`\``,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('rejects a real REMOVED Scenario label even with a fenced example', async () => {
      const changeDir = await writeChangeDelta(
        'fidelity-surviving-removed',
        `## MODIFIED Requirements

### Requirement: Only removed
The system SHALL keep label semantics.

#### Scenario: [REMOVED] 旧场景
- **WHEN** old
- **THEN** gone

\`\`\`markdown
#### Scenario: example
- **WHEN** fenced
- **THEN** ignored
\`\`\``,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
      expect(report.valid).toBe(false);
      expect(
        report.issues.some(i =>
          i.message.includes('Unsupported Scenario operation metadata [REMOVED]'),
        ),
      ).toBe(true);
    });

    it('whole-word: SHALL substring inside MARSHALL is not a keyword', async () => {
      const changeDir = await writeChangeDelta(
        'fidelity-whole-word',
        `## ADDED Requirements

### Requirement: Marshalling
The MARSHALL coordinates parade logistics.

#### Scenario: Coordinated
- **WHEN** parade begins
- **THEN** coordinated`,
      );

      const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
      expect(report.valid).toBe(false);
      expect(report.issues.some(i => i.message.includes('must contain SHALL or MUST'))).toBe(true);
    });


    it('CRLF multi-line and fence behavior matches LF', async () => {
      const lf = `## ADDED Requirements

### Requirement: CRLF parity
Line one of the body
continues with SHALL on line two.

\`\`\`markdown
#### Scenario: fenced
- **WHEN** example
- **THEN** ignored
\`\`\`

#### Scenario: Real
- **WHEN** real
- **THEN** counts`;
      const crlf = lf.replace(/\n/g, '\r\n');

      const lfDir = await writeChangeDelta('fidelity-crlf-lf', lf);
      const crlfDir = await writeChangeDelta('fidelity-crlf-crlf', crlf);

      const lfReport = await new Validator(true).validateChangeDeltaSpecs(lfDir);
      const crlfReport = await new Validator(true).validateChangeDeltaSpecs(crlfDir);

      expect(lfReport.valid).toBe(true);
      expect(crlfReport.valid).toBe(lfReport.valid);
      expect(crlfReport.summary.errors).toBe(lfReport.summary.errors);
    });
  });

});
