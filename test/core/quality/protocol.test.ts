import { describe, expect, it } from 'vitest';
import {
  renderOptimizeHelp,
  renderQualityCliReference,
  renderQualityCheckpointStateMachine,
  renderQualityErrorRecovery,
  renderQualityFastPath,
  renderQualityStateDiagram,
  renderReviewHelp,
} from '../../../src/core/quality/protocol.js';
import {
  QUALITY_CLI_JSON_SCHEMA_REFERENCE,
  QUALITY_ERROR_RECOVERY_GUIDE,
  QUALITY_SIMPLE_CHANGE_FAST_PATH,
  QUALITY_STATE_MACHINE_DIAGRAM,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import {
  DIRECTION_LEVEL_VALUES,
  DIRECTION_STATUS_VALUES,
  REVIEW_RESULT_VALUES,
  STOP_REASON_VALUES,
} from '../../../src/core/quality/validators.js';

describe('quality protocol projection', () => {
  it('derives every reference fragment from the shared protocol renderers', () => {
    expect(QUALITY_STATE_MACHINE_DIAGRAM).toBe(renderQualityStateDiagram());
    expect(QUALITY_CLI_JSON_SCHEMA_REFERENCE).toBe(renderQualityCliReference());
    expect(QUALITY_ERROR_RECOVERY_GUIDE).toBe(renderQualityErrorRecovery());
    expect(QUALITY_SIMPLE_CHANGE_FAST_PATH).toBe(renderQualityFastPath());
  });

  it('projects the same validator constants into help and reference output', () => {
    const help = [renderReviewHelp(), renderOptimizeHelp()].join('\n');
    const reference = [renderQualityCliReference(), renderQualityErrorRecovery()].join('\n');

    for (const value of [...REVIEW_RESULT_VALUES, ...STOP_REASON_VALUES, ...DIRECTION_STATUS_VALUES, ...DIRECTION_LEVEL_VALUES]) {
      expect(help, `help is missing ${value}`).toContain(value);
      expect(reference, `reference is missing ${value}`).toContain(value);
    }
  });

  it('pairs every documented finalize payload with a summary', () => {
    const surfaces = [
      renderOptimizeHelp(),
      renderQualityCliReference(),
      renderQualityErrorRecovery(),
      renderQualityFastPath(),
    ];

    for (const surface of surfaces) {
      for (const line of surface.split('\n')) {
        if (!line.includes('"stopReason":"')) {
          continue;
        }
        expect(line, `finalize payload without summary: ${line}`).toContain('"summary"');
      }
    }
  });

  it('documents the rollback record set for every record file', () => {
    const surfaces = [renderQualityErrorRecovery(), renderQualityCheckpointStateMachine()].join('\n');

    for (const file of ['.quality-state.json', '.quality-log.jsonl', '.apply-isolation.json']) {
      expect(surfaces).toContain(file);
    }
  });

  it('keeps the help payload field list limited to agent-authored fields', () => {
    for (const field of ['"result"', '"issues"', '"evidenceFiles"', '"directions"', '"stopReason"', '"summary"']) {
      expect(renderReviewHelp() + renderOptimizeHelp()).toContain(field);
    }
    for (const field of ['"verificationContext"', '"tasksFileHash"', '"histories"', '"directionsUsed"']) {
      expect(renderReviewHelp() + renderOptimizeHelp()).not.toContain(field);
    }
  });
});
