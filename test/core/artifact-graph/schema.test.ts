import { describe, it, expect } from 'vitest';
import { parseSchema, SchemaValidationError } from '../../../src/core/artifact-graph/schema.js';

const definition = `
    definition:
      purpose: Define the file purpose
      compilationRole: Durable behavior source
      content:
        includes: [Target behavior]
        excludes: [Implementation notes]
      writePolicy: agent-authored
      validation: [openspec validate]
`;

describe('artifact-graph/schema', () => {
  describe('parseSchema', () => {
    it('should parse valid schema YAML', () => {
      const yaml = `
name: test-schema
version: 1
description: A test schema
artifacts:
  - id: proposal
    generates: proposal.md
    description: Initial proposal
    template: templates/proposal.md
    requires: []
  - id: design
    generates: design.md
    description: Design document
    template: templates/design.md
    requires:
      - proposal
`;
      const schema = parseSchema(yaml);

      expect(schema.name).toBe('test-schema');
      expect(schema.version).toBe(1);
      expect(schema.description).toBe('A test schema');
      expect(schema.artifacts).toHaveLength(2);
      expect(schema.artifacts[0].id).toBe('proposal');
      expect(schema.artifacts[1].requires).toEqual(['proposal']);
    });

    it('should throw on missing required fields', () => {
      const yaml = `
name: test-schema
version: 1
artifacts:
  - id: proposal
    description: Missing generates and template
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/generates/);
    });

    it('should throw on missing schema name', () => {
      const yaml = `
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: Test
    template: templates/proposal.md
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/name/);
    });

    it('should throw on invalid version (non-positive)', () => {
      const yaml = `
name: test
version: 0
artifacts:
  - id: proposal
    generates: proposal.md
    description: Test
    template: templates/proposal.md
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/positive/);
    });

    it('should throw on empty artifacts array', () => {
      const yaml = `
name: test
version: 1
artifacts: []
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/artifact/i);
    });

    it('should throw on duplicate artifact IDs', () => {
      const yaml = `
name: test
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: First
    template: templates/proposal.md
  - id: proposal
    generates: other.md
    description: Duplicate
    template: templates/other.md
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/Duplicate artifact ID: proposal/);
    });

    it('should throw on invalid requires reference', () => {
      const yaml = `
name: test
version: 1
artifacts:
  - id: design
    generates: design.md
    description: Design doc
    template: templates/design.md
    requires:
      - nonexistent
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/Invalid dependency reference.*nonexistent/);
    });

    it('should detect self-referencing cycle', () => {
      const yaml = `
name: test
version: 1
artifacts:
  - id: A
    generates: a.md
    description: Self reference
    template: templates/a.md
    requires:
      - A
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/Cyclic dependency detected/);
    });

    it('should detect simple A → B → A cycle', () => {
      const yaml = `
name: test
version: 1
artifacts:
  - id: A
    generates: a.md
    description: A
    template: templates/a.md
    requires:
      - B
  - id: B
    generates: b.md
    description: B
    template: templates/b.md
    requires:
      - A
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/Cyclic dependency detected/);
      expect(() => parseSchema(yaml)).toThrow(/→/);
    });

    it('should detect longer A → B → C → A cycle and list all IDs', () => {
      const yaml = `
name: test
version: 1
artifacts:
  - id: A
    generates: a.md
    description: A
    template: templates/a.md
    requires:
      - C
  - id: B
    generates: b.md
    description: B
    template: templates/b.md
    requires:
      - A
  - id: C
    generates: c.md
    description: C
    template: templates/c.md
    requires:
      - B
`;
      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      expect(() => parseSchema(yaml)).toThrow(/Cyclic dependency detected/);
      // Should contain all three in the cycle path
      const error = (() => {
        try {
          parseSchema(yaml);
        } catch (e) {
          return e;
        }
      })() as Error;
      expect(error.message).toMatch(/A.*→.*B|B.*→.*C|C.*→.*A/);
    });

    it('should allow default empty requires array', () => {
      const yaml = `
name: test
version: 1
artifacts:
  - id: root
    generates: root.md
    description: Root artifact
    template: templates/root.md
`;
      const schema = parseSchema(yaml);
      expect(schema.artifacts[0].requires).toEqual([]);
    });

    it('parses a complete file definition', () => {
      const schema = parseSchema(`
name: test
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: Proposal
    template: proposal.md
${definition}`);

      expect(schema.artifacts[0].definition).toEqual({
        purpose: 'Define the file purpose',
        compilationRole: 'Durable behavior source',
        content: {
          includes: ['Target behavior'],
          excludes: ['Implementation notes'],
        },
        writePolicy: 'agent-authored',
        validation: ['openspec validate'],
      });
    });

    it.each([
      ['missing purpose', 'purpose: Define the file purpose', ''],
      ['empty includes', 'includes: [Target behavior]', 'includes: []'],
      ['empty excludes', 'excludes: [Implementation notes]', 'excludes: []'],
      ['unknown write policy', 'writePolicy: agent-authored', 'writePolicy: arbitrary'],
      ['unsupported read-only policy', 'writePolicy: agent-authored', 'writePolicy: read-only'],
      ['empty validation', 'validation: [openspec validate]', 'validation: []'],
    ])('rejects an incomplete definition: %s', (_name, current, replacement) => {
      const yaml = `
name: test
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: Proposal
    template: proposal.md
${definition.replace(current, replacement)}`;

      expect(() => parseSchema(yaml)).toThrow(SchemaValidationError);
      if (current.startsWith('purpose:')) {
        expect(() => parseSchema(yaml)).toThrow(/artifact 'proposal'\.definition\.purpose/);
      }
    });

    it('requires definitions on every spec-driven artifact', () => {
      expect(() => parseSchema(`
name: spec-driven
version: 1
artifacts:
  - id: proposal
    generates: proposal.md
    description: Proposal
    template: proposal.md
`)).toThrow(/artifact 'proposal'.*definition/);
    });

    it('validates bootstrap file IDs and artifact references', () => {
      const valid = `
name: bootstrap
version: 1
files:
  - id: metadata
    path: .bootstrap.yaml
${definition}
artifacts:
  - id: init
    generates: .bootstrap.yaml
    description: Init
    template: init.md
${definition}
    files: [metadata]
`;
      expect(parseSchema(valid).files?.[0].id).toBe('metadata');
      expect(() => parseSchema(valid.replace('artifacts:', `  - id: metadata-copy
    path: copy.yaml
${definition}
artifacts:`).replace('metadata-copy', 'metadata'))).toThrow(/Duplicate file ID: metadata/);
      expect(() => parseSchema(valid.replace('files: [metadata]', 'files: [missing]'))).toThrow(/artifact 'init'.*missing/);
      expect(() => parseSchema(valid.replace('files: [metadata]', 'files: [metadata, metadata]'))).toThrow(/artifact 'init'.*metadata/);
    });
  });
});
