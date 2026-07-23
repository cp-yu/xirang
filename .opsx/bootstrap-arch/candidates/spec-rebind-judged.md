# Spec Rebind Judgements (agent-reviewed)

- Judged: **60** / expected **60**

## Counts

- `bind`: **50**
- `keep-coarse`: **2**
- `needs-new-cap`: **7**
- `split`: **1**

## Bind

| Spec | From (coarse) | To (fine) | Conf | Reason |
| --- | --- | --- | --- | --- |
| `ai-tool-paths` | `cap.ai.tool-integration` | `cap.ai.tool-adapters` | high | Purpose/requirements define AIToolOption skillsDir paths and skills-only generation metadata for AI tools; matches tool-adapters description (skills paths, transform, invocation guidance; no adapter-backed commands). |
| `apply-default-isolation-config` | `cap.config.project-settings` | `cap.config.apply-default-isolation` | high | Exact contract for materializing apply.defaultIsolation: ask in project config defaults and missing-only update migration; matches cap.config.apply-default-isolation. |
| `apply-implementer-subagent` | `cap.apply.execution` | `cap.apply.subagent-orchestration` | high | Records removal of opsx-implementer from apply Phase 0 and internal subagent list (reviewer/optimizer/sweeper only); fits subagent-orchestration role separation. |
| `arch-query-command` | `…/cli/cap.cli.architecture-navigation` | `cap.cli.arch-query` | high | Requirements define the opsx arch query CLI surface (elementId/FQN, --relations, --depth, --json), matching cap.cli.arch-query rather than the LikeC4 reader engine. |
| `architecture-delta-artifact` | `…/schema/cap.schema.workflow-definition` | `cap.schema.architecture-delta-artifact` | high | Requirements define architecture-delta.c4 artifact dialect, identity operations, and Spec bindings—the schema artifact contract, not delta merge/reconcile. |
| `archive-sync-workflow` | `cap.architecture.semantic-model` | `cap.change.specs-sync` | medium | Primary requirements: sync merges architecture-delta + Spec bindings into Target Semantic Model with joint validate/atomic write/rollback; archive only after sync, keeps consumed delta. Matches cap.change.specs-sync prepare/validate/commit/rollback of graph+Spec deltas better than coarse semantic-model. Archive-only side is secondary (cap.change.archive). |
| `archive-verify-gate` | `cap.change.lifecycle` | `cap.verify.freshness-engine` | medium | Archive blocked unless .verify-result.json FRESH + archive-compatible optimization end-state; freshness rules (evidenceFingerprint, contractVersion, result) and seal/HEAD nuance. Best fine owner is freshness-engine; execution-model-selection covers archive full-verify model only partially. |
| `artifact-file-definitions` | `cap.artifact-graph.workflow-compilation` | `cap.artifact-graph.file-definitions` | high | Structured FileDefinition semantics, boundaries, write policy, validation-readonly vs workflow writes; exact match for file-definitions capability. |
| `artifact-workflow-status` | `cap.artifact-graph.workflow-compilation` | `cap.cli.list` | medium | Sole requirement: opsx list --json adds per-change verifyStatus (FRESH/STALE/MISSING) while preserving status. CLI list surface is the fine owner; state-tracking/freshness are dependencies not the contract owner. |
| `change-creation` | `cap.change.lifecycle` | `cap.change.create` | high | Programmatic createChange + kebab-case name validation for change directories; matches cap.change.create (not CLI-only new-change). |
| `cli-completion` | `…/cli/cap.cli.command-discovery` | `cap.cli.completion` | high | Requirements cover shell completion generate/install and native shell UX for opsx completion, owned by cap.cli.completion; introspect is only the reflection helper. |
| `cli-config` | `…/cli/cap.cli.project-setup` | `cap.cli.config` | high | Requirements define the full opsx config CLI (path/list/get/set/unset/reset/edit/project), matching cap.cli.config rather than the project-query sub-capability alone. |
| `cli-init` | `…/cli/cap.cli.project-setup` | `cap.cli.init` | high | Requirements define OPSX setup/init skeleton and workflow install; cap.cli.init is the active surface, while init-opsx-skeleton is deprecated compatibility. |
| `compilation-philosophy-fragment` | `cap.ai.workflow-generation` | `cap.ai.skill-generation` | low | No cap.ai.workflow-generation in ai-integration.c4. Spec is OPSX_PHILOSOPHY fragment injected into six workflow skill templates plus reviewer/optimizer subagent prompts; closest fine cap is cap.ai.skill-generation (workflow skill generation). cap.ai.template-artifact-pipeline is weaker (pipeline, not shared philosophy fragment). |
| `config-project-query` | `cap.cli.project-setup` | `cap.cli.config.project` | high | Spec is opsx config project query of NormalizedProjectConfig; cli.c4 defines cap.cli.config.project exactly for that CLI surface. project-setup is coarse/wrong. |
| `context-injection` | `cap.config.runtime-projection` | `cap.config.projection` | high | Requirements mandate context via shared config projection pipeline into instructions; config.c4 cap.config.projection is prompt/runtime projections from config.yaml. No runtime-projection id. |
| `global-config` | `cap.config.global-contract` | `cap.config.global` | high | User-level ~/.config/opsx/config.json load/save/XDG paths maps to cap.config.global in config.c4; global-contract id does not exist. |
| `graceful-status-empty` | `cap.cli.artifact-workflow` | `cap.cli.status` | high | Narrow statusCommand empty-changes exit behavior only; cap.cli.status is the fine Status capability. Not the multi-command artifact-workflow umbrella. |
| `init-project-structure` | `cap.cli.project-setup` | `cap.cli.init` | high | opsx setup/init creates LikeC4 architecture skeleton, Project Root, metamodel, specs dir; matches cap.cli.init description. project-setup is coarse; cap.cli.init-opsx-skeleton is deprecated legacy YAML path. |
| `legacy-cleanup` | `cap.config.global-contract` | `cap.cli.update` | low | Legacy workspace/agent-surface detection and confirmed cleanup during setup/update is not global config. Among candidates, cap.cli.update owns refresh/update cleanup of stale artifacts/config; cap.config.migration is narrower (config field migration). Residual risk: init-path cleanup may also want cap.cli.init; no dedicated legacy-cleanup cap. |
| `opsx-apply-architecture-context` | `cap.ai.workflow-generation` | `cap.ai.workflow-templates` | medium | Spec is apply-skill guidance to load Project Root / arch query / element-owned Specs before coding; same umbrella as ai-workflow-templates which auto-maps to cap.ai.workflow-templates. No apply-domain fine cap owns Agent template prose. |
| `opsx-apply-skill` | `cap.apply.verification-integration` | `cap.apply.verify-integration` | high | Defines /opsx:apply consuming .verify-result.json, remediation sections, and seal→archive CTA; matches cap.apply.verify-integration and the apply-verify-integration auto-map rename (verification-integration → verify-integration). |
| `opsx-archive-skill` | `cap.change.lifecycle` | `cap.change.archive` | high | /opsx:archive skill: readiness, artifact/task gates, archive-time verify reuse, inline delta sync, move to archive/. Best fine owner is cap.change.archive (not branch-merge or specs-sync alone). |
| `opsx-framework-identity` | `…/framework/cap.framework.identity` | `cap.framework.identity` | high | Requirements define single opsx CLI identity and .opsx durable workspace contract, matching cap.framework.identity; workflow-templates is unrelated. |
| `opsx-impact-sweeper-architecture` | `cap.architecture.semantic-model` | `cap.ai.impact-sweeper` | high | Contract is how Impact sweeper navigates model via opsx arch query, elementId identity, and Spec binding—not metamodel/validator/delta-merger. Aligns with ai-impact-sweeper → cap.ai.impact-sweeper and cap.ai.impact-sweeper description. |
| `opsx-optimizer-skill` | `cap.ai.review-roles` | `cap.ai.optimizer-skill` | high | Direct Phase 2 optimizer skill contract (role hard constraints, input contract, principles, failedDirections); candidates define cap.ai.optimizer-skill with matching intent. |
| `opsx-propose-skill` | `cap.ai.workflow-generation` | `cap.ai.propose-smart-routing` | medium | Propose skill: architecture-delta authoring, relationship kinds, validate+diff gate for change artifacts. Closest fine cap is cap.ai.propose-smart-routing (propose readiness and change-artifact generation), not generic workflow-templates generation pipeline. |
| `opsx-reviewer-skill` | `cap.ai.review-roles` | `cap.ai.reviewer-skill` | high | Direct Phase 1 reviewer subagent skill contract; candidates define cap.ai.reviewer-skill with matching role. |
| `opsx-shared-context` | `cap.ai.workflow-generation` | `cap.ai.workflow-templates` | high | Unified Semantic Model loading fragment for explore/propose/apply/snack templates (Project Root, arch query, graceful degradation). Belongs with shared Agent workflow template content under cap.ai.workflow-templates. |
| `opsx-verify-skill` | `cap.verify.consistency-gate` | `cap.verify.prompt-orchestration` | high | spec.md is titled verify-prompt-orchestration: coordinator role, mode labels, subagent delegation. Matches verify.c4 Prompt Orchestration (cap.verify.prompt-orchestration), not missing consistency-gate or cli-gate. |
| `optimizer-finding-lifecycle` | `cap.verify.optimization-gate` | `cap.verify.optimizer-findings` | high | Finding JSON contract, CLI stable IDs, state machine, reconciliation history, single selected finding—verbatim align with cap.verify.optimizer-findings in verify.c4. |
| `profiles` | `cap.config.global-contract` | `cap.config.global` | low | No cap.* for deleted profiles. Closest existing fine cap is cap.config.global (global config no longer includes profile/workflows/delivery). Residual: pure negative-space contract may warrant need-new-cap under domain.config if judges require explicit absence owner. |
| `propose-workflow` | `cap.cli.artifact-workflow` | `cap.ai.propose-smart-routing` | high | cap.cli.artifact-workflow missing. Spec covers propose change artifacts, Design Summary reuse, semantic readiness/override—matches cap.ai.propose-smart-routing description; not a CLI-only surface. |
| `rules-injection` | `cap.config.runtime-projection` | `cap.config.projection` | high | Inject config rules into instructions with deterministic formatting maps to cap.config.projection (prompt/runtime projections; shared prose/canonical/rules semantic boundary). |
| `schema-validate-command` | `cap.schema.workflow-definition` | `cap.schema.validate` | medium | opsx schema validate of YAML/Zod/file defs/templates/DAG is domain schema validation—cap.schema.validate. Alternate fine CLI surface cap.cli.schema also mentions structure checks; domain validate is the finer semantic owner. |
| `schema-which-command` | `cap.cli.artifact-workflow` | `cap.cli.schema` | high | opsx schema which reports package location of built-in schemas; cap.cli.schema documents package location + structure for built-in schemas. cap.cli.schemas is list-only. |
| `semantic-delta-application` | `cap.change.semantic-delta` | `cap.architecture.delta-merger` | high | Active architecture-delta.c4 + Spec delta validate/merge/atomic formal apply matches cap.architecture.delta-merger. Reject cap.opsx.delta-merge (deprecated legacy opsx-delta.yaml). Not under domain.change_workflow caps. |
| `skill-frontmatter-yaml` | `cap.ai.workflow-generation` | `cap.ai.skill-generation` | medium | Legal YAML frontmatter for generated SKILL.md on init/update is part of skill product generation—cap.ai.skill-generation. workflow-generation does not exist; workflow-templates is coarser semantic wording. |
| `skill-template-length-check` | `cap.validation.semantic-contract` | `cap.validation.skill-template-length` | high | Spec requires getSkillTemplates SKILL.md ≤200 and referenceFiles ≤500 lines across tool variants; validation.c4 skill_template_length capability text matches exactly. |
| `snack-skill` | `…/ai_integration/cap.ai.snack-reconciliation` | `cap.ai.snack-skill` | high | Requirements define snack code-first reconcile behavior and evidence rules, matching cap.ai.snack-skill rather than skill-file generation. |
| `spec-pseudocode-support` | `cap.validation.semantic-contract` | `cap.validation.spec` | low | No dedicated pseudocode capability exists; closest fine cap is cap.validation.spec (spec format/content validation). Pseudocode is authoring format of Specs, not change/architecture validation. Residual: cap text emphasizes scenario operation labels more than pseudocode. |
| `specs-sync-skill` | `cap.change.lifecycle` | `cap.change.specs-sync` | high | Archive-time ADDED/MODIFIED/REMOVED reconciliation into formal specs and architecture delta sync maps to change-workflow.c4 specs_sync (Semantic Delta prepare/validate/commit). |
| `tdd-apply-checkpoints` | `cap.apply.execution` | `cap.apply.tdd-checkpoints` | high | Three Phase-0 TDD checkpoints (interface testability, test quality, mock boundaries) match apply.c4 tdd_checkpoints capability description. |
| `tdd-optimizer-smells` | `cap.ai.review-roles` | `cap.optimizer.tdd-smells` | high | Optimizer Phase-2 non-exhaustive smell/candidate signals without forced findings match ai-integration.c4 tdd_smells (cap.optimizer.tdd-smells). |
| `validate-change` | `cap.validation.semantic-contract` | `cap.validation.change` | high | Joint immutable formal + change-local specs + architecture-delta.c4 target model validation matches validation.c4 change capability. |
| `validate-opsx-dry-run` | `cap.validation.semantic-contract` | `cap.validation.opsx-dry-run` | low | Folder name and batch hint target cap.validation.opsx-dry-run. Spec body describes architecture-delta dry-run staged validation (closer in substance to cap.validation.change). Cap description still says deprecated legacy opsx-delta.yaml APIs—name-aligned rebind with content mismatch risk. |
| `validate-spec-section-type-cross-check` | `cap.validation.semantic-contract` | `cap.validation.spec-section-type-cross-check` | high | validateChangeDeltaSpecs ADDED/MODIFIED/REMOVED header cross-check vs formal specs is exactly validation.c4 spec_section_type_cross_check. |
| `verify-aware-apply-instructions` | `cap.cli.artifact-workflow` | `cap.cli.verify-aware-instructions` | high | opsx instructions apply states needs_verify/needs_seal/all_done via verify freshness match cli.c4 verify_aware_instructions. |
| `verify-optimization` | `cap.verify.optimization-gate` | `cap.verify.optimize` | high | Phase-2 forced optimizer, checkpoints/rollback, optRetries per finding direction match verify.c4 optimize capability; no cap.verify.optimization-gate in candidate set. |
| `verify-skill-reference-files` | `cap.apply.verification-integration` | `cap.apply.verify-integration` | high | Phase-2 checkpoint/rollback ownership in Apply references vs reviewer-only verdict aligns with apply.c4 verify_integration (Phase 1/2/3 + optimizer/reviewer roles). Stays in apply domain rather than generic workflow templates. |

