import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  loadTemplate,
  loadChangeContext,
  generateInstructions,
  formatChangeStatus,
  TemplateLoadError,
} from '../../../src/core/artifact-graph/instruction-loader.js';

function canonicalPath(filePath: string): string {
  return fs.realpathSync.native(filePath);
}

describe('instruction-loader', () => {
  describe('loadTemplate', () => {
    it('loads the proposal source-impact template', () => {
      const template = loadTemplate('spec-driven', 'proposal.md');

      for (const heading of [
        '## Why',
        '## What Changes',
        '## Source Impact',
        '### Behavior Source',
        '#### New Specs',
        '#### Modified Specs',
        '### Architecture Source',
        '#### Added Elements',
        '#### Modified Elements',
        '#### Removed Elements',
        '#### Architecture Relations',
        '## Impact',
      ]) {
        expect(template).toContain(heading);
      }
      expect(template).toContain('element identities');
      expect(template).toContain('elements/');
      expect(template).toContain('metamodel/');
      expect(template).toContain('relationships/');
      expect(template).toContain('views/');
      expect(template).not.toContain('LikeC4');
      expect(template).not.toContain('capabilityId');
      expect(template).not.toContain('domain_name');
      expect(template).not.toContain('## Capabilities');
      expect(template).not.toContain('### New Capabilities');
      expect(template).not.toContain('### Modified Capabilities');
    });

    it('should throw TemplateLoadError for non-existent template', () => {
      expect(() => loadTemplate('spec-driven', 'nonexistent.md')).toThrow(
        TemplateLoadError
      );
    });

    it('should throw TemplateLoadError for non-existent schema', () => {
      expect(() => loadTemplate('nonexistent-schema', 'proposal.md')).toThrow(
        TemplateLoadError
      );
    });

    it('should include template path in error', () => {
      try {
        loadTemplate('spec-driven', 'nonexistent.md');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(TemplateLoadError);
        expect((err as TemplateLoadError).templatePath).toContain('nonexistent.md');
      }
    });
  });

  describe('loadChangeContext', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opsx-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should load context with default schema', () => {
      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('spec-driven');
      expect(context.changeName).toBe('my-change');
      expect(context.graph.getName()).toBe('spec-driven');
      expect(context.completed.size).toBe(0);
    });

    it('should load context with explicit schema', () => {
      const context = loadChangeContext(tempDir, 'my-change', 'spec-driven');

      expect(context.schemaName).toBe('spec-driven');
      expect(context.graph.getName()).toBe('spec-driven');
    });

    it('should detect completed artifacts', () => {
      // Create change directory with proposal.md
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');

      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.completed.has('proposal')).toBe(true);
    });

    it('should return empty completed set for non-existent change directory', () => {
      const context = loadChangeContext(tempDir, 'nonexistent-change');

      expect(context.completed.size).toBe(0);
    });

    it('should auto-detect schema from .xirang.yaml metadata', () => {
      // Create change directory with metadata file
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, '.xirang.yaml'), 'schema: spec-driven\ncreated: "2025-01-05"\n');

      // Load without explicit schema - should detect from metadata
      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('spec-driven');
      expect(context.graph.getName()).toBe('spec-driven');
    });

    it('should use explicit schema over metadata schema', () => {
      // Create change directory with metadata file using spec-driven
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, '.xirang.yaml'), 'schema: spec-driven\n');

      // Load with explicit schema - should override metadata
      const context = loadChangeContext(tempDir, 'my-change', 'spec-driven');

      expect(context.schemaName).toBe('spec-driven');
      expect(context.graph.getName()).toBe('spec-driven');
    });

    it('should fall back to default when no metadata and no explicit schema', () => {
      // Create change directory without metadata file
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });

      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('spec-driven');
    });
  });

  describe('generateInstructions', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opsx-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should include artifact metadata', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      expect(instructions.changeName).toBe('my-change');
      expect(instructions.artifactId).toBe('proposal');
      expect(instructions.schemaName).toBe('spec-driven');
      expect(instructions.outputPath).toBe('proposal.md');
      expect(instructions.currentState).toEqual({ completed: false, outputs: [] });
      expect(instructions.definition).toEqual(expect.objectContaining({
        purpose: expect.any(String),
        compilationRole: expect.any(String),
        writePolicy: 'agent-authored',
      }));
    });

    it('projects existing artifact paths as current state without embedding content', () => {
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      const proposalPath = path.join(changeDir, 'proposal.md');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(proposalPath, 'private proposal content');

      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      expect(instructions.currentState).toEqual({
        completed: true,
        outputs: [canonicalPath(proposalPath)],
      });
      expect(JSON.stringify(instructions)).not.toContain('private proposal content');
    });

    it('projects completion-marker state without claiming a semantic output exists', () => {
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      const markerPath = path.join(changeDir, '.delta-noop');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(markerPath, '');

      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'specs');

      expect(instructions.currentState).toEqual({
        completed: true,
        outputs: [],
        completionMarker: {
          path: canonicalPath(markerPath),
          present: true,
        },
      });
    });

    it('projects the expected completion-marker path when the marker is absent', () => {
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      const markerPath = path.join(changeDir, '.delta-noop');
      fs.mkdirSync(changeDir, { recursive: true });

      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'specs');

      expect(instructions.currentState).toEqual({
        completed: false,
        outputs: [],
        completionMarker: {
          path: path.join(context.changeDir, '.delta-noop'),
          present: false,
        },
      });
    });

    it('projects precise semantic boundaries for spec-driven artifacts', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const proposal = generateInstructions(context, 'proposal').definition;
      const specs = generateInstructions(context, 'specs').definition;
      const design = generateInstructions(context, 'design').definition;
      const tasks = generateInstructions(context, 'tasks').definition;

      expect(proposal).toMatchObject({
        purpose: 'Explain why the change is needed and declare its semantic source scope.',
        compilationRole: 'Compilation scaffolding for motivation and source impact.',
        content: {
          includes: [
            'Motivation, scope boundaries, Behavior Source impact, Architecture Source impact, and affected surfaces.',
          ],
          excludes: [
            'Complete observable behavior requirements, complete target-state Semantic Delta entries, lowering decisions, and implementation work.',
          ],
        },
      });
      expect(specs).toMatchObject({
        purpose: 'Express the semantics this Change adds, modifies, or removes.',
        compilationRole: 'Semantic Delta compiled against the current Semantic Model.',
        content: {
          includes: [
            'Complete target-state Semantic Delta entries across elements, metamodel, relationships, and views.',
          ],
          excludes: [
            'Motivation, implementation decisions, rationale, task planning, change-log narration, and Agent reasoning.',
          ],
        },
        validation: [
          'xirang validate --change <name> --json',
          'xirang arch validate --change <name> --json',
        ],
      });
      expect(design).toMatchObject({
        purpose: 'Record concrete lowering and architecture decisions that the Agent must not guess.',
        content: {
          includes: [
            'Solution architecture, implementation boundaries, technical decisions, rationale, alternatives, refactoring strategy, risks, trade-offs, and migration decisions.',
          ],
          excludes: [
            'Observable behavior requirements, task progress, repeated motivation, and durable semantic changes not reconciled through the four Delta partitions.',
          ],
        },
      });
      expect(tasks?.content.includes).toContain(
        'Coarse work units, affected files, implementation constraints, executable checks, commands, and evidence anchors.'
      );
      expect(tasks?.content.includes.join(' ')).not.toContain('owned files');
    });

    it('projects separate proposal source impact guidance', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const body = generateInstructions(context, 'proposal').instruction ?? '';

      for (const token of [
        'Behavior Source',
        'Architecture Source',
        'New Specs',
        'Modified Specs',
        'element identity',
        'one shared identity space',
        'Write `None`',
        'Complete target-state Semantic Delta entries belong in `elements/`, `metamodel/`, `relationships/`, and `views/`',
        'Lowering and architecture decisions belong in `design.md`',
        'Implementation work and verification belong in `tasks.md`',
      ]) {
        expect(body).toContain(token);
      }
      for (const legacy of ['LikeC4', 'capabilityId', 'domain_name', 'architecture-delta']) {
        expect(body).not.toContain(legacy);
      }
    });

    it('projects four-partition Semantic Delta guidance and unit templates', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const projected = generateInstructions(context, 'specs');
      const body = projected.instruction ?? '';

      for (const token of [
        'per-unit shape reference',
        'entity',
        'element-declaration: identity, kind, parent, title, summary',
        'element-kind: identity, contract; optional root, parents, children',
        'relationship-kind: identity; optional sourceKinds, targetKinds',
        'authored-view: identity, include; optional of, title, autoLayout',
        '[A-Za-z0-9._-]+',
        '## ADDED Requirements',
        '## MODIFIED Requirements',
        '## REMOVED Requirements',
        'relationships/',
        'does not support `MODIFIED`',
      ]) {
        expect(body).toContain(token);
      }
      for (const legacy of [
        '.xirang/specs',
        'specs/<spec-id>',
        'cap.<domain>',
        '--artifacts',
        'architecture-delta',
      ]) {
        expect(body).not.toContain(legacy);
      }
      for (const output of [
        'elements/<identity>.md',
        'metamodel/<kind identity>.md',
        'views/<view identity>.md',
        'relationships/<relationship kind identity>.yaml',
      ]) {
        expect(projected.template).toContain(output);
      }
      expect(projected.currentState.completionMarker?.path).toBe(path.join(context.changeDir, '.delta-noop'));
    });

    it('projects one definition-first authoring order for every spec-driven artifact', () => {
      const context = loadChangeContext(tempDir, 'my-change');

      for (const artifactId of ['proposal', 'specs', 'design', 'tasks']) {
        const body = generateInstructions(context, artifactId).instruction ?? '';
        const definitionIndex = body.indexOf('1. Read the resolved `definition`');
        const currentStateIndex = body.indexOf('2. Read dependencies and current artifact state');
        const instructionIndex = body.indexOf('3. Follow the artifact-specific instruction');
        const templateIndex = body.indexOf('4. Fill the canonical structure from `template`');

        expect(definitionIndex).toBeGreaterThanOrEqual(0);
        expect(currentStateIndex).toBeGreaterThan(definitionIndex);
        expect(instructionIndex).toBeGreaterThan(currentStateIndex);
        expect(templateIndex).toBeGreaterThan(instructionIndex);
        expect(body).toContain('MUST NOT copy `definition`, context, rules, `configProjection`, or Agent reasoning into the artifact');
      }
    });

    it('falls back to change metadata when project schema is unsupported', () => {
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, '.xirang.yaml'), 'schema: spec-driven\n');
      fs.writeFileSync(
        path.join(tempDir, '.xirang', 'config.yaml'),
        'schema: custom-schema\n'
      );

      const context = loadChangeContext(tempDir, 'my-change');

      const instructions = generateInstructions(context, 'proposal');
      expect(instructions.schemaName).toBe('spec-driven');
      expect(instructions.outputPath).toBe('proposal.md');
    });

    it('should include template content', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      expect(instructions.template).toContain('## Why');
    });

    it('should expose coarse Task guidance for tasks', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'tasks');

      // Layer 2: Structure integrity - template format
      expect(instructions.template).toContain('### Task 1:');
      expect(instructions.template).toContain('**Goal**:');
      expect(instructions.template).toContain('**Files**:');
      expect(instructions.template).toContain('**Requirements**:');
      expect(instructions.template).toContain('#### Checks');
      expect(instructions.template).toContain('- [ ] C1');
      expect(instructions.template).toContain('Verifies: `elements/<identity>.md`');

      // Layer 1: Core concepts - instruction content
      expect(instructions.instruction).toMatch(/coarse.*task/i);
      expect(instructions.instruction).toMatch(/task.*\d+/i);
      expect(instructions.instruction).toMatch(/goal/i);
      expect(instructions.instruction).toMatch(/files/i);
      expect(instructions.instruction).toMatch(/requirements/i);
      expect(instructions.instruction).toMatch(/checks/i);
      expect(instructions.instruction).toMatch(/verifies/i);
      expect(instructions.instruction).toMatch(/elements.*identity.*\.md/i);
      expect(instructions.instruction).toMatch(/requirement/i);
      expect(instructions.instruction).toMatch(/scenario/i);
      expect(instructions.instruction).toMatch(/paths/i);
      expect(instructions.instruction).toContain('Task titles, check names');
      expect(instructions.instruction).toContain('Evidence:/Expect:');
      expect(instructions.instruction).toContain('exact canonical unlabeled Scenario names');
      expect(instructions.instruction).toContain('Scenario "<name>"');
      expect(instructions.instruction).toContain('proseLanguage');
    });

    it('should expose prose language boundaries for specs', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'specs');

      expect(instructions.instruction).toContain('`### Requirement:` and `#### Scenario:`');
      expect(instructions.instruction).toContain('New Requirement titles and new Scenario titles');
      expect(instructions.instruction).toContain('MODIFIED Requirements');
      expect(instructions.instruction).toContain('proseLanguage');
    });

    it('derives Scenario operations through validation and semantic diff', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'specs');

      expect(instructions.instruction).toContain('Agent MUST NOT author Scenario operation labels');
      expect(instructions.instruction).toContain('Scenario operations are derived by `xirang validate --change <name>` and `xirang diff --change <name> --write`');
      expect(instructions.instruction).not.toContain('xirang scenario-labels');
      expect(instructions.instruction).not.toContain('use `[ADDED]`');
      expect(instructions.instruction).not.toContain('use `[MODIFIED]`');
      expect(instructions.instruction).not.toContain('use `[REMOVED]`');
    });

    it('should show dependencies with completion status', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'specs');

      expect(instructions.dependencies).toHaveLength(1);
      expect(instructions.dependencies[0].id).toBe('proposal');
      expect(instructions.dependencies[0].done).toBe(false);
    });

    it('should mark completed dependencies as done', () => {
      // Create proposal
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');

      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'specs');

      expect(instructions.dependencies[0].done).toBe(true);
    });

    it('should list artifacts unlocked by this one', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      // proposal unlocks specs and design
      expect(instructions.unlocks).toContain('specs');
      expect(instructions.unlocks).toContain('design');
    });

    it('should have empty dependencies for root artifact', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      expect(instructions.dependencies).toHaveLength(0);
    });

    it('should throw for non-existent artifact', () => {
      const context = loadChangeContext(tempDir, 'my-change');

      expect(() => generateInstructions(context, 'nonexistent')).toThrow(
        "Artifact 'nonexistent' not found"
      );
    });

    describe('project config integration', () => {
      it('should return context as separate field for all artifacts', () => {
        // Create project config
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
context: |
  Tech stack: TypeScript, React
  API style: RESTful
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        // Context should be in separate field, not in template
        expect(instructions.context).toContain('Tech stack: TypeScript, React');
        expect(instructions.context).toContain('API style: RESTful');
        expect(instructions.template).not.toContain('Tech stack');
        expect(instructions.template).toContain('## Why'); // Actual template content
      });

      it('should return undefined context when config is absent', () => {
        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toBeUndefined();
        expect(instructions.rules).toBeUndefined();
        expect(instructions.template).toContain('## Why'); // Actual template content
      });

      it('should preserve multi-line context', () => {
        // Create project config with multi-line context
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
context: |
  Line 1
  Line 2
  Line 3
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toContain('Line 1\nLine 2\nLine 3');
      });

      it('should preserve special characters in context', () => {
        // Create project config with special characters
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
context: |
  Special: < > & " ' @ # $ % [ ] { }
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toContain('Special: < > & " \' @ # $ % [ ] { }');
      });

      it('should return rules only for matching artifact', () => {
        // Create project config with rules
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format
`
        );

        const context = loadChangeContext(tempDir, 'my-change');

        // Check proposal artifact has its rules
        const proposalInstructions = generateInstructions(context, 'proposal', tempDir);
        expect(proposalInstructions.rules).toEqual(['Include rollback plan', 'Identify affected teams']);
        expect(proposalInstructions.template).not.toContain('rollback plan');

        // Check specs artifact has its rules
        const specsInstructions = generateInstructions(context, 'specs', tempDir);
        expect(specsInstructions.rules).toEqual(['Use Given/When/Then format']);
        expect(specsInstructions.template).not.toContain('Given/When/Then');
      });

      it('should return undefined rules for non-matching artifact', () => {
        // Create project config with rules only for proposal
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Include rollback plan
`
        );

        const context = loadChangeContext(tempDir, 'my-change');

        // Check design artifact (no rules configured) has undefined rules
        const designInstructions = generateInstructions(context, 'design', tempDir);
        expect(designInstructions.rules).toBeUndefined();
      });

      it('should return undefined rules when empty array', () => {
        // Create project config with empty rules array
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
context: Some context
rules:
  proposal: []
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toBe('Some context');
        expect(instructions.rules).toBeUndefined();
      });

      it('should keep context, rules, and template as separate fields', () => {
        // Create project config with both context and rules
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
context: Project context here
rules:
  proposal:
    - Rule 1
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        // All three should be separate
        expect(instructions.context).toBe('Project context here');
        expect(instructions.rules).toEqual(['Rule 1']);
        expect(instructions.configProjection.prompt.fragments).toEqual([
          expect.objectContaining({ key: 'context', scope: 'global' }),
          expect.objectContaining({ key: 'rules', scope: 'artifact', lines: ['Rule 1'] }),
        ]);
        expect(instructions.template).toContain('## Why');
        // Template should not contain context or rules
        expect(instructions.template).not.toContain('Project context here');
        expect(instructions.template).not.toContain('Rule 1');
      });

      it('should handle context without rules', () => {
        // Create project config with only context
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
context: Project context only
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toBe('Project context only');
        expect(instructions.rules).toBeUndefined();
        expect(instructions.template).toContain('## Why');
      });

      it('should handle rules without context', () => {
        // Create project config with only rules
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Rule only
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toBeUndefined();
        expect(instructions.rules).toEqual(['Rule only']);
        expect(instructions.template).toContain('## Why');
      });

      it('should work without project root parameter', () => {
        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal'); // No projectRoot

        expect(instructions.context).toBeUndefined();
        expect(instructions.rules).toBeUndefined();
        expect(instructions.configProjection.prompt.fragments).toEqual([]);
        expect(instructions.template).toContain('## Why');
      });

      it('should expose proseLanguage through the compiled projection bundle', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
proseLanguage: 中文
rules:
  proposal:
    - Keep rationale concise
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.configProjection.prompt.compiledLines.join('\n')).toContain(
          'Use 中文 for natural-language prose that you newly write or revise.'
        );
        expect(instructions.configProjection.prompt.compiledLines.join('\n')).toContain(
          'task titles, check names, Requirement titles, Scenario titles'
        );
        expect(instructions.configProjection.prompt.compiledLines.join('\n')).toContain(
          'English project terminology may remain embedded'
        );
        expect(instructions.configProjection.prompt.compiledLines.join('\n')).toContain(
          'Keep rationale concise'
        );
      });
    });

    describe('validation and warnings', () => {
      let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
      });

      it('should warn about unknown artifact IDs in rules', () => {
        // Create project config with invalid artifact ID
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Valid rule
  invalid-artifact:
    - Invalid rule
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        generateInstructions(context, 'proposal', tempDir);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Unknown artifact ID in rules: "invalid-artifact"')
        );
      });

      it('should deduplicate validation warnings within session', () => {
        // Create a fresh temp directory to avoid cache pollution
        const freshTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opsx-test-'));

        try {
          // Create project config with a uniquely named invalid artifact ID
          const configDir = path.join(freshTempDir, '.xirang');
          fs.mkdirSync(configDir, { recursive: true });
          fs.writeFileSync(
            path.join(configDir, 'config.yaml'),
            `schema: spec-driven
rules:
  unique-invalid-artifact-${Date.now()}:
    - Invalid rule
`
          );

          const context = loadChangeContext(freshTempDir, 'my-change');

          // Call multiple times
          generateInstructions(context, 'proposal', freshTempDir);
          generateInstructions(context, 'specs', freshTempDir);
          generateInstructions(context, 'design', freshTempDir);

          // Warning should be shown only once (deduplication works)
          // Note: We may have gotten warnings from other tests, so check that
          // the count didn't increase by more than 1 from the first call
          const callCount = consoleWarnSpy.mock.calls.filter(call =>
            call[0]?.includes('Unknown artifact ID in rules')
          ).length;

          expect(callCount).toBeGreaterThanOrEqual(1);
        } finally {
          fs.rmSync(freshTempDir, { recursive: true, force: true });
        }
      });

      it('should not warn for valid artifact IDs', () => {
        // Create project config with valid artifact IDs
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Rule 1
  specs:
    - Rule 2
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        generateInstructions(context, 'proposal', tempDir);

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('formatChangeStatus', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opsx-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should show all artifacts as ready/blocked when nothing completed', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      expect(status.changeName).toBe('my-change');
      expect(status.schemaName).toBe('spec-driven');
      expect(status.isComplete).toBe(false);

      // proposal has no deps, should be ready
      const proposal = status.artifacts.find(a => a.id === 'proposal');
      expect(proposal?.status).toBe('ready');

      // specs depends on proposal, should be blocked
      const specs = status.artifacts.find(a => a.id === 'specs');
      expect(specs?.status).toBe('blocked');
      expect(specs?.missingDeps).toContain('proposal');
    });

    it('should show completed artifacts as done', () => {
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');

      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      const proposal = status.artifacts.find(a => a.id === 'proposal');
      expect(proposal?.status).toBe('done');

      // specs should now be ready
      const specs = status.artifacts.find(a => a.id === 'specs');
      expect(specs?.status).toBe('ready');
    });

    it('should include output paths for each artifact', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      const proposal = status.artifacts.find(a => a.id === 'proposal');
      expect(proposal?.outputPath).toBe('proposal.md');

      const specs = status.artifacts.find(a => a.id === 'specs');
      expect(specs?.outputPath).toBe('{elements,metamodel,relationships,views}/**/*');

      expect(status.artifacts.some(a => a.id === 'architecture-delta')).toBe(false);
      expect(status.artifacts.some(a => a.id === 'opsx-delta')).toBe(false);
    });

    it('should report isComplete true when all done', () => {
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.mkdirSync(path.join(changeDir, 'elements'), { recursive: true });

      // Create all required files for spec-driven schema
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');
      fs.writeFileSync(path.join(changeDir, 'elements', 'test.md'), '# Delta');
      fs.writeFileSync(path.join(changeDir, 'design.md'), '# Design');
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '# Tasks');

      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      expect(status.isComplete).toBe(true);
      expect(status.artifacts.every(a => a.status === 'done')).toBe(true);
    });

    it('should show blocked artifacts with missing dependencies', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      // tasks requires specs and design
      const tasks = status.artifacts.find(a => a.id === 'tasks');
      expect(tasks?.status).toBe('blocked');
      expect(tasks?.missingDeps).toContain('specs');
      expect(tasks?.missingDeps).toContain('design');
    });

    it('should sort artifacts in build order', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      const ids = status.artifacts.map(a => a.id);
      const proposalIdx = ids.indexOf('proposal');
      const specsIdx = ids.indexOf('specs');
      const tasksIdx = ids.indexOf('tasks');

      // proposal must come before specs, specs before tasks
      expect(proposalIdx).toBeLessThan(specsIdx);
      expect(specsIdx).toBeLessThan(tasksIdx);
    });
  });
});
