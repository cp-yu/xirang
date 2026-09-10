import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { gunzipSync } from 'zlib';
import { parse as parseYaml } from 'yaml';

import { generateSubagentContent, type SubagentTemplate } from '../../../src/core/shared/subagent-generation.js';
import { ArtifactSyncEngine } from '../../../src/core/templates/sync-engine.js';

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const RETIRED_SWEEPER_REFERENCE_FIXTURES = {
  'xirang-evidence-protocol.md': 'IyBJbXBhY3QgU3dlZXBlciBFdmlkZW5jZSBQcm90b2NvbAoKMS4gUXVlcnkga25vd24gc3RhYmxlIGlkZW50aXRpZXMgd2l0aCBgeGlyYW5nIGFyY2ggcXVlcnkgPGVsZW1lbnRJZD4gLS1yZWxhdGlvbnMgLS1kZXB0aCAyIC0tanNvbmAuIFByZXNlcnZlIGVhY2ggcmVsYXRpb25zaGlwJ3MgY2Fub25pY2FsIHNvdXJjZS9raW5kL3RhcmdldCBkaXJlY3Rpb24uCjIuIFVzZSBwYXJlbnQgYW5kIGNoaWxkcmVuIGFzIGFic3RyYWN0aW9uL3JlZmluZW1lbnQgY29udGV4dCBvbmx5OyBhZGphY2VuY3kgYWxvbmUgZG9lcyBub3QgcHJvdmUgYG11c3RDaGFuZ2VgLgozLiBSdW4gYHhpcmFuZyBsaXN0IC0tc3BlY3MgLS1qc29uYCBhbmQgdXNlIHRoZSBFbGVtZW50IENvbnRyYWN0IHJlZ2lzdHJ5IHRvIHJlYWQgU3BlY3Mgb3duZWQgYnkgY2FuZGlkYXRlIGVsZW1lbnRzLgo0LiBDb2xsZWN0IGN1cnJlbnQgY29kZSBldmlkZW5jZSBhZnRlciBzZW1hbnRpYyBtYXBwaW5nLiBJZiBDb2RlR3JhcGggaXMgYXZhaWxhYmxlLCB1c2UgaXRzIENMSS9NQ1Agc3ltYm9sLCBjYWxsLCBpbXBvcnQsIGFuZCBibGFzdC1yYWRpdXMgZXZpZGVuY2UgYXMgYW4gb3B0aW9uYWwgYWNjZWxlcmF0b3IuIE5ldmVyIGluc3RhbGwgaXQgYXV0b21hdGljYWxseSBhbmQgbmV2ZXIgcmVhZCBgLmNvZGVncmFwaC9jb2RlZ3JhcGguZGJgLgo1LiBJZiBDb2RlR3JhcGggaXMgdW5hdmFpbGFibGUgb3IgZmFpbHMsIGNvbnRpbnVlIHdpdGggQUNFLCBgcmdgLCBgcmVhZGAsIGFuZCBgZ2l0IGxzLWZpbGVzYDsgZGlzY2xvc2UgcmVkdWNlZCBldmlkZW5jZSBjb3ZlcmFnZSBpbiBgdW5rbm93bmAgb3IgYHF1ZXN0aW9uc2AgcmF0aGVyIHRoYW4gYmxvY2tpbmcuCjYuIFVzZSBjYW5vbmljYWwgYGVsZW1lbnRJZGAgdmFsdWVzIGluIHRoZSByZXBvcnQuIEEgY3VycmVudCBGUU4gTUFZIGFjY29tcGFueSBhbiBlbGVtZW50IG9ubHkgYXMgc291cmNlIG5hdmlnYXRpb24gZXZpZGVuY2UuCjcuIFdoZW4gb3B0aW9uYWxDaGFuZ2VOYW1lIGlzIHByb3ZpZGVkLCBpbnNwZWN0IG9ubHkgdGhhdCBjaGFuZ2UncyBhcnRpZmFjdHM7IGV4Y2x1ZGUgYXJjaGl2ZSBoaXN0b3J5Lgo4LiBDbGFzc2lmeSBmaW5kaW5ncyBhcyBgbXVzdENoYW5nZWAsIGBtdXN0VmVyaWZ5YCwgYGNvbnRleHR1YWxgLCBgdW5rbm93bmAsIG9yIGBhcmNoaXRlY3R1cmVEcmlmdGAuIEV2ZXJ5IGZpbmRpbmcgaW5jbHVkZXMgdGFyZ2V0LCByZWxhdGlvblBhdGgsIHJlYXNvbiwgYW5kIGV2aWRlbmNlLgo5LiBVc2UgYGFyY2hpdGVjdHVyZURyaWZ0YCB3aGVuIFNlbWFudGljIE1vZGVsIHJlbGF0aW9uc2hpcCBldmlkZW5jZSBjb25mbGljdHMgd2l0aCBjdXJyZW50IGNhbGwvaW1wb3J0L3N5bWJvbCBldmlkZW5jZSwgcHJlc2VydmluZyBib3RoIHNpZGVzLgoxMC4gRG8gbm90IHNpbGVudGx5IHVwZ3JhZGUgYW1iaWd1aXR5OiBpbnN1ZmZpY2llbnQgZXZpZGVuY2UgcmVtYWlucyBgdW5rbm93bmAsIGFuZCBzY29wZS1hZmZlY3RpbmcgZ2FwcyBiZWNvbWUgYHF1ZXN0aW9uc2AuCjExLiBXaGlsZSByZWFkaW5nIGFmZmVjdGVkIFNwZWNzLCBydW4gdGhlIHRlcm1pbm9sb2d5IGF3YXJlbmVzcyBzdGVwLg==',
  'xirang-terminology-awareness.md': 'IyBJbXBhY3QgU3dlZXBlciBUZXJtaW5vbG9neSBBd2FyZW5lc3MKCklkZW50aWZ5IHRlcm1zIHNlbWFudGljYWxseSByZWxhdGVkIHRvIHVzZXIncyBgY29uY2VwdGAgaW5wdXQgd2hpbGUgcmVhZGluZyBhZmZlY3RlZCBzcGVjcy4gRXh0cmFjdCBvbmx5IGRvbWFpbiB0ZXJtcyBjbG9zZSB0byB0aGF0IGNvbmNlcHQsIG5vdCBldmVyeSBub3VuIGluIHRoZSBmaWxlOyBpZiBjb25jZXB0IGlzICd3b3JrZmxvdycsIGV4dHJhY3QgJ3Byb2Nlc3MnLCAncGlwZWxpbmUnLCAnZmxvdycgZXRjLiBhbmQgaWdub3JlIHVucmVsYXRlZCB0ZXJtcyBzdWNoIGFzICd0b3BvbG9naWNhbCBzb3J0JyBvciAnYXJ0aWZhY3QnLgoKRm9yIGVhY2ggZXh0cmFjdGVkIHRlcm0sIGNvdW50IG9jY3VycmVuY2VzIGFuZCByZWNvcmQgdGhlIHNwZWMgbmFtZXMgd2hlcmUgaXQgYXBwZWFycy4gVXNlIHRoZSBzcGVjIGlkZW50aWZpZXIgcmV0dXJuZWQgYnkgYHhpcmFuZyBsaXN0IC0tc3BlY3MgLS1qc29uYCB3aGVuIGF2YWlsYWJsZTsgb3RoZXJ3aXNlIHVzZSB0aGUgc3BlYyBkaXJlY3RvcnkgbmFtZSB3aXRob3V0IHBhdGggcHJlZml4ZXMgb3IgZmlsZSBleHRlbnNpb25zLiBTb3J0IGV4dHJhY3RlZCB0ZXJtcyBieSBkZXNjZW5kaW5nIGNvdW50LCB0aGVuIGJ5IHRlcm0uCgpSZWNvcmQgaW4gYHRlcm1pbm9sb2d5T2JzZXJ2YXRpb25zYCBmaWVsZDoKCmBgYGpzb24KewogICJ1c2VySW5wdXQiOiAic3RyaW5nIiwKICAiZm91bmRJblNwZWNzIjogWwogICAgewogICAgICAidGVybSI6ICJzdHJpbmciLAogICAgICAic3BlY3MiOiBbInN0cmluZyJdLAogICAgICAiY291bnQiOiAxCiAgICB9CiAgXQp9CmBgYAoKUmVwb3J0IGZhY3RzIG9ubHksIG5vIGp1ZGdtZW50IG9yIHJlY29tbWVuZGF0aW9ucy4gRG8gbm90IGRlY2lkZSB3aGV0aGVyIHRlcm1zIGFyZSBjb3JyZWN0IG9yIHNob3VsZCBiZSB1bmlmaWVkLiBJZiB0ZXJtaW5vbG9neSBleHRyYWN0aW9uIGZhaWxzLCBvbWl0IGB0ZXJtaW5vbG9neU9ic2VydmF0aW9uc2AgYW5kIGtlZXAgdGhlIHJlcG9ydCB1c2FibGUgd2l0aCBub3JtYWwgaW1wYWN0IGZpZWxkcy4=',
  'xirang-report-schema.md': 'IyBJbXBhY3QgU3dlZXBlciBKU09OIFJlcG9ydCBTY2hlbWEKCmBgYGpzb24KewogICJjb25jZXB0IjogInN0cmluZyIsCiAgInByb2plY3RSb290IjogInN0cmluZyIsCiAgInRlcm1NYXBwaW5ncyI6IFt7ICJ1c2VyVGVybSI6ICJzdHJpbmciLCAicHJvamVjdFRlcm1zIjogWyJzdHJpbmciXSwgImV2aWRlbmNlIjogWyJzdHJpbmciXSB9XSwKICAieGlyYW5nIjogewogICAgImVsZW1lbnRzIjogW3sgImVsZW1lbnRJZCI6ICJzdHJpbmciLCAiZnFuIjogInN0cmluZyBvciBudWxsIiwgInJlYXNvbiI6ICJzdHJpbmciIH1dLAogICAgInJlbGF0aW9uc0V4cGFuZGVkIjogW3sgImZyb20iOiAiZWxlbWVudElkIiwgInR5cGUiOiAic3RyaW5nIiwgInRvIjogImVsZW1lbnRJZCIgfV0KICB9LAogICJtdXN0Q2hhbmdlIjogW3sgInRhcmdldCI6ICJzdHJpbmciLCAicmVsYXRpb25QYXRoIjogW10sICJyZWFzb24iOiAic3RyaW5nIiwgImV2aWRlbmNlIjogWyJzdHJpbmciXSB9XSwKICAibXVzdFZlcmlmeSI6IFt7ICJ0YXJnZXQiOiAic3RyaW5nIiwgInJlbGF0aW9uUGF0aCI6IFtdLCAicmVhc29uIjogInN0cmluZyIsICJldmlkZW5jZSI6IFsic3RyaW5nIl0gfV0sCiAgImNvbnRleHR1YWwiOiBbeyAidGFyZ2V0IjogInN0cmluZyIsICJyZWxhdGlvblBhdGgiOiBbXSwgInJlYXNvbiI6ICJzdHJpbmciLCAiZXZpZGVuY2UiOiBbInN0cmluZyJdIH1dLAogICJ1bmtub3duIjogW3sgInRhcmdldCI6ICJzdHJpbmciLCAicmVsYXRpb25QYXRoIjogW10sICJyZWFzb24iOiAic3RyaW5nIiwgImV2aWRlbmNlIjogWyJzdHJpbmciXSB9XSwKICAiYXJjaGl0ZWN0dXJlRHJpZnQiOiBbeyAidGFyZ2V0IjogInN0cmluZyIsICJyZWxhdGlvblBhdGgiOiBbXSwgInJlYXNvbiI6ICJzdHJpbmciLCAiZXZpZGVuY2UiOiBbIkxpa2VDNCBldmlkZW5jZSIsICJjb2RlIGV2aWRlbmNlIl0gfV0sCiAgInF1ZXN0aW9ucyI6IFsic3RyaW5nIl0sCiAgInRlcm1pbm9sb2d5T2JzZXJ2YXRpb25zIjogewogICAgInVzZXJJbnB1dCI6ICJzdHJpbmciLAogICAgImZvdW5kSW5TcGVjcyI6IFt7ICJ0ZXJtIjogInN0cmluZyIsICJzcGVjcyI6IFsic3RyaW5nIl0sICJjb3VudCI6IDEgfV0KICB9Cn0KYGBgCgpGaWVsZCBuYW1lcyBhcmUgY2Fub25pY2FsLiBPbWl0IGB0ZXJtaW5vbG9neU9ic2VydmF0aW9uc2Agb25seSB3aGVuIGV4dHJhY3Rpb24gaXMgdW5hdmFpbGFibGUuIFJldHVybiB0aGlzIG9iamVjdCBkaXJlY3RseSB0byB0aGUgY2FsbGVyOyBpdCBpcyBldmlkZW5jZSBmb3IgdGhlIGN1cnJlbnQgRXhwbG9yZSBjb252ZXJzYXRpb24sIG5ldmVyIGEgc3luYy9hcmNoaXZlIGlucHV0Lg==',
} as const;

