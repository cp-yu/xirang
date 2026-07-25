# Architecture Bootstrap Review — detailed domains/*.c4

## Phase Status

- **init**: complete
- **scan**: complete (formal Specs + code + historical `a17f5f5964ae` domains layout)
- **map**: complete — detailed multi-file candidate
- **review**: awaiting explicit promote approval
- **promote**: blocked

## Target Layout

```
.xirang/architecture/
  specification.c4
  project.c4
  domains/*.c4
  relations.c4
  views.c4
```

Candidates live at `.xirang/bootstrap-arch/candidates/` (outside formal workspace).

## Source of Detail

- Historical commit `a17f5f5964ae`: 14 domains / 123 capabilities / ~87 relations
- Candidate adds `quality` + `telemetry` from current formal (code evidence)
- **Candidate totals: 16 domains / 125 capabilities**
- v1 adaptations: `xirang { languageVersion '1' }`, nested under `project_root`, stable `elementId` (from historical `capabilityId`), **no** `capabilityId`/`metadata.specs`/`belongs_to`

## Domains

### `ai-integration.c4` — Ai Integration (24 caps)
- elementId: `project.root/domain.ai_integration`
  - `cap.ai.agent-prompt-guidance` — Agent Prompt Guidance [active]
  - `cap.ai.command-generation` — Command Generation [active]
  - `cap.ai.command-slugs` — Command Slugs [active]
  - `cap.ai.explore-brainstorming` — Explore Brainstorming [active]
  - `cap.ai.explore-terminology-decision` — Explore Terminology Decision [active]
  - `cap.ai.impact-sweeper` — Impact Sweeper [active]
  - `cap.ai.internal-subagent-generation` — Internal Subagent Generation [active]
  - `cap.ai.optimizer-skill` — Optimizer Skill [active]
  - `cap.ai.propose-smart-routing` — Propose Smart Routing [active]
  - `cap.ai.references-home` — References Home [active]
  - `cap.ai.reviewer-cleanliness-dimension` — Reviewer Cleanliness Dimension [active]
  - `cap.ai.reviewer-skill` — Reviewer Skill [active]
  - `cap.ai.skill-generation` — Skill Generation [active]
  - `cap.ai.snack-skill` — Snack Skill [active]
  - `cap.ai.snack-skill-generation` — Snack Skill Generation [active]
  - `cap.ai.snack-workflow-manifest` — Snack Workflow Manifest [active]
  - `cap.ai.sweeper-terminology-extraction` — Sweeper Terminology Extraction [active]
  - `cap.ai.sweeper-terminology-reporting` — Sweeper Terminology Reporting [active]
  - `cap.ai.template-artifact-pipeline` — Template Artifact Pipeline [active]
  - `cap.ai.tool-adapters` — Tool Adapters [active]
  - `cap.ai.tool-invocation-references` — Tool Invocation References [active]
  - `cap.ai.verify-writeback` — Verify Writeback [active]
  - `cap.ai.workflow-templates` — Workflow Templates [active]
  - `cap.optimizer.tdd-smells` — Tdd Smells [active]

### `apply.c4` — Apply (7 caps)
- elementId: `project.root/domain.apply`
  - `cap.apply.branch-isolation` — Branch Isolation [active]
  - `cap.apply.preflight-scan` — Preflight Scan [active]
  - `cap.apply.recovery-protocol-enhanced` — Recovery Protocol Enhanced [active]
  - `cap.apply.subagent-orchestration` — Subagent Orchestration [active]
  - `cap.apply.task-decomposition` — Task Decomposition [active]
  - `cap.apply.tdd-checkpoints` — Tdd Checkpoints [active]
  - `cap.apply.verify-integration` — Verify Integration [active]

### `architecture.c4` — Architecture (4 caps)
- elementId: `project.root/domain.architecture`
  - `cap.architecture.likec4-reader` — LikeC4 Reader [active]
  - `cap.architecture.semantic-validator` — Semantic Validator [active]
  - `cap.architecture.delta-merger` — Architecture Delta Merger [active]
  - `cap.architecture.metamodel` — Semantic Metamodel [active]

