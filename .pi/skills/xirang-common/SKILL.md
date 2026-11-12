---
name: "xirang-common"
description: "Shared Xirang foundation and entry point. Load before any Xirang stage; use natural-language intent to select and load a stage skill. Reuse current guidance across stages."
license: "MIT"
compatibility: "Requires Xirang CLI and the installed Xirang stage skills."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.8"
---

Use this shared foundation before Xirang work. If a stage is already selected, return to that stage after filling missing guidance; do not dispatch it again. If you are a delegated internal Agent, retain your assigned role, permissions and scope and skip user-stage routing.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

## Semantic foundation

Semantic objects are referenced only by identity. Paths, directories, syntax positions and derived names do not determine identity or hierarchy. Element Declaration and its at-most-one Contract jointly express the Element; the Kind declares whether its Contract is required. Current implementation is evidence, not authority to override confirmed intent or model semantics. Read the selected current semantic content when a decision needs it; do not guess from a name or an old summary.

## Stage entry

A user may load only this skill and then state a stage or working intent in natural language. Select the matching stage below and read that skill before stage work. For example, “探索一下这个需求” or “进入 Explore” selects xirang-explore. A request to form the agreed Change selects xirang-propose. If intent leaves a consequential stage choice unclear, clarify it rather than guessing implementation or closure authority.

| Stage | Skill | Purpose |
|---|---|---|
| propose | xirang-propose | Create proposal, design, and tasks from a request |
| explore | xirang-explore | Investigate a problem before implementation |
| apply | xirang-apply-change | Implement tasks from the current change |
| archive | xirang-archive-change | Finalize and archive a completed change |
| build | xirang-build | Build or rebuild one reviewed Architecture and Specs Candidate |
| snack | xirang-snack | Quick sync from code to specs |

Locate the skill using this tool's discovered skill location, or the explicit skill name as a sibling directory of this skill: ../<skill-name>/SKILL.md. Use the declared mapping; do not derive names from titles or invent tool command syntax. A missing required skill or reference is a concrete blocker; report it instead of proceeding without its guidance.

Users can also load a stage skill directly. That stage fills missing common guidance and continues its already selected stage. Do not loop between common and the stage, or require the user to invoke either skill again. Later natural-language requests may select another stage; load its missing guidance and retain all stage-specific preparation, confirmation, validation and authorization gates. Recognizing or loading a stage does not authorize skipping them or automatically advancing to another stage.

## Load and reuse

Load guidance on first applicable use, not every stage entry. In the same Agent and project, reuse complete guidance that remains available and current; stage changes alone do not invalidate it. After guidance changes, necessary context loss, a project switch or a new Agent context, obtain the needed guidance again. An old “already read” receipt without the needed content is insufficient. No persistent load ledger or cross-Agent shared-context assumption is required.

Static guidance reuse never replaces current Record, model, configuration, Git or Quality checks. Follow their applicable reload, revision and handoff gates. Keep each complete rule in its single skill or reference; consumers retain only triggers and necessary short reminders.

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
| Author artifacts or consume project configuration | .xirang/references/xirang-configuration-use.md |
| Use or maintain a design record, or close its record decision | .xirang/references/xirang-design-record.md |
| Execute Quality operations, recover interrupted Quality work | .xirang/references/xirang-quality-cli.md; recovery only when applicable: .xirang/references/xirang-quality-recovery.md |

Stage-specific flow and gates remain in the selected skill and its references. Read them at their applicable steps. tasks.md carries goals, Contract references and verification directions; Apply chooses concrete implementation and test actions from current project evidence.
