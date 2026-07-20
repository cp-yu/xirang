/**
 * Agent Skill Templates
 *
 * Compatibility facade that re-exports split workflow template modules.
 */

export type { SkillTemplate } from './types.js';

export { getExploreSkillTemplate } from './workflows/explore.js';
export { getApplyChangeSkillTemplate } from './workflows/apply-change.js';
export { getArchiveChangeSkillTemplate } from './workflows/archive-change.js';
export { getOpsxProposeSkillTemplate } from './workflows/propose.js';
export { getBootstrapArchSkillTemplate } from './workflows/bootstrap-arch.js';
export { getSnackSkillTemplate } from './workflows/snack.js';
export { getFeedbackSkillTemplate } from './workflows/feedback.js';
