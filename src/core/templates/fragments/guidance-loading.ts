export const COMMON_SKILL_NAME = 'xirang-common';

export const COMMON_PREREQUISITE = `Before doing stage work, load the ${COMMON_SKILL_NAME} skill from this tool's discovered skills or from ../${COMMON_SKILL_NAME}/SKILL.md relative to this skill file, unless its required guidance is already available and current in this Agent's project context. Keep the selected stage while loading it; do not route back or load this stage again. Follow common's on-demand guidance and reuse rules.`;

export const INTERNAL_COMMON_PREREQUISITE = `In your own context, load the ${COMMON_SKILL_NAME} skill from this tool's discovered skills, or from ../skills/${COMMON_SKILL_NAME}/SKILL.md relative to this generated agent file. The main Agent's load does not satisfy your context. Keep your delegated role and scope; do not select or enter a user workflow. Reuse guidance only while available and current.`;

export const MODEL_CONTEXT_ENTRY = 'Before navigating or interpreting the Semantic Model, read project-root file `.xirang/references/xirang-model-context.md` unless already available and current.';
export const SEMANTIC_AUTHORING_ENTRY = 'Before exploring or writing an Element Declaration or Contract, read project-root file `.xirang/references/xirang-semantic-authoring.md` unless already available and current.';
export const TEST_QUALITY_ENTRY = 'When designing verification, changing tests or reviewing test evidence, read project-root file `.xirang/references/xirang-test-quality.md` unless already available and current.';
export const DECOMPOSITION_ENTRY = 'Only before forming or reorganizing a hierarchy, read project-root file `.xirang/references/xirang-decomposition-use.md` unless already available and current; then follow its normalized configuration routing. Contract-only work does not trigger it.';
export const MODEL_NOTATION_ENTRY = 'Before writing Candidate model units, read project-root file `.xirang/references/xirang-model-notation.md` unless already available and current.';
export const DELTA_NOTATION_ENTRY = 'Before writing Semantic Delta units, read project-root file `.xirang/references/xirang-artifact-specs.md` (Definition, Guidance, Template) unless already available and current.';
