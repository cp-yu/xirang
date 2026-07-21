import { describe, it, expect } from 'vitest';
import { WorkflowManifestRegistry } from '../../../../src/core/templates/manifest/registry.js';

describe('WorkflowManifestRegistry', () => {
  describe('固定的 6 个工作流', () => {
    it('should contain exactly 6 workflows', () => {
      const entries = WorkflowManifestRegistry.entries;
      expect(entries).toHaveLength(6);
    });

    it('should contain propose, explore, apply, archive, bootstrap-arch, snack', () => {
      const workflowIds = WorkflowManifestRegistry.getAllWorkflowIds();
      expect(workflowIds).toEqual([
        'propose',
        'explore',
        'apply',
        'archive',
        'bootstrap-arch',
        'snack',
      ]);
    });

    it('should not contain removed workflows', () => {
      const removedWorkflows = ['new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive', 'onboard'];
      for (const workflowId of removedWorkflows) {
        expect(WorkflowManifestRegistry.has(workflowId)).toBe(false);
      }
    });
  });

  describe('modeMembership 作为标签系统', () => {
    it('core workflows should have ["core"] tag', () => {
      const coreWorkflows = ['propose', 'explore', 'apply', 'archive'];
      for (const workflowId of coreWorkflows) {
        const entry = WorkflowManifestRegistry.get(workflowId);
        expect(entry?.modeMembership).toEqual(['core']);
      }
    });

    it('snack should have ["flexible"] tag (transitional capability)', () => {
      const entry = WorkflowManifestRegistry.get('snack');
      expect(entry?.modeMembership).toEqual(['flexible']);
    });

    it('bootstrap-arch should have empty modeMembership', () => {
      const entry = WorkflowManifestRegistry.get('bootstrap-arch');
      expect(entry?.modeMembership).toEqual([]);
    });
  });

  describe('skill-only entries', () => {
    it('all entries should register skill templates and no command templates', () => {
      for (const entry of WorkflowManifestRegistry.entries) {
        expect(entry.getSkillTemplate).toBeDefined();
      }
    });
  });

  describe('getSkillNames', () => {
    it('should return 6 skill names', () => {
      const skillNames = WorkflowManifestRegistry.getSkillNames();
      expect(skillNames).toHaveLength(6);
      expect(skillNames).toContain('opsx-propose');
      expect(skillNames).toContain('opsx-explore');
      expect(skillNames).toContain('opsx-apply-change');
      expect(skillNames).toContain('opsx-archive-change');
      expect(skillNames).toContain('opsx-bootstrap-arch');
      expect(skillNames).toContain('opsx-snack');
    });
  });

  describe('getCommandSlugMap', () => {
    it('should map workflow IDs to command slugs', () => {
      const map = WorkflowManifestRegistry.getCommandSlugMap();
      expect(map).toEqual({
        'propose': 'propose',
        'explore': 'explore',
        'apply': 'apply',
        'archive': 'archive',
        'bootstrap-arch': 'bootstrap',
        'snack': 'snack',
      });
    });
  });
});
