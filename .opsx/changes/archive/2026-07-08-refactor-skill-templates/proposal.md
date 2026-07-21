## Why

OpenSpec skill templates carry obsolete generated-subagent artifact warnings (`Skill Delegation Protocol`, "Never read or inline generated subagent artifact") that were only needed when subagents were invoked via skill files. Since subagents are now native agent files (`openspec-reviewer`, `openspec-optimizer`, `openspec-impact-sweeper`), these directives are misleading dead weight. Additionally, framework-specific names ("Ponytail", "Superpowers") in skill prompts risk model confusion — the substance should remain but the names should not. Finally, the monolithic apply-change skill prompt inflates context and risks instruction amnesia; splitting it into per-step reference files keeps the skill surface lean.

## What Changes

- **Remove `## Skill Delegation Protocol`** and all "Never read or inline generated subagent artifact" directives from `apply-change.ts`, `explore.ts`, and `archive-change.ts`.
- **Rename framework-specific terms**: "Ponytail" → "Simplicity Filter" / "rationale tag" in optimizer and explore; "Ponytail-lite" → "Simplicity Awareness" in explore; "Ponytail-full Coding Discipline" condensed directly into apply skill's Implementation Discipline.
- **Refactor apply-change skill** into seven per-step reference files (Preparation, Pre-flight Scan, Branch Isolation, Phase 1 Verification, Phase 2 Optimization, Phase 3 Seal, Output), keeping only the OPSX philosophy, flow outline, and concise implementation discipline inline.
- **Add quality guardrails** directly to reviewer and optimizer agent prompts: reviewer prefers direct evidence and treats staleness as defects; optimizer asks delete/stdlib/native/yagni/shrink before proposing patches.
- **De-duplicate ID validation** in `task-structure.ts`: extract `isActionId`/`isCheckId` helpers to replace three inline regex copies.

## Capabilities

- `cap.ai.workflow-templates` (MODIFIED)
- `cap.ai.explore-brainstorming` (MODIFIED)
- `cap.apply.task-decomposition` (MODIFIED)
- `cap.verify.optimize` (MODIFIED)

## Impact

- Affected: 6 source workflow templates, 1 parser, 8 test files, 1 workflow-installation test.
- No CLI behavior change. No user-facing breaking change.
- Generated `.pi/skills` and `openspec/references` will update on next `openspec sync`.
- All 2007 tests pass, TypeScript build succeeds.
