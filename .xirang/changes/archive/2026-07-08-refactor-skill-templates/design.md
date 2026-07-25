## Context

OpenSpec skill templates historically included `## Skill Delegation Protocol` sections with warnings like "Never read or inline the generated openspec-impact-sweeper, openspec-reviewer, or openspec-optimizer subagent artifact." These existed because subagents were previously invoked as skill files (.claude/skills/openspec-reviewer/SKILL.md). Since subagents migrated to native agent files (.claude/agents/openspec-reviewer.md), the warnings became obsolete and misleading.

Additionally, skill templates used framework-specific names ("Ponytail", "Pocock", "Superpowers") in prompts. While the underlying principles (YAGNI, stdlib-first, deletion over addition) are valuable, naming external frameworks risks model confusion — models may try to invoke non-existent "Ponytail" or "Superpowers" tools.

Finally, the apply-change skill template was monolithic (~160 lines of inline instructions), causing context inflation and instruction amnesia in long sessions.

## Goals / Non-Goals

**Goals:**
- Remove all `Skill Delegation Protocol` sections from workflow templates.
- Replace framework-specific names with neutral terms (simplicity filter, rationale tag, simplicity awareness).
- Split apply skill into per-step reference files to keep the skill surface lean.
- Add concise quality guardrails directly to reviewer/optimizer agent prompts.

**Non-Goals:**
- Do not change the semantics of implementation discipline, recovery protocol, or TDD rules.
- Do not modify generated `.pi/skills`, `.claude/skills`, or `openspec/references` files directly (they update via `openspec sync`).

## Decisions

1. **Skill Delegation Protocol removal**: Delete the entire section from `apply-change.ts`, `explore.ts`. Remove the `MUST NOT read or inline generated subagent artifacts` line from `archive-change.ts`. Test assertions updated to verify absence rather than presence.

2. **Name neutrality**: Rename "Ponytail" → "Simplicity Filter" in optimizer reference and agent prompt; "Ponytail-lite" → "Simplicity Awareness" in explore; inline "Implementation Discipline" replaces "Ponytail-full Coding Discipline" in apply. Tags: "ponytail tag" → "rationale tag".

3. **Step references**: Apply template now exports 7 `APPLY_STEP_*_REFERENCE` constants mapped through `referenceFiles`. The skill body provides a numbered outline linking to `openspec/references/openspec-apply-step-<N>-*.md`. `Verifies`/`schema`/`state machine` fragments moved into the appropriate step reference.

4. **Agent quality guardrails**: Reviewer agent prompt adds "Prefer direct evidence over inferred intent" and "Treat stale code, orphaned imports, half migrations, and unaccounted behavior changes as defects." Optimizer agent prompt adds "First ask whether code can be deleted, replaced by standard library or native platform behavior, or expressed directly."

5. **task-structure.ts code optimization**: Extract `isActionId`/`isCheckId` helper functions to replace three inline `/^A\d+$/.test()` / `/^C\d+$/.test()` copies. No new file or dependency.

## Risks / Trade-offs

- **Reference file proliferation**: Apply skill now has 7 reference files instead of 1. Mitigation: sync engine deduplicates shared reference files; `collectSharedReferenceFiles` handles name collisions.
- **Parity hash churn**: Every template content change requires updating `skill-templates-parity.test.ts` hashes. Acceptable: hashes are intentional version markers.
- **Explore template still references "Superpowers"**: The explore template references `openspec/references/openspec-explore-supperpowers-style.md`. Not renamed here — the reference file content is a separate concern.