### `artifact-graph.c4` — Artifact Graph (5 caps)
- elementId: `project.root/domain.artifact_graph`
  - `cap.artifact-graph.instruction-loader` — Instruction Loader [active]
  - `cap.artifact-graph.parse` — Parse [active]
  - `cap.artifact-graph.schema-resolution` — Schema Resolution [active]
  - `cap.artifact-graph.state-tracking` — State Tracking [active]
  - `cap.artifact-graph.file-definitions` — File Definitions [active]

### `change-workflow.c4` — Change Workflow (6 caps)
- elementId: `project.root/domain.change_workflow`
  - `cap.archive.branch-merge` — Branch Merge [active]
  - `cap.change.archive` — Archive [active]
  - `cap.change.create` — Create [active]
  - `cap.change.discovery` — Discovery [active]
  - `cap.change.metadata` — Metadata Element [active]
  - `cap.change.specs-sync` — Specs Sync [active]

### `cli.c4` — Cli (31 caps)
- elementId: `project.root/domain.cli`
  - `cap.cli.archive` — Archive [active]
  - `cap.cli.authoring-help` — Authoring Help [active]
  - `cap.cli.change` — Change [active]
  - `cap.cli.command-reference-consistency` — Command Reference Consistency [active]
  - `cap.cli.completion` — Completion [active]
  - `cap.cli.completion-introspect` — Completion Introspect [active]
  - `cap.cli.config` — Config [active]
  - `cap.cli.config.project` — Project Element [active]
  - `cap.cli.feedback` — Feedback [active]
  - `cap.cli.init` — Init [active]
  - `cap.cli.init-opsx-skeleton` — Init Opsx Skeleton [deprecated]
  - `cap.cli.instructions` — Instructions [active]
  - `cap.cli.list` — List [active]
  - `cap.cli.new-change` — New Change [active]
  - `cap.cli.opsx-query` — Opsx Query [deprecated]
  - `cap.cli.scenario-labels` — Scenario Labels [active]
  - `cap.cli.schema` — Schema [active]
  - `cap.cli.schemas` — Schemas [active]
  - `cap.cli.show` — Show [active]
  - `cap.cli.spec` — Spec [active]
  - `cap.cli.status` — Status [active]
  - `cap.cli.sync` — Sync [active]
  - `cap.cli.templates` — Templates [active]
  - `cap.cli.update` — Update [active]
  - `cap.cli.validate` — Validate [active]
  - `cap.cli.verify-aware-instructions` — Verify Aware Instructions [active]
  - `cap.cli.view` — View Element [active]
  - `cap.cli.arch-query` — Architecture Query [active]
  - `cap.cli.arch-validate` — Architecture Validate [active]
  - `cap.cli.arch-preview` — Architecture Preview [deprecated]
  - `cap.cli.arch-export` — Architecture Export [active]

### `config.c4` — Config (7 caps)
- elementId: `project.root/domain.config`
  - `cap.config.apply-default-isolation` — Apply Default Isolation [active]
  - `cap.config.apply-projection` — Apply Projection [active]
  - `cap.config.global` — Global Element [active]
  - `cap.config.migration` — Migration Element [active]
  - `cap.config.project` — Project Element [active]
  - `cap.config.projection` — Projection Element [active]
  - `cap.config.schema-validation` — Schema Validation [active]

### `framework.c4` — Framework (1 caps)
- elementId: `project.root/domain.framework`
  - `cap.framework.identity` — Framework Identity [active]

### `migration.c4` — Migration (5 caps)
- elementId: `project.root/domain.migration`
  - `cap.migration.opsx-to-likec4-converter` — OPSX to LikeC4 Converter [active]
  - `cap.migration.likec4-file-generator` — LikeC4 File Generator [active]
  - `cap.migration.spec-path-inference` — Spec Path Inference [active]
  - `cap.migration.agent-verification-workflow` — Agent Verification Workflow [active]
  - `cap.migration.semantic-model-migrator` — Semantic Model Migrator [active]

### `opsx-element.c4` — Opsx Element (9 caps)
- elementId: `project.root/domain.opsx_element`
  - `cap.xirang.atomic-write` — Atomic Write [deprecated]
  - `cap.xirang.bootstrap` — Bootstrap [deprecated]
  - `cap.xirang.bootstrap-backfill-specs` — Bootstrap Backfill Specs [deprecated]
  - `cap.xirang.bootstrap-refresh` — Bootstrap Refresh [deprecated]
  - `cap.xirang.delta-merge` — Delta Merge [deprecated]
  - `cap.xirang.read-transparent` — Read Transparent [deprecated]
  - `cap.xirang.referential-integrity` — Referential Integrity [deprecated]
  - `cap.xirang.semantic-relations` — Semantic Relations [deprecated]
  - `cap.xirang.yaml-operations` — Yaml Operations [deprecated]