## Needs new capability

| Spec | From (coarse) | To (fine) | Conf | Reason |
| --- | --- | --- | --- | --- |
| `apply-change-workflow` | `cap.apply.verification-integration` | `—` | medium | Owns full opsx-apply-change skill: Phase 0 Master TDD, no implementer/.apply-steps, and needs_verify/needs_seal branching. Fine caps split this (task-decomposition vs verify-integration vs workflow-templates); no single fine owner. Suggest to: cap.apply.change-workflow. |
| `arch-plan-remove-command` | `cap.cli.architecture-navigation` | `—` | medium | Defines opsx arch plan-remove (readonly removal impact, change-aware Handled/Unresolved, text/JSON). Candidates only have arch-query/validate/preview/export—no plan-remove. Suggest to: cap.cli.arch-plan-remove. |
| `cli-artifact-workflow` | `cap.cli.artifact-workflow` | `—` | medium | Spec covers multi-surface artifact workflow (status/instructions/templates/setup). Candidates have fine caps cap.cli.status, cap.cli.instructions, cap.cli.templates but no umbrella cap.cli.artifact-workflow; binding to one surface would orphan the rest. |
| `cli-candidate` | `cap.cli.candidate` | `—` | high | opsx candidate init/status/validate/promote workspace lifecycle; no cap.cli.candidate (or any candidate*) elementId in domains/*.c4; historical pre-candidate CLI model. |
| `cli-diff` | `cap.cli.change-operations` | `—` | high | Dedicated opsx diff semantic Formal↔Target command and effective-change.md writeback; candidates have cap.cli.change but no cap.cli.diff/change-operations; change cap is create/list/ops, not semantic diff IR. |
| `opsx-build` | `cap.architecture.bootstrap` | `—` | medium | Project Build (candidate authoring, build.md, validate/promote) is formal identity architecture.bootstrap, but candidates only offer deprecated cap.opsx.bootstrap (legacy scan/map/promote) plus architecture.likec4-reader/semantic-validator/delta-merger/metamodel—none describe Agent-driven Project Build. Do not map to cap.opsx.bootstrap. |
| `opsx-conventions` | `cap.ai.workflow-generation` | `—` | medium | Meta Element Contract / authoring conventions (structured Requirements/Scenarios, behavior-first boundary, progressive rigor, CLI naming)—not a single skill, template pipeline, or metamodel kind. No fine cap in candidates owns project-wide authoring policy; workflow-templates would over-narrow. |

## Keep coarse / project root

| Spec | From (coarse) | To (fine) | Conf | Reason |
| --- | --- | --- | --- | --- |
| `artifact-graph` | `…/artifact_graph/cap.artifact-graph.workflow-compilation` | `—` | medium | Spec spans schema load/DAG parse, build order, and filesystem state detection; no single fine cap (parse, state-tracking, etc.) owns the full contract. |
| `project-contract` | `project.root` | `project.root` | high | Root project intent/scope/invariants/workspace contract; already bound to project.root per candidates/project.c4; keep. |

## Split

| Spec | From (coarse) | To (fine) | Conf | Reason |
| --- | --- | --- | --- | --- |
| `spec-content-browser` | `…/presentation/cap.presentation.semantic-browser` | `—` | medium | Requirements jointly own Specs-tab panel UX and registry-authorized Spec file reads; split so panel binds to cap.presentation.spec-content-panel and gateway security to cap.presentation.spec-content-gateway. |

## Suggested new capabilities

- `apply-change-workflow`: Owns full opsx-apply-change skill: Phase 0 Master TDD, no implementer/.apply-steps, and needs_verify/needs_seal branching. Fine caps split this (task-decomposition vs verify-integr
- `arch-plan-remove-command`: Defines opsx arch plan-remove (readonly removal impact, change-aware Handled/Unresolved, text/JSON). Candidates only have arch-query/validate/preview/export—no plan-remove. Suggest
- `cli-artifact-workflow`: Spec covers multi-surface artifact workflow (status/instructions/templates/setup). Candidates have fine caps cap.cli.status, cap.cli.instructions, cap.cli.templates but no umbrella
- `cli-candidate`: opsx candidate init/status/validate/promote workspace lifecycle; no cap.cli.candidate (or any candidate*) elementId in domains/*.c4; historical pre-candidate CLI model.
- `cli-diff`: Dedicated opsx diff semantic Formal↔Target command and effective-change.md writeback; candidates have cap.cli.change but no cap.cli.diff/change-operations; change cap is create/lis
- `opsx-build`: Project Build (candidate authoring, build.md, validate/promote) is formal identity architecture.bootstrap, but candidates only offer deprecated cap.opsx.bootstrap (legacy scan/map/
- `opsx-conventions`: Meta Element Contract / authoring conventions (structured Requirements/Scenarios, behavior-first boundary, progressive rigor, CLI naming)—not a single skill, template pipeline, or 

