# Bootstrap Review

Review the mapped architecture before promoting to formal OPSX files.

This file is derived from evidence.yaml and domain-map/*.yaml. If either changes, regenerate review via `opsx bootstrap validate`.

## Refresh Scope

- Strategy: full-rebuild
- Reason: Rebuilding the complete candidate from current source, specs, config, and reviewed workspace evidence.
- Impacted domains: dom.ai-integration, dom.apply, dom.artifact-graph, dom.change-workflow, dom.cli, dom.config, dom.opsx, dom.schema, dom.validation, dom.verify
- Preserved baseline nodes: 0

## Delta Summary

- ADDED: 0 nodes, 0 relations
- MODIFIED: 0 nodes, 0 relations
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
- preserved existing spec: .opsx/specs/agent-prompt-guidance/spec.md
- preserved existing spec: .opsx/specs/ai-impact-sweeper/spec.md
- preserved existing spec: .opsx/specs/apply-branch-isolation/spec.md
- preserved existing spec: .opsx/specs/apply-preflight-scan/spec.md
- preserved existing spec: .opsx/specs/apply-recovery-protocol-enhanced/spec.md
- preserved existing spec: .opsx/specs/apply-task-decomposition/spec.md
- preserved existing spec: .opsx/specs/apply-verify-integration/spec.md
- preserved existing spec: .opsx/specs/bootstrap-backfill-specs/spec.md
- preserved existing spec: .opsx/specs/bootstrap/spec.md
- preserved existing spec: .opsx/specs/change-creation/spec.md
- preserved existing spec: .opsx/specs/cli-archive/spec.md
- preserved existing spec: .opsx/specs/cli-authoring-help/spec.md
- preserved existing spec: .opsx/specs/cli-change/spec.md
- preserved existing spec: .opsx/specs/cli-check-delta/spec.md
- preserved existing spec: .opsx/specs/cli-command-reference-consistency/spec.md
- preserved existing spec: .opsx/specs/cli-completion-introspect/spec.md
- preserved existing spec: .opsx/specs/cli-completion/spec.md
- preserved existing spec: .opsx/specs/cli-config/spec.md
- preserved existing spec: .opsx/specs/cli-feedback/spec.md
- preserved existing spec: .opsx/specs/cli-init/spec.md
- preserved existing spec: .opsx/specs/cli-list/spec.md
- preserved existing spec: .opsx/specs/cli-opsx-query/spec.md
- preserved existing spec: .opsx/specs/cli-scenario-labels/spec.md
- preserved existing spec: .opsx/specs/cli-show/spec.md
- preserved existing spec: .opsx/specs/cli-spec/spec.md
- preserved existing spec: .opsx/specs/cli-sync/spec.md
- preserved existing spec: .opsx/specs/cli-update/spec.md
- preserved existing spec: .opsx/specs/cli-validate/spec.md
- preserved existing spec: .opsx/specs/cli-view/spec.md
- preserved existing spec: .opsx/specs/config-apply-projection/spec.md
- preserved existing spec: .opsx/specs/config-projection/spec.md
- preserved existing spec: .opsx/specs/enforce-optimizer-invocation/spec.md
- preserved existing spec: .opsx/specs/explore-brainstorming/spec.md
- preserved existing spec: .opsx/specs/explore-terminology-decision/spec.md
- preserved existing spec: .opsx/specs/init-opsx-skeleton/spec.md
- preserved existing spec: .opsx/specs/instruction-loader/spec.md
- preserved existing spec: .opsx/specs/internal-subagent-generation/spec.md
- preserved existing spec: .opsx/specs/opsx-delta-artifact/spec.md
- preserved existing spec: .opsx/specs/opsx-delta-merge/spec.md
- preserved existing spec: .opsx/specs/opsx-semantic-relations/spec.md
- preserved existing spec: .opsx/specs/propose-workflow/spec.md
- preserved existing spec: .opsx/specs/propose-workflow/spec.md
- preserved existing spec: .opsx/specs/references-home/spec.md
- preserved existing spec: .opsx/specs/reviewer-cleanliness-dimension/spec.md
- preserved existing spec: .opsx/specs/schema-resolution/spec.md
- preserved existing spec: .opsx/specs/snack-skill-generation/spec.md
- preserved existing spec: .opsx/specs/snack-skill/spec.md
- preserved existing spec: .opsx/specs/snack-workflow-manifest/spec.md
- preserved existing spec: .opsx/specs/spec-frontmatter/spec.md
- preserved existing spec: .opsx/specs/spec-registry/spec.md
- preserved existing spec: .opsx/specs/subagent-self-read/spec.md
- preserved existing spec: .opsx/specs/sweeper-terminology-extraction/spec.md
- preserved existing spec: .opsx/specs/sweeper-terminology-reporting/spec.md
- preserved existing spec: .opsx/specs/sync-evidence-refresh/spec.md
- preserved existing spec: .opsx/specs/template-artifact-pipeline/spec.md
- preserved existing spec: .opsx/specs/tool-invocation-references/spec.md
- preserved existing spec: .opsx/specs/verify-cli-gate/spec.md
- preserved existing spec: .opsx/specs/verify-execution-model-selection/spec.md
- preserved existing spec: .opsx/specs/verify-freshness-engine/spec.md
- preserved existing spec: .opsx/specs/verify-prompt-orchestration/spec.md
- preserved existing spec: .opsx/specs/verify-writeback/spec.md

## Validation

- [x] Review matches current candidate output
- [x] Referential integrity passes
- [x] Relation semantic validation passes
- [x] Candidate spec set matches the bootstrap mode contract
- [x] Fresh candidate diff matches the current formal OPSX baseline
- [x] Candidate specs pass OPSX validation
- [x] Domain boundaries match mental model