### `presentation.c4` — Presentation (3 caps)
- elementId: `project.root/domain.presentation`
  - `cap.presentation.likec4-engine` — LikeC4 Engine [active]
  - `cap.presentation.spec-content-gateway` — Spec Content Gateway [active]
  - `cap.presentation.spec-content-panel` — Spec Content Panel [active]

### `schema.c4` — Schema (4 caps)
- elementId: `project.root/domain.schema`
  - `cap.schema.opsx-delta-artifact` — Opsx Delta Artifact [deprecated]
  - `cap.schema.architecture-delta-artifact` — Architecture Delta Artifact [active]
  - `cap.schema.parse` — Parse [active]
  - `cap.schema.validate` — Validate [active]

### `validation.c4` — Validation (8 caps)
- elementId: `project.root/domain.validation`
  - `cap.spec.frontmatter` — Frontmatter [active]
  - `cap.spec.registry` — Registry [active]
  - `cap.validation.change` — Change [active]
  - `cap.validation.xirang` — Opsx Element [deprecated]
  - `cap.validation.opsx-dry-run` — Opsx Dry Run [deprecated]
  - `cap.validation.skill-template-length` — Skill Template Length [active]
  - `cap.validation.spec` — Spec [active]
  - `cap.validation.spec-section-type-cross-check` — Spec Section Type Cross Check [active]

### `verify.c4` — Verify (9 caps)
- elementId: `project.root/domain.verify`
  - `cap.ai.subagent-self-read` — Subagent Self Read [active]
  - `cap.sync.evidence-refresh` — Evidence Refresh [active]
  - `cap.verify.cli-gate` — Cli Gate [active]
  - `cap.verify.enforce-optimizer-invocation` — Enforce Optimizer Invocation [active]
  - `cap.verify.execution-model-selection` — Execution Model Selection [active]
  - `cap.verify.freshness-engine` — Freshness Engine [active]
  - `cap.verify.optimize` — Optimize [active]
  - `cap.verify.optimizer-findings` — Optimizer Findings [active]
  - `cap.verify.prompt-orchestration` — Prompt Orchestration [active]

### `quality.c4` — Delivery Assurance (1 caps)
- elementId: `project.root/domain.quality`
  - `cap.quality.ci-nix-validation` — Nix and Cross-Platform Delivery [active]

### `telemetry.c4` — Privacy Telemetry (1 caps)
- elementId: `project.root/domain.telemetry`
  - `cap.telemetry.anonymous-usage` — Anonymous Command Telemetry [active]

## Spec Rebinding (required on promote)

Current formal Specs bind to **coarse** umbrella elementIds (32 caps).
Detailed candidate uses **fine** elementIds (`cap.*`).
Promote of architecture alone would leave Specs pointing at removed umbrellas.

- Auto rebind candidates: 55
- Ambiguous: 9
- Unmatched (stay coarse or need human): 51

### Auto map (spec folder → fine elementId)

