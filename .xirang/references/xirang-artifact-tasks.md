# tasks

## Definition

```yaml
purpose: Decompose implementation into executable, evidence-gated work units.
compilationRole: Goal-level implementation objectives and verification
  directions; goal checkboxes are progress markers, not file inventories or
  executable checks.
content:
  includes:
    - Goal-level implementation objectives, Contract references, verification
      directions, and target-level completion state.
  excludes:
    - New observable behavior, architecture semantics, repeated design
      rationale, and non-verifiable narration.
writePolicy: agent-authored
validation:
  - xirang validate --change <name> --json
```

## Guidance

Create a goal-level task list for Apply. Each goal identifies an intended outcome, references its Contract Section, and states behavior, relevant boundaries, and expected observable verification results. Do not prescribe files, tests, test actions, commands, implementation steps, or ordinary technical ordering; Apply derives these from current repository evidence.

**Required structure:**
- Use one `## Goals` section with one or more `- [ ] G<n>: <goal>` entries.
- Each goal MUST include one nested `Contract: `<identity>` / Section "<title>"` reference and one `Verify: <behavior, boundary, observable result>` direction.
- Use goal checkboxes as the only ordinary progress markers. Keep Required Corrections in their separate section.
- Encode ordering only when explicitly confirmed by the user; ordinary technical dependency order belongs to Apply.
- Do not include Files, Sections, Checks, test actions, test layers, commands, or execution logs.
- If target behavior is absent from the Contract, repair the Contract before adding or changing a goal.
- Keep `proposal.md`, `design.md`, and `tasks.md` distinct: scope, key decisions, and goals with verification directions respectively.

**Conversion rules:**
- Goal prose follows `proseLanguage` when configured; structural labels remain canonical.
- Derive goals from the confirmed target semantics. Merge details serving one observable goal; do not create one goal per Section or Acceptance Case.
- Apply chooses and records no specific test arrangement in tasks.md. Evidence is evaluated during Apply and independent Review.

Example:
```
## Goals

- [ ] G1: Reject unsupported task layouts
  - Contract: `task-decomposition` / Section "Checks 是任务进度源"
  - Verify: Legacy layouts are rejected; goal-level tasks remain valid.
```


## Template

## Goals

- [ ] G1: <!-- outcome-oriented implementation goal -->
  - Contract: `<!-- element identity -->` / Section "<!-- section title -->"
  - Verify: <!-- behavior, relevant boundary, and expected observable result -->

## Required Corrections

- [ ] [code_fix] <!-- concrete implementation correction -->
- [ ] [artifact_fix] <!-- concrete Change artifact correction -->
