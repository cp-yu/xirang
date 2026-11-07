export const SUBAGENT_QUALITY_EXECUTION_MODEL = 'subagent-orchestrated' as const;

export type QualityExecutionModel = typeof SUBAGENT_QUALITY_EXECUTION_MODEL;

/**
 * Skills-only workflows use subagents: writable Opt executes delegated work,
 * Reviewer independently assesses assigned quality dimensions, and main owns
 * final verification. This selects orchestration, never a provider or model.
 */
export function resolveQualityExecutionModel(_toolId?: string): QualityExecutionModel {
  return SUBAGENT_QUALITY_EXECUTION_MODEL;
}