- `agent-prompt-guidance`: `project.root/domain.ai_integration/cap.ai.review-roles` → `cap.ai.agent-prompt-guidance`
- `ai-impact-sweeper`: `project.root/domain.ai_integration/cap.ai.intent-exploration` → `cap.ai.impact-sweeper`
- `ai-workflow-templates`: `project.root/domain.ai_integration/cap.ai.workflow-generation` → `cap.ai.workflow-templates`
- `apply-branch-isolation`: `project.root/domain.apply/cap.apply.isolation` → `cap.apply.branch-isolation`
- `apply-preflight-scan`: `project.root/domain.apply/cap.apply.execution` → `cap.apply.preflight-scan`
- `apply-recovery-protocol-enhanced`: `project.root/domain.apply/cap.apply.execution` → `cap.apply.recovery-protocol-enhanced`
- `apply-task-decomposition`: `project.root/domain.apply/cap.apply.execution` → `cap.apply.task-decomposition`
- `apply-verify-integration`: `project.root/domain.apply/cap.apply.verification-integration` → `cap.apply.verify-integration`
- `arch-export-command`: `project.root/domain.cli/cap.cli.architecture-navigation` → `cap.cli.arch-export`
- `arch-validate-command`: `project.root/domain.cli/cap.cli.architecture-navigation` → `cap.cli.arch-validate`
- `ci-nix-validation`: `project.root/domain.quality/cap.quality.ci-nix-validation` → `cap.quality.ci-nix-validation`
- `cli-archive`: `project.root/domain.cli/cap.cli.change-operations` → `cap.cli.archive`
- `cli-authoring-help`: `project.root/domain.cli/cap.cli.artifact-workflow` → `cap.cli.authoring-help`
- `cli-change`: `project.root/domain.cli/cap.cli.change-operations` → `cap.cli.change`
- `cli-command-reference-consistency`: `project.root/domain.cli/cap.cli.command-discovery` → `cap.cli.command-reference-consistency`
- `cli-completion-introspect`: `project.root/domain.cli/cap.cli.command-discovery` → `cap.cli.completion-introspect`
- `cli-feedback`: `project.root/domain.cli/cap.cli.feedback` → `cap.cli.feedback`
- `cli-list`: `project.root/domain.cli/cap.cli.artifact-workflow` → `cap.cli.list`
- `cli-show`: `project.root/domain.cli/cap.cli.change-operations` → `cap.cli.show`
- `cli-spec`: `project.root/domain.cli/cap.cli.change-operations` → `cap.cli.spec`
- `cli-sync`: `project.root/domain.cli/cap.cli.change-operations` → `cap.cli.sync`
- `cli-update`: `project.root/domain.cli/cap.cli.project-setup` → `cap.cli.update`
- `cli-validate`: `project.root/domain.cli/cap.cli.change-operations` → `cap.cli.validate`
- `cli-view`: `project.root/domain.cli/cap.cli.architecture-navigation` → `cap.cli.view`
- `config-apply-projection`: `project.root/domain.config/cap.config.runtime-projection` → `cap.config.apply-projection`
- `config-loading`: `project.root/domain.config/cap.config.project-settings` → `cap.config.project`
- `config-projection`: `project.root/domain.config/cap.config.runtime-projection` → `cap.config.projection`
- `enforce-optimizer-invocation`: `project.root/domain.verify/cap.verify.optimization-gate` → `cap.verify.enforce-optimizer-invocation`
- `explore-brainstorming`: `project.root/domain.ai_integration/cap.ai.intent-exploration` → `cap.ai.explore-brainstorming`
- `explore-terminology-decision`: `project.root/domain.ai_integration/cap.ai.intent-exploration` → `cap.ai.explore-terminology-decision`
- `init-opsx-skeleton`: `project.root/domain.cli/cap.cli.project-setup` → `cap.cli.init-opsx-skeleton`
- `instruction-loader`: `project.root/domain.artifact_graph/cap.artifact-graph.workflow-compilation` → `cap.artifact-graph.instruction-loader`
- `internal-subagent-generation`: `project.root/domain.ai_integration/cap.ai.subagent-generation` → `cap.ai.internal-subagent-generation`
- `likec4-semantic-validator`: `project.root/domain.architecture/cap.architecture.semantic-model` → `cap.architecture.semantic-validator`
- `opsx-semantic-model`: `project.root/domain.architecture/cap.architecture.semantic-model` → `cap.architecture.metamodel`
- `opsx-semantic-relations`: `project.root/domain.architecture/cap.architecture.semantic-model` → `cap.xirang.semantic-relations`
- `references-home`: `project.root/domain.ai_integration/cap.ai.workflow-generation` → `cap.ai.references-home`
- `reviewer-cleanliness-dimension`: `project.root/domain.ai_integration/cap.ai.review-roles` → `cap.ai.reviewer-cleanliness-dimension`
- `schema-resolution`: `project.root/domain.artifact_graph/cap.artifact-graph.workflow-compilation` → `cap.artifact-graph.schema-resolution`
- `snack-skill-generation`: `project.root/domain.ai_integration/cap.ai.workflow-generation` → `cap.ai.snack-skill-generation`
- `snack-workflow-manifest`: `project.root/domain.ai_integration/cap.ai.workflow-generation` → `cap.ai.snack-workflow-manifest`
- `spec-frontmatter`: `project.root/domain.validation/cap.validation.semantic-contract` → `cap.spec.frontmatter`
- `spec-registry`: `project.root/domain.validation/cap.validation.semantic-contract` → `cap.spec.registry`
- `subagent-self-read`: `project.root/domain.ai_integration/cap.ai.review-roles` → `cap.ai.subagent-self-read`
- `sweeper-terminology-extraction`: `project.root/domain.ai_integration/cap.ai.intent-exploration` → `cap.ai.sweeper-terminology-extraction`
- `sweeper-terminology-reporting`: `project.root/domain.ai_integration/cap.ai.intent-exploration` → `cap.ai.sweeper-terminology-reporting`
- `sync-evidence-refresh`: `project.root/domain.verify/cap.verify.optimization-gate` → `cap.sync.evidence-refresh`
- `telemetry`: `project.root/domain.telemetry/cap.telemetry.anonymous-usage` → `cap.telemetry.anonymous-usage`
- `template-artifact-pipeline`: `project.root/domain.ai_integration/cap.ai.workflow-generation` → `cap.ai.template-artifact-pipeline`
- `tool-invocation-references`: `project.root/domain.ai_integration/cap.ai.tool-integration` → `cap.ai.tool-invocation-references`
- `verify-cli-gate`: `project.root/domain.verify/cap.verify.consistency-gate` → `cap.verify.cli-gate`
- `verify-execution-model-selection`: `project.root/domain.verify/cap.verify.consistency-gate` → `cap.verify.execution-model-selection`
- `verify-freshness-engine`: `project.root/domain.verify/cap.verify.consistency-gate` → `cap.verify.freshness-engine`
- `verify-prompt-orchestration`: `project.root/domain.verify/cap.verify.consistency-gate` → `cap.verify.prompt-orchestration`
- `verify-writeback`: `project.root/domain.ai_integration/cap.ai.review-roles` → `cap.ai.verify-writeback`

