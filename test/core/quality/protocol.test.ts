import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { commandSchemas, qualityOptionMetadata } from '../../../src/core/quality/command-schema.js';
import {
  renderQualityPayloadSchema, renderQualityCliReference, renderQualityOverview,
  renderQualityErrorRecovery, renderReviewHelp, renderOptHelp, renderSealHelp,
} from '../../../src/core/quality/protocol.js';
import {
  QUALITY_CLI_JSON_SCHEMA_REFERENCE, QUALITY_ERROR_RECOVERY_GUIDE,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import { runCLI } from '../../helpers/run-cli.js';

function renderedSchema(name: keyof typeof commandSchemas) {
  const block = renderQualityPayloadSchema(name).match(/```json\n([^]*?)\n```/);
  expect(block).not.toBeNull();
  return JSON.parse(block![1]);
}

describe('quality protocol projection', () => {
  it('derives the CLI reference and recovery fragment from shared protocol renderers', () => {
    expect(QUALITY_CLI_JSON_SCHEMA_REFERENCE).toBe(renderQualityCliReference());
    expect(QUALITY_ERROR_RECOVERY_GUIDE).toBe(renderQualityErrorRecovery());
    expect(renderQualityCliReference()).toContain('xirang quality opt');
    expect(renderQualityCliReference()).toContain('xirang quality seal');
    expect(renderQualityCliReference()).not.toContain('quality checkpoint');
  });

  it.each(Object.keys(commandSchemas) as Array<keyof typeof commandSchemas>)('renders runtime schema for %s', name => {
    const schema = renderedSchema(name);
    expect(schema).toEqual(z.toJSONSchema(commandSchemas[name], { io: 'input' }));
    expect(renderQualityCliReference()).toContain(renderQualityPayloadSchema(name));
  });

  it('uses runtime options and projects matching payload schemas into command help', async () => {
    for (const option of Object.values(qualityOptionMetadata)) expect(renderQualityOverview()).toContain(option.flags);
    for (const [command, help, schemaName] of [
      ['review', renderReviewHelp(), 'review'],
      ['opt', renderOptHelp(), 'opt'],
      ['seal', renderSealHelp(), 'seal'],
    ] as const) {
      const result = await runCLI(['quality', command, '--help']);
      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.stdout).toContain(renderQualityPayloadSchema(schemaName));
      expect(help).toContain(renderQualityPayloadSchema(schemaName));
    }
  });
});
