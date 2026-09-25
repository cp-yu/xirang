import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

interface WorkflowStep {
  name?: string;
  run?: string;
}

interface Workflow {
  jobs?: {
    [job: string]: {
      steps?: WorkflowStep[];
    };
  };
}

describe('Windows Definition cutover coverage', () => {
  it('runs the migration and affected path-sensitive root tests', () => {
    const workflow = parse(readFileSync('.github/workflows/test-windows.yml', 'utf8')) as Workflow;
    const steps = workflow.jobs?.likec4?.steps ?? [];
    const rootStep = steps.find((step) => step.name === 'Run Windows path-sensitive root tests');

    expect(rootStep?.run).toBeDefined();
    for (const testPath of [
      'test/core/setup.test.ts',
      'test/core/model/candidate-partitions.test.ts',
      'test/core/model/validator.test.ts',
      'test/core/model/parser.test.ts',
      'test/core/model/sync-writer.test.ts',
      'test/core/likec4/generator.test.ts',
      'test/core/likec4/generator-validate.test.ts',
      'test/commands/arch-query.test.ts',
      'test/commands/arch-search.test.ts',
      'test/commands/arch-impact.test.ts',
    ]) {
      expect(rootStep?.run).toContain(testPath);
    }
  });

  it.each(['test-windows.yml', 'windows.yml'])('%s executes defaults, records, and Candidate handoff on Windows', (file) => {
    const workflow = parse(readFileSync(`.github/workflows/${file}`, 'utf8')) as Workflow;
    const commands = Object.values(workflow.jobs ?? {}).flatMap(job => job.steps ?? []).map(step => step.run ?? '').join('\n');
    for (const testPath of [
      'test/core/project-config.test.ts', 'test/core/setup.test.ts', 'test/core/update.test.ts',
      'test/core/framing/paths.test.ts', 'test/core/framing/workspace.test.ts', 'test/core/framing/consume.test.ts',
      'test/integration/framing-workflow.test.ts', 'test/commands/candidate-init.test.ts',
      'test/commands/candidate-validate.test.ts', 'test/core/candidate-digest.test.ts',
      'test/core/candidate-history.test.ts', 'test/commands/candidate-promote.test.ts',
    ]) expect(commands).toContain(testPath);
  });

  it('runs the runtime protocol and focus projection tests', () => {
    const workflow = parse(readFileSync('.github/workflows/test-windows.yml', 'utf8')) as Workflow;
    const steps = workflow.jobs?.likec4?.steps ?? [];
    const browserStep = steps.find((step) => step.name === 'Run Windows vendored browser-server tests');

    expect(browserStep?.run).toContain('packages/diagram/src/xirang/architectureView.spec.ts');
    expect(browserStep?.run).toContain('packages/diagram/src/likec4diagram/state/machine.state.navigating.spec.ts');
    expect(browserStep?.run).toContain('packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx');
  });
});