### Ambiguous

- `arch-query-command`: ambiguous:cap.architecture.likec4-reader,cap.cli.arch-query
- `architecture-delta-artifact`: ambiguous:cap.architecture.delta-merger,cap.schema.architecture-delta-artifact
- `artifact-graph`: ambiguous:cap.artifact-graph.file-definitions,cap.artifact-graph.instruction-loader,cap.artifact-graph.parse,cap.artifact-graph.schema-resolution,cap.artifact-graph.state-tracking
- `cli-completion`: ambiguous:cap.cli.completion,cap.cli.completion-introspect
- `cli-config`: ambiguous:cap.cli.config,cap.cli.config.project
- `cli-init`: ambiguous:cap.cli.init,cap.cli.init-opsx-skeleton
- `xirang-framework-identity`: ambiguous:cap.ai.workflow-templates,cap.framework.identity
- `snack-skill`: ambiguous:cap.ai.snack-skill,cap.ai.snack-skill-generation
- `spec-content-browser`: ambiguous:cap.presentation.spec-content-gateway,cap.presentation.spec-content-panel

### Unmatched (keep under nearest domain review)

- `ai-tool-paths` currently `project.root/domain.ai_integration/cap.ai.tool-integration`
- `apply-change-workflow` currently `project.root/domain.apply/cap.apply.verification-integration`
- `apply-default-isolation-config` currently `project.root/domain.config/cap.config.project-settings`
- `apply-implementer-subagent` currently `project.root/domain.apply/cap.apply.execution`
- `arch-plan-remove-command` currently `project.root/domain.cli/cap.cli.architecture-navigation`
- `archive-sync-workflow` currently `project.root/domain.architecture/cap.architecture.semantic-model`
- `archive-verify-gate` currently `project.root/domain.change_workflow/cap.change.lifecycle`
- `artifact-file-definitions` currently `project.root/domain.artifact_graph/cap.artifact-graph.workflow-compilation`
- `artifact-workflow-status` currently `project.root/domain.artifact_graph/cap.artifact-graph.workflow-compilation`
- `change-creation` currently `project.root/domain.change_workflow/cap.change.lifecycle`
- `cli-artifact-workflow` currently `project.root/domain.cli/cap.cli.artifact-workflow`
- `cli-candidate` currently `project.root/domain.cli/cap.cli.candidate`
- `cli-diff` currently `project.root/domain.cli/cap.cli.change-operations`
- `compilation-philosophy-fragment` currently `project.root/domain.ai_integration/cap.ai.workflow-generation`
- `config-project-query` currently `project.root/domain.cli/cap.cli.project-setup`
- `context-injection` currently `project.root/domain.config/cap.config.runtime-projection`
- `global-config` currently `project.root/domain.config/cap.config.global-contract`
- `graceful-status-empty` currently `project.root/domain.cli/cap.cli.artifact-workflow`
- `init-project-structure` currently `project.root/domain.cli/cap.cli.project-setup`
- `legacy-cleanup` currently `project.root/domain.config/cap.config.global-contract`
- `opsx-apply-architecture-context` currently `project.root/domain.ai_integration/cap.ai.workflow-generation`
- `opsx-apply-skill` currently `project.root/domain.apply/cap.apply.verification-integration`
- `opsx-archive-skill` currently `project.root/domain.change_workflow/cap.change.lifecycle`
- `xirang-build` currently `project.root/domain.architecture/cap.architecture.bootstrap`
- `opsx-conventions` currently `project.root/domain.ai_integration/cap.ai.workflow-generation`
- `opsx-impact-sweeper-architecture` currently `project.root/domain.architecture/cap.architecture.semantic-model`
- `opsx-optimizer-skill` currently `project.root/domain.ai_integration/cap.ai.review-roles`
- `opsx-propose-skill` currently `project.root/domain.ai_integration/cap.ai.workflow-generation`
- `opsx-reviewer-skill` currently `project.root/domain.ai_integration/cap.ai.review-roles`
- `opsx-shared-context` currently `project.root/domain.ai_integration/cap.ai.workflow-generation`
- `opsx-verify-skill` currently `project.root/domain.verify/cap.verify.consistency-gate`
- `optimizer-finding-lifecycle` currently `project.root/domain.verify/cap.verify.optimization-gate`
- `profiles` currently `project.root/domain.config/cap.config.global-contract`
- `project-contract` currently `project.root`
- `propose-workflow` currently `project.root/domain.cli/cap.cli.artifact-workflow`
- `rules-injection` currently `project.root/domain.config/cap.config.runtime-projection`
- `schema-validate-command` currently `project.root/domain.schema/cap.schema.workflow-definition`
- `schema-which-command` currently `project.root/domain.cli/cap.cli.artifact-workflow`
- `semantic-delta-application` currently `project.root/domain.change_workflow/cap.change.semantic-delta`
- `skill-frontmatter-yaml` currently `project.root/domain.ai_integration/cap.ai.workflow-generation`
- … and 11 more