const RETIRED_SWEEPER_AGENT_FIXTURES = [
  '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',
] as const;

function retiredAgentTemplate(compressedArtifact: string): SubagentTemplate {
  const artifact = gunzipSync(Buffer.from(compressedArtifact, 'base64')).toString('utf8');
  const match = artifact.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
  if (!match) throw new Error('Invalid historical Sweeper artifact fixture');
  const frontmatter = parseYaml(match[1]) as Record<string, string>;
  return {
    name: frontmatter.name,
    description: frontmatter.description.replace(/ Pi callers: run foreground and omit timeoutMs\/maxRuntimeMs\.$/, ''),
    prompt: match[2].replace(/\n$/, ''),
    tools: frontmatter.tools.split(',').map(tool => tool.trim()),
    disallowedTools: ['write', 'edit'],
    mode: 'read-only',
  };
}

describe('ArtifactSyncEngine subagent artifacts', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `xirang-sync-engine-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, '.xirang'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('writes workflow skills and internal subagent artifacts for native tools', async () => {
    const summary = await ArtifactSyncEngine.syncAll([
      { toolId: 'claude', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'pi', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'opencode', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'codex', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
    ]);

    expect(summary.failed).toEqual([]);

    for (const [toolDir, ext] of [
      ['.claude', 'md'],
      ['.pi', 'md'],
      ['.opencode', 'md'],
      ['.codex', 'toml'],
    ] as const) {
      await expect(
        fs.stat(path.join(testDir, toolDir, 'skills', 'xirang-propose', 'SKILL.md'))
      ).resolves.toBeDefined();
      await expect(
        fs.stat(path.join(testDir, toolDir, 'skills', 'xirang-explore', 'SKILL.md'))
      ).resolves.toBeDefined();

      for (const name of [
        'xirang-reviewer',
        'xirang-optimizer',
      ]) {
        await expect(
          fs.stat(path.join(testDir, toolDir, 'agents', `${name}.${ext}`))
        ).resolves.toBeDefined();
        expect(await exists(path.join(testDir, toolDir, 'skills', name, 'SKILL.md'))).toBe(false);
      }
    }
  });

  it('removes only explicitly named stale shared references', async () => {
    const referencesDir = path.join(testDir, '.xirang', 'references');
    await fs.mkdir(referencesDir, { recursive: true });
    await fs.writeFile(path.join(referencesDir, 'xirang-apply-phase2-optimization.md'), 'stale');
    for (const retired of [
      'xirang-apply-step-3-phase1-verification.md',
      'xirang-apply-step-4-phase2-optimization.md',
      'xirang-apply-step-5-phase3-seal.md',
    ]) {
      await fs.writeFile(path.join(referencesDir, retired), 'stale');
    }
    await fs.writeFile(path.join(referencesDir, 'user-reference.md'), 'user');

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['apply'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    expect(await exists(path.join(referencesDir, 'xirang-apply-phase2-optimization.md'))).toBe(false);
    for (const retired of [
      'xirang-apply-step-3-phase1-verification.md',
      'xirang-apply-step-4-phase2-optimization.md',
      'xirang-apply-step-5-phase3-seal.md',
    ]) {
      expect(await exists(path.join(referencesDir, retired))).toBe(false);
    }
    expect(await exists(path.join(referencesDir, 'user-reference.md'))).toBe(true);
  });

  it('removes generated retired Sweeper agents but preserves user-owned same-name files', async () => {
    const piAgents = path.join(testDir, '.pi', 'agents');
    const claudeAgents = path.join(testDir, '.claude', 'agents');
    await fs.mkdir(piAgents, { recursive: true });
    await fs.mkdir(claudeAgents, { recursive: true });
    const generated = (name: string) => `---\nname: ${name}\ndescription: generated\nmetadata:\n  generatedBy: test\n---\n\n## Role\n\nYou are an impact sweeper for Xirang Explore.\n`;
    await fs.writeFile(path.join(piAgents, 'xirang-impact-sweeper.md'), generated('xirang-impact-sweeper'));
    await fs.writeFile(path.join(piAgents, 'opsx-impact-sweeper.md'), generated('opsx-impact-sweeper'));
    const userAgent = 'User notes: You are an impact sweeper for Xirang Explore. This is not generated.\n';
    await fs.writeFile(path.join(claudeAgents, 'xirang-impact-sweeper.md'), userAgent);

    await ArtifactSyncEngine.syncAll([
      { toolId: 'pi', projectPath: testDir, workflows: ['explore'], version: 'test' },
      { toolId: 'claude', projectPath: testDir, workflows: ['explore'], version: 'test' },
    ]);

    expect(await exists(path.join(piAgents, 'xirang-impact-sweeper.md'))).toBe(false);
    expect(await exists(path.join(piAgents, 'opsx-impact-sweeper.md'))).toBe(false);
    await expect(fs.readFile(path.join(claudeAgents, 'xirang-impact-sweeper.md'), 'utf8')).resolves.toBe(userAgent);
  });

  it('removes byte-exact historical Sweeper agents from every renderer', async () => {
    const tools = [
      ['claude', '.claude', 'md'],
      ['pi', '.pi', 'md'],
      ['opencode', '.opencode', 'md'],
      ['codex', '.codex', 'toml'],
    ] as const;

    for (const compressedArtifact of RETIRED_SWEEPER_AGENT_FIXTURES) {
      const template = retiredAgentTemplate(compressedArtifact);
      for (const [toolId, toolDir, extension] of tools) {
        const agentsDir = path.join(testDir, toolDir, 'agents');
        const agentPath = path.join(agentsDir, `${template.name}.${extension}`);
        await fs.mkdir(agentsDir, { recursive: true });
        await fs.writeFile(agentPath, generateSubagentContent(template, toolId, 'historical'));

        const result = await ArtifactSyncEngine.syncOne({
          toolId,
          projectPath: testDir,
          workflows: ['explore'],
          version: 'test',
        });

        expect(result.error).toBeUndefined();
        expect(await exists(agentPath)).toBe(false);
      }
    }
  });

  it('removes generated retired Sweeper references but preserves user-owned same-name content', async () => {
    const referencesDir = path.join(testDir, '.xirang', 'references');
    await fs.mkdir(referencesDir, { recursive: true });
    await fs.writeFile(
      path.join(referencesDir, 'xirang-evidence-protocol.md'),
      Buffer.from(RETIRED_SWEEPER_REFERENCE_FIXTURES['xirang-evidence-protocol.md'], 'base64')
    );
    await fs.writeFile(
      path.join(referencesDir, 'xirang-terminology-awareness.md'),
      Buffer.from(RETIRED_SWEEPER_REFERENCE_FIXTURES['xirang-terminology-awareness.md'], 'base64')
    );
    await fs.writeFile(
      path.join(referencesDir, 'xirang-report-schema.md'),
      '# Impact Sweeper JSON Report Schema\n\nUser-authored replacement content.\n'
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(await exists(path.join(referencesDir, 'xirang-evidence-protocol.md'))).toBe(false);
    expect(await exists(path.join(referencesDir, 'xirang-terminology-awareness.md'))).toBe(false);
    await expect(fs.readFile(path.join(referencesDir, 'xirang-report-schema.md'), 'utf8')).resolves.toBe(
      '# Impact Sweeper JSON Report Schema\n\nUser-authored replacement content.\n'
    );

    await fs.writeFile(
      path.join(referencesDir, 'xirang-report-schema.md'),
      Buffer.from(RETIRED_SWEEPER_REFERENCE_FIXTURES['xirang-report-schema.md'], 'base64')
    );
    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });
    expect(await exists(path.join(referencesDir, 'xirang-report-schema.md'))).toBe(false);
  });

  it.each([
    ['claude', '.claude/commands/xirang/apply.md', '.claude/commands/xirang/custom.md'],
    ['github-copilot', '.github/prompts/xirang-apply.prompt.md', '.github/prompts/custom.prompt.md'],
  ])('removes the retired %s apply command without touching user commands', async (toolId, retiredPath, userPath) => {
    await fs.mkdir(path.dirname(path.join(testDir, retiredPath)), { recursive: true });
    await fs.writeFile(path.join(testDir, retiredPath), 'legacy Search/Replace workflow');
    await fs.writeFile(path.join(testDir, userPath), 'user command');

    const result = await ArtifactSyncEngine.syncOne({
      toolId,
      projectPath: testDir,
      workflows: ['apply'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    expect(result.commandsRemoved).toBe(1);
    expect(await exists(path.join(testDir, retiredPath))).toBe(false);
    expect(await fs.readFile(path.join(testDir, userPath), 'utf-8')).toBe('user command');
  });

  it('uses path.join-compatible subagent paths and tool-specific extensions', async () => {
    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'codex',
      projectPath: testDir,
      workflows: ['apply'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    await expect(
      fs.stat(path.join(testDir, '.codex', 'agents', 'xirang-optimizer.toml'))
    ).resolves.toBeDefined();
    await expect(
      fs.stat(path.join(testDir, '.codex', 'agents', 'xirang-reviewer.toml'))
    ).resolves.toBeDefined();
    expect(await exists(path.join(testDir, '.codex/agents/xirang-optimizer.md'))).toBe(false);
  });

  it('cleans up generated internal skill directories by explicit managed name', async () => {
    const skillsDir = path.join(testDir, '.claude', 'skills');
    for (const name of [
      'xirang-reviewer',
      'xirang-optimizer',
      'xirang-impact-sweeper',
      'opsx-impact-sweeper',
      'opsx-implementer',
      'user-skill',
    ]) {
      await fs.mkdir(path.join(skillsDir, name), { recursive: true });
      await fs.writeFile(
        path.join(skillsDir, name, 'SKILL.md'),
        name === 'user-skill' ? name : `---\nmetadata:\n  generatedBy: test\n---\n\n${name}\n`,
      );
    }

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'claude',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    for (const name of [
      'xirang-reviewer',
      'xirang-optimizer',
      'xirang-impact-sweeper',
      'opsx-impact-sweeper',
      'opsx-implementer',
    ]) {
      expect(await exists(path.join(skillsDir, name))).toBe(false);
    }
    expect(await exists(path.join(skillsDir, 'xirang-explore', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(skillsDir, 'user-skill', 'SKILL.md'))).toBe(true);
  });

  it('preserves a user-owned retired Sweeper skill directory without generated ownership', async () => {
    const skillFile = path.join(testDir, '.pi', 'skills', 'xirang-impact-sweeper', 'SKILL.md');
    await fs.mkdir(path.dirname(skillFile), { recursive: true });
    await fs.writeFile(skillFile, 'user-owned skill');

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    await expect(fs.readFile(skillFile, 'utf8')).resolves.toBe('user-owned skill');
  });

  it('preserves user-defined agents files while overwriting managed subagents', async () => {
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(path.join(agentsDir, 'my-custom.md'), 'custom');
    await fs.writeFile(path.join(agentsDir, 'xirang-reviewer.md'), 'stale');

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    await expect(fs.readFile(path.join(agentsDir, 'my-custom.md'), 'utf-8')).resolves.toBe('custom');
    await expect(fs.readFile(path.join(agentsDir, 'xirang-reviewer.md'), 'utf-8')).resolves.toContain('name: xirang-reviewer');
  });

  it('preserves user-set model value on update', async () => {
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create agent file with user-customized model
    await fs.writeFile(
      path.join(agentsDir, 'xirang-reviewer.md'),
      `---
name: xirang-reviewer
description: test
tools: read, grep
model: "anthropic/claude-sonnet-4"
---

User-changed prompt.`
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'xirang-reviewer.md'), 'utf-8');
    expect(content).toContain('model: "anthropic/claude-sonnet-4"');
  });

  it('preserves user-set model value in toml agent on update', async () => {
    const agentsDir = path.join(testDir, '.codex', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create toml agent file with user-customized model
    await fs.writeFile(
      path.join(agentsDir, 'xirang-reviewer.toml'),
      `name = "xirang-reviewer"
description = "test"
model = "gpt-5"
sandbox_mode = "read-only"

developer_instructions = """
stale
"""
`
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'codex',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'xirang-reviewer.toml'), 'utf-8');
    expect(content).toContain('model = "gpt-5"');
  });

  it('does not preserve model when set to inherit', async () => {
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create agent file with model: 'inherit'
    await fs.writeFile(
      path.join(agentsDir, 'xirang-reviewer.md'),
      `---
name: xirang-reviewer
description: test
tools: read, grep
model: "inherit"
---

Stale prompt.`
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'xirang-reviewer.md'), 'utf-8');
    // model: "inherit" is a sentinel for 'no override' — should be stripped
    expect(content).not.toContain('model:');
  });

  it('generated content has no model field when template has no model', async () => {
    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(
      path.join(testDir, '.pi', 'agents', 'xirang-reviewer.md'),
      'utf-8'
    );
    // Fresh generation without override should not write model
    expect(content).not.toContain('model:');
  });
});
