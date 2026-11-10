import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  loadTemplate,
  loadChangeContext,
  formatChangeStatus,
  TemplateLoadError,
} from '../../../src/core/artifact-graph/instruction-loader.js';

function canonicalPath(filePath: string): string {
  return fs.realpathSync.native(filePath);
}

describe('instruction-loader', () => {
  describe('loadTemplate', () => {
    it('loads the proposal source-impact template', () => {
      const template = loadTemplate('semantic-model', 'proposal.md');

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
      expect(() => loadTemplate('semantic-model', 'nonexistent.md')).toThrow(
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
        loadTemplate('semantic-model', 'nonexistent.md');
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
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should load context with default schema', () => {
      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('semantic-model');
      expect(context.changeName).toBe('my-change');
      expect(context.graph.getName()).toBe('semantic-model');
      expect(context.completed.size).toBe(0);
    });

    it('should load context with explicit schema', () => {
      const context = loadChangeContext(tempDir, 'my-change', 'semantic-model');

      expect(context.schemaName).toBe('semantic-model');
      expect(context.graph.getName()).toBe('semantic-model');
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
      fs.writeFileSync(path.join(changeDir, '.xirang.yaml'), 'schema: semantic-model\ncreated: "2025-01-05"\n');

      // Load without explicit schema - should detect from metadata
      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('semantic-model');
      expect(context.graph.getName()).toBe('semantic-model');
    });

    it('should use explicit schema over metadata schema', () => {
      // Create change directory with metadata file using semantic-model
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, '.xirang.yaml'), 'schema: semantic-model\n');

      // Load with explicit schema - should override metadata
      const context = loadChangeContext(tempDir, 'my-change', 'semantic-model');

      expect(context.schemaName).toBe('semantic-model');
      expect(context.graph.getName()).toBe('semantic-model');
    });

    it('should fall back to default when no metadata and no explicit schema', () => {
      // Create change directory without metadata file
      const changeDir = path.join(tempDir, '.xirang', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });

      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('semantic-model');
    });
  });

  describe('formatChangeStatus', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should show all artifacts as ready/blocked when nothing completed', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      expect(status.changeName).toBe('my-change');
      expect(status.schemaName).toBe('semantic-model');
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

      // Create all required files for semantic-model schema
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