## Legacy bootstrap

- Moved `.xirang/bootstrap/` → `.xirang/bootstrap-history/2026-07-23T09-27-23-000Z/`
- Also archived `project.xirang*.yaml.backup` into that stamp’s `yaml-backups/`

## Validation

- Assemble candidates into temp `.xirang/architecture` and run `node bin/opsx.js arch validate`
- Do not use global npm `xirang` for v1 profile

## Promote options

1. **`approve promote multi-file detailed`** — write formal as specification/project/domains/relations/views; **also rebind Specs** for auto-mapped folders; leave unmatched for follow-up change
2. **`approve promote multi-file architecture-only`** — multi-file detailed graph only; Specs stay on old coarse IDs (**broken ownership** until follow-up)
3. **`revise …`** — adjust domains/caps/ids before promote
4. **`keep coarse multi-file`** — previous 32-cap packaging split without fine grain

## Uncertainties

1. Fine-grain restore invents no new product decisions beyond historical model + quality/telemetry evidence.
2. `migration` and `opsx_element` domains restored from history; confirm they remain product intent vs retired surfaces.
3. Candidate validator / change-compiler may still expect monolithic `model.c4` for candidate promote path — this bootstrap promote writes formal files directly.
4. Historical domains were top-level siblings; candidate nests under `project_root` via `extend` for v1 Project Root rule.

## New capabilities (post-judgement)

- `cap.cli.legacy-cleanup`
- `cap.apply.change-workflow`
- `cap.cli.arch-plan-remove`
- `cap.cli.artifact-workflow`
- `cap.cli.candidate`
- `cap.cli.diff`
- `cap.architecture.project-build`
- `cap.framework.conventions`

Ready binds after new caps: **112**
Remaining: keep-coarse `artifact-graph`, `project-contract`; split `spec-content-browser`.
