# Bootstrap Review

Review the mapped architecture before promoting to formal OPSX files.

This file is derived from evidence.yaml and domain-map/*.yaml. If either changes, regenerate review via `openspec bootstrap validate`.

## Refresh Scope

- Strategy: full-rebuild
- Reason: Rebuilding the complete candidate from current source, specs, config, and reviewed workspace evidence.
- Impacted domains: dom.ai-integration, dom.apply, dom.artifact-graph, dom.change-workflow, dom.cli, dom.config, dom.opsx, dom.schema, dom.validation, dom.verify
- Preserved baseline nodes: 0

## Delta Summary

- ADDED: 0 nodes, 0 relations
- MODIFIED: 58 nodes, 0 relations
- REMOVED: 0 nodes, 0 relations

## Domain Checklist

- [x] dom.ai-integration — 24 capabilities, confidence: high
- [x] dom.apply — 7 capabilities, confidence: high
- [x] dom.artifact-graph — 4 capabilities, confidence: high
- [x] dom.change-workflow — 6 capabilities, confidence: high
- [x] dom.cli — 28 capabilities, confidence: high
- [x] dom.config — 7 capabilities, confidence: high
- [x] dom.opsx — 9 capabilities, confidence: high
- [x] dom.schema — 5 capabilities, confidence: high
- [x] dom.validation — 8 capabilities, confidence: high
- [x] dom.verify — 9 capabilities, confidence: high

## Candidate Specs

- No candidate specs will be written
- Existing formal specs remain the source of truth unless a new capability requires a missing spec file.
- preserved existing spec: openspec/specs/agent-prompt-guidance/spec.md
- preserved existing spec: openspec/specs/ai-impact-sweeper/spec.md
- preserved existing spec: openspec/specs/apply-branch-isolation/spec.md
- preserved existing spec: openspec/specs/apply-preflight-scan/spec.md
- preserved existing spec: openspec/specs/apply-recovery-protocol-enhanced/spec.md
- preserved existing spec: openspec/specs/apply-task-decomposition/spec.md
- preserved existing spec: openspec/specs/apply-verify-integration/spec.md
- preserved existing spec: openspec/specs/bootstrap-backfill-specs/spec.md
- preserved existing spec: openspec/specs/bootstrap/spec.md
- preserved existing spec: openspec/specs/change-creation/spec.md
- preserved existing spec: openspec/specs/cli-archive/spec.md
- preserved existing spec: openspec/specs/cli-authoring-help/spec.md
- preserved existing spec: openspec/specs/cli-change/spec.md
- preserved existing spec: openspec/specs/cli-check-delta/spec.md
- preserved existing spec: openspec/specs/cli-command-reference-consistency/spec.md
- preserved existing spec: openspec/specs/cli-completion-introspect/spec.md
- preserved existing spec: openspec/specs/cli-completion/spec.md
- preserved existing spec: openspec/specs/cli-config/spec.md
- preserved existing spec: openspec/specs/cli-feedback/spec.md
- preserved existing spec: openspec/specs/cli-init/spec.md
- preserved existing spec: openspec/specs/cli-list/spec.md
- preserved existing spec: openspec/specs/cli-opsx-query/spec.md
- preserved existing spec: openspec/specs/cli-scenario-labels/spec.md
- preserved existing spec: openspec/specs/cli-show/spec.md
- preserved existing spec: openspec/specs/cli-spec/spec.md
- preserved existing spec: openspec/specs/cli-sync/spec.md
- preserved existing spec: openspec/specs/cli-update/spec.md
- preserved existing spec: openspec/specs/cli-validate/spec.md
- preserved existing spec: openspec/specs/cli-view/spec.md
- preserved existing spec: openspec/specs/config-apply-projection/spec.md
- preserved existing spec: openspec/specs/config-projection/spec.md
- preserved existing spec: openspec/specs/enforce-optimizer-invocation/spec.md
- preserved existing spec: openspec/specs/explore-brainstorming/spec.md
- preserved existing spec: openspec/specs/explore-terminology-decision/spec.md
- preserved existing spec: openspec/specs/init-opsx-skeleton/spec.md
- preserved existing spec: openspec/specs/instruction-loader/spec.md
- preserved existing spec: openspec/specs/internal-subagent-generation/spec.md
- preserved existing spec: openspec/specs/opsx-delta-artifact/spec.md
- preserved existing spec: openspec/specs/opsx-delta-merge/spec.md
- preserved existing spec: openspec/specs/opsx-semantic-relations/spec.md
- preserved existing spec: openspec/specs/propose-workflow/spec.md
- preserved existing spec: openspec/specs/propose-workflow/spec.md
- preserved existing spec: openspec/specs/references-home/spec.md
- preserved existing spec: openspec/specs/reviewer-cleanliness-dimension/spec.md
- preserved existing spec: openspec/specs/schema-resolution/spec.md
- preserved existing spec: openspec/specs/snack-skill-generation/spec.md
- preserved existing spec: openspec/specs/snack-skill/spec.md
- preserved existing spec: openspec/specs/snack-workflow-manifest/spec.md
- preserved existing spec: openspec/specs/spec-frontmatter/spec.md
- preserved existing spec: openspec/specs/spec-registry/spec.md
- preserved existing spec: openspec/specs/subagent-self-read/spec.md
- preserved existing spec: openspec/specs/sweeper-terminology-extraction/spec.md
- preserved existing spec: openspec/specs/sweeper-terminology-reporting/spec.md
- preserved existing spec: openspec/specs/sync-evidence-refresh/spec.md
- preserved existing spec: openspec/specs/template-artifact-pipeline/spec.md
- preserved existing spec: openspec/specs/tool-invocation-references/spec.md
- preserved existing spec: openspec/specs/verify-cli-gate/spec.md
- preserved existing spec: openspec/specs/verify-execution-model-selection/spec.md
- preserved existing spec: openspec/specs/verify-freshness-engine/spec.md
- preserved existing spec: openspec/specs/verify-prompt-orchestration/spec.md
- preserved existing spec: openspec/specs/verify-writeback/spec.md

## Validation

- [x] Review matches current candidate output
- [x] Referential integrity passes
- [x] Relation semantic validation passes
- [x] Candidate spec set matches the bootstrap mode contract
- [x] Fresh candidate diff matches the current formal OPSX baseline
- [x] Candidate specs pass OpenSpec validation
- [x] Domain boundaries match mental model
