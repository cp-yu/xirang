export const SUBAGENT_QUALITY_EXECUTION_MODEL = 'subagent-orchestrated' as const;

export type QualityExecutionModel = typeof SUBAGENT_QUALITY_EXECUTION_MODEL;

/**
 * Skills-only workflow surface: every CLI workflow assumes subagent support.
 * The lookup is intentionally explicit — no tool lookup, pattern matching,
 * or fallback inference.
 */
export function resolveQualityExecutionModel(_toolId?: string): QualityExecutionModel {
  return SUBAGENT_QUALITY_EXECUTION_MODEL;
}
