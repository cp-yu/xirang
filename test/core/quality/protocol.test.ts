import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { commandSchemas, qualityOptionMetadata } from '../../../src/core/quality/command-schema.js';
import {
  renderQualityPayloadSchema, renderQualityCliReference, renderQualityOverview,
  renderQualityStateDiagram, renderQualityErrorRecovery, renderQualityFastPath, renderReviewHelp,
} from '../../../src/core/quality/protocol.js';
import {
  QUALITY_CLI_JSON_SCHEMA_REFERENCE, QUALITY_STATE_MACHINE_DIAGRAM,
  QUALITY_ERROR_RECOVERY_GUIDE, QUALITY_SIMPLE_CHANGE_FAST_PATH,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import { runCLI } from '../../helpers/run-cli.js';

function renderedSchema(name: keyof typeof commandSchemas) {
  const block = renderQualityPayloadSchema(name).match(/```json\n([^]*?)\n```/);
  expect(block).not.toBeNull();
  return JSON.parse(block![1]);
}

describe('quality protocol projection', () => {
  it('derives every reference fragment from the shared protocol renderers', () => {
    expect(QUALITY_STATE_MACHINE_DIAGRAM).toBe(renderQualityStateDiagram());
    expect(QUALITY_CLI_JSON_SCHEMA_REFERENCE).toBe(renderQualityCliReference());
    expect(QUALITY_ERROR_RECOVERY_GUIDE).toBe(renderQualityErrorRecovery());
    expect(QUALITY_SIMPLE_CHANGE_FAST_PATH).toBe(renderQualityFastPath());
  });

  it.each(Object.keys(commandSchemas) as Array<keyof typeof commandSchemas>)('renders the runtime input schema for %s including refinements without throwing', name => {
    const schema = renderedSchema(name);
    expect(schema).toEqual(z.toJSONSchema(commandSchemas[name], { io: 'input' }));
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(Object.keys(schema.properties)).toEqual(Object.keys(commandSchemas[name].shape));
    expect(renderQualityCliReference()).toContain(renderQualityPayloadSchema(name));
  });

  it('uses the runtime option metadata and projects the same schemas into public help', async () => {
    for (const option of Object.values(qualityOptionMetadata)) {
      expect(renderQualityOverview()).toContain(option.flags);
    }
    for (const [command, names] of [
      ['review', ['reviewBegin', 'reviewSubmit']],
      ['delegation', ['delegationStart', 'delegationSave', 'delegationSkip']],
      ['conclusion', ['completionPlan', 'completionComplete']],
    ] as const) {
      const result = await runCLI(['quality', command, '--help']);
      expect(result.exitCode, result.stderr).toBe(0);
      for (const name of names) expect(result.stdout).toContain(renderQualityPayloadSchema(name));
    }
  });

  it('publishes a minimal begin payload accepted by the strict runtime parser', () => {
    const exampleLine = renderReviewHelp().split('\n').find(line => line.startsWith('{"scope"'));
    expect(exampleLine).toBeDefined();
    const example = JSON.parse(exampleLine!);
    expect(commandSchemas.reviewBegin.parse(example)).toEqual(example);
    expect(commandSchemas.reviewBegin.safeParse({ ...example, version: 0 }).success).toBe(false);
  });
});
