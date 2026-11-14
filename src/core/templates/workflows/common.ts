import { artifactReferences } from '../fragments/artifact-references.js';
import { CONFIGURATION_USE_GUIDANCE } from '../fragments/configuration-use.js';
import { CONFIGURATION_EDIT_GUIDANCE } from '../fragments/configuration-edit.js';
import { BUSINESS_SPECIFICATION_STANDARD_REFERENCE } from '../fragments/business-specification-standard.js';
import { DESIGN_RECORD_REFERENCE } from './explore.js';
import type { SkillTemplate } from '../types.js';
import { getWorkflowSurfaces } from '../../workflow-surface.js';
import { COMMON_SKILL_NAME } from '../fragments/guidance-loading.js';
import {
  DECOMPOSITION_AUTHORING_REFERENCE,
  ELEMENT_CONTRACT_SEMANTICS,
  ELEMENT_DEFINITION_SEMANTICS,
  SEMANTIC_MODEL_EVOLUTION_GUIDANCE,
  SEMANTIC_MODEL_UNIT_NOTATION,
  SEMANTIC_REFINEMENT_REFERENCE,
  TEST_QUALITY_GUIDANCE,
  XIRANG_PHILOSOPHY,
  XIRANG_SHARED_CONTEXT,
} from '../fragments/xirang-fragments.js';

export function getCommonSkillTemplate(): SkillTemplate {
  const stages = getWorkflowSurfaces().map(entry =>
    `| ${entry.workflowId} | ${entry.skillName} | ${entry.promptMeta.description} |`
  ).join('\n');
  return {
    name: COMMON_SKILL_NAME,
    description: 'Shared Xirang foundation and entry point. Load before any Xirang stage; use natural-language intent to select and load a stage skill. Reuse current guidance across stages.',
    instructions: `Use this shared foundation before Xirang work. If a stage is already selected, return to that stage after filling missing guidance; do not dispatch it again. If you are a delegated internal Agent, retain your assigned role, permissions and scope and skip user-stage routing.

${XIRANG_PHILOSOPHY}

## Semantic foundation

Semantic objects are referenced only by identity. Paths, directories, syntax positions and derived names do not determine identity or hierarchy. Element Declaration and its at-most-one Contract jointly express the Element; the Kind declares whether its Contract is required. Current implementation is evidence, not authority to override confirmed intent or model semantics. Read the selected current semantic content when a decision needs it; do not guess from a name or an old summary.

## Stage entry

A user may load only this skill and then state a stage or working intent in natural language. Select the matching stage below and read that skill before stage work. For example, “探索一下这个需求” or “进入 Explore” selects xirang-explore. A request to form the agreed Change selects xirang-propose. If intent leaves a consequential stage choice unclear, clarify it rather than guessing implementation or closure authority.

| Stage | Skill | Purpose |
|---|---|---|
${stages}

Locate the skill using this tool's discovered skill location, or the explicit skill name as a sibling directory of this skill: ../<skill-name>/SKILL.md. Use the declared mapping; do not derive names from titles or invent tool command syntax. A missing required skill or reference is a concrete blocker; report it instead of proceeding without its guidance.

Users can also load a stage skill directly. That stage fills missing common guidance and continues its already selected stage. Do not loop between common and the stage, or require the user to invoke either skill again. Later natural-language requests may select another stage; load its missing guidance and retain all stage-specific preparation, confirmation, validation and authorization gates. Recognizing or loading a stage does not authorize skipping them or automatically advancing to another stage.

## Load and reuse

Load guidance on first applicable use, not every stage entry. In the same Agent and project, reuse complete guidance that remains available and current; stage changes alone do not invalidate it. After guidance changes, necessary context loss, a project switch or a new Agent context, obtain the needed guidance again. An old “already read” receipt without the needed content is insufficient. No persistent load ledger or cross-Agent shared-context assumption is required.

Static guidance reuse never replaces current Record, model, configuration, Git or Quality checks. Follow their applicable reload, revision and handoff gates. Keep each complete rule in its single skill or reference; consumers retain only triggers and necessary short reminders.

${CONFIGURATION_USE_GUIDANCE}

## On-demand guidance

All paths below are project-root files. Read only what the current action requires and reuse it while available and current; do not preload this table.

| Trigger | Reference |
|---|---|
| Navigate or interpret the Semantic Model | .xirang/references/xirang-model-context.md |
| Explore or write Element Definitions and Contracts | .xirang/references/xirang-semantic-authoring.md |
| Business-specification Kind or Contract with contractFormat: business-specification | .xirang/references/xirang-business-specification-standard.md |
| Form or reorganize a hierarchy | Follow the stage's resolved decomposition guidance |
| Create or revise project decomposition guidance | .xirang/references/xirang-decomposition-authoring.md |
| Write Candidate model units | .xirang/references/xirang-model-notation.md |
| Author a Change artifact or Delta | .xirang/references/xirang-artifact-<artifact-id>.md, Definition before Guidance and Template |
| Design verification, change tests, or judge test evidence | .xirang/references/xirang-test-quality.md |
| User requests a project configuration edit | .xirang/references/xirang-configuration-edit.md |
| Use or maintain a design record, or close its record decision | .xirang/references/xirang-design-record.md |
| Execute Quality operations, recover interrupted Quality work | .xirang/references/xirang-quality-cli.md; recovery only when applicable: .xirang/references/xirang-quality-recovery.md |

Stage-specific flow and gates remain in the selected skill and its references. Read them at their applicable steps. tasks.md carries goals, Contract references and verification directions; Apply chooses concrete implementation and test actions from current project evidence.`,
    referenceFiles: [
      ...artifactReferences(),
      { path: 'references/configuration-edit.md', content: CONFIGURATION_EDIT_GUIDANCE },
      { path: 'references/business-specification-standard.md', content: BUSINESS_SPECIFICATION_STANDARD_REFERENCE },
      { path: 'references/design-record.md', content: DESIGN_RECORD_REFERENCE },
      { path: 'references/semantic-refinement.md', content: SEMANTIC_REFINEMENT_REFERENCE },
      { path: 'references/model-context.md', content: XIRANG_SHARED_CONTEXT },
      { path: 'references/semantic-authoring.md', content: `${SEMANTIC_MODEL_EVOLUTION_GUIDANCE}\n\n${ELEMENT_DEFINITION_SEMANTICS}\n\n${ELEMENT_CONTRACT_SEMANTICS}` },
      { path: 'references/test-quality.md', content: TEST_QUALITY_GUIDANCE },
      { path: 'references/decomposition-authoring.md', content: DECOMPOSITION_AUTHORING_REFERENCE },
      { path: 'references/model-notation.md', content: SEMANTIC_MODEL_UNIT_NOTATION },
    ],
    license: 'MIT',
    compatibility: 'Requires Xirang CLI and the installed Xirang stage skills.',
    metadata: { author: 'xirang', version: '1.0' },
  };
}
