---
capabilities:
  - cap.cli.validate
---
# cli-validate Specification

## Purpose
Define `openspec validate` behavior for validating changes and specs with actionable remediation guidance and structured output.
## Requirements
### Requirement: Validation SHALL provide actionable remediation steps

Validation output SHALL include specific guidance to fix each error, including expected structure, example headers, and suggested commands to verify fixes.

#### Scenario: No deltas found in change

- **WHEN** validating a change with zero parsed deltas
- **THEN** show error "No deltas found" with guidance:
  - Explain that change specs must include `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`
  - Remind authors that files must live under `openspec/changes/{id}/specs/<capability>/spec.md`
  - Include an explicit note: "Spec delta files cannot start with titles before the operation headers"
  - Suggest running `openspec change show {id} --json --deltas-only` for debugging

#### Scenario: Missing required sections

- **WHEN** a required section is missing
- **THEN** include expected header names and a minimal skeleton:
  - For Spec: `## Purpose`, `## Requirements`
  - For Change: `## Why`, `## What Changes`
  - Provide an example snippet of the missing section with placeholder prose ready to copy
  - Mention the quick-reference section in `openspec/AGENTS.md` as the authoritative template

#### Scenario: Missing requirement descriptive text

- **WHEN** a requirement header lacks descriptive text before scenarios
- **THEN** emit an error explaining that `### Requirement:` lines must be followed by narrative text before any `#### Scenario:` headers
  - Show compliant example: "### Requirement: Foo" followed by "The system SHALL ..."
  - Suggest adding 1-2 sentences describing the normative behavior prior to listing scenarios
  - Reference the pre-validation checklist in `openspec/AGENTS.md`

#### Scenario: Section-type 与主 spec header 不一致

- **WHEN** change spec 中 MODIFIED/REMOVED/RENAMED 引用的 requirement header 在主 spec 中不存在
- **OR** change spec 中 ADDED 的 requirement header 在主 spec 中已存在
- **THEN** emit ERROR 并包含修复建议：
  - 对 MODIFIED 不存在：建议改为 `## ADDED Requirements`
  - 对 ADDED 已存在：建议改为 `## MODIFIED Requirements`
  - 对 REMOVED/RENAMED 不存在：说明目标 header 不存在于主 spec

### Requirement: Validator SHALL detect likely misformatted scenarios and warn with a fix
The validator SHALL recognize bulleted lines that look like scenarios (e.g., lines beginning with WHEN/THEN/AND) and emit a targeted warning with a conversion example to `#### Scenario:`.

#### Scenario: Bulleted WHEN/THEN under a Requirement
- **WHEN** bullets that start with WHEN/THEN/AND are found under a requirement without any `#### Scenario:` headers
- **THEN** emit warning: "Scenarios must use '#### Scenario:' headers", and show a conversion template:
```
#### Scenario: Short name
- **WHEN** ...
- **THEN** ...
- **AND** ...
```

### Requirement: All issues SHALL include file paths and structured locations
Error, warning, and info messages SHALL include:
- Source file path (`openspec/changes/{id}/proposal.md`, `.../specs/{cap}/spec.md`)
- Structured path (e.g., `deltas[0].requirements[0].scenarios`)

#### Scenario: Zod validation error
- **WHEN** a schema validation fails
- **THEN** the message SHALL include `file`, `path`, and a remediation hint if applicable

### Requirement: Invalid results SHALL include a Next steps footer in human-readable output
The CLI SHALL append a Next steps footer when the item is invalid and not using `--json`, including:
- Summary line with counts
- Top-3 guidance bullets (contextual to the most frequent or blocking errors)
- A suggestion to re-run with `--json` and/or the debug command

#### Scenario: Change invalid summary
- **WHEN** a change validation fails
- **THEN** print "Next steps" with 2-3 targeted bullets and suggest `openspec change show <id> --json --deltas-only`

### Requirement: Top-level validate command

The CLI SHALL provide a top-level `validate` command for validating changes and specs with flexible selection options.

#### Scenario: Interactive validation selection

- **WHEN** executing `openspec validate` without arguments
- **THEN** prompt user to select what to validate (all, changes, specs, or specific item)
- **AND** perform validation based on selection
- **AND** display results with appropriate formatting

#### Scenario: Non-interactive environments do not prompt

- **GIVEN** stdin is not a TTY or `--no-interactive` is provided or environment variable `OPEN_SPEC_INTERACTIVE=0`
- **WHEN** executing `openspec validate` without arguments
- **THEN** do not prompt interactively
- **AND** print a helpful hint listing available commands/flags and exit with code 1

#### Scenario: Direct item validation

- **WHEN** executing `openspec validate <item-name>`
- **THEN** automatically detect if item is a change or spec
- **AND** validate the specified item
- **AND** display validation results

### Requirement: Bulk and filtered validation

The validate command SHALL support flags for bulk validation (--all) and filtered validation by type (--changes, --specs).

#### Scenario: Validate everything

- **WHEN** executing `openspec validate --all`
- **THEN** validate all changes in openspec/changes/ (excluding archive)
- **AND** validate all specs in openspec/specs/
- **AND** display a summary showing passed/failed items
- **AND** exit with code 1 if any validation fails

#### Scenario: Scope of bulk validation

- **WHEN** validating with `--all` or `--changes`
- **THEN** include all change proposals under `openspec/changes/`
- **AND** exclude the `openspec/changes/archive/` directory

- **WHEN** validating with `--specs`
- **THEN** include all specs that have a `spec.md` under `openspec/specs/<id>/spec.md`

#### Scenario: Validate all changes

- **WHEN** executing `openspec validate --changes`
- **THEN** validate all changes in openspec/changes/ (excluding archive)
- **AND** display results for each change
- **AND** show summary statistics

#### Scenario: Validate all specs

- **WHEN** executing `openspec validate --specs`
- **THEN** validate all specs in openspec/specs/
- **AND** display results for each spec
- **AND** show summary statistics

### Requirement: Validation options and progress indication

The validate command SHALL support standard validation options (--strict, --json) and display progress during bulk operations.

#### Scenario: Strict validation

- **WHEN** executing `openspec validate --all --strict`
- **THEN** apply strict validation to all items
- **AND** treat warnings as errors
- **AND** fail if any item has warnings or errors

#### Scenario: JSON output

- **WHEN** executing `openspec validate --all --json`
- **THEN** output validation results as JSON
- **AND** include detailed issues for each item
- **AND** include summary statistics

#### Scenario: JSON output schema for bulk validation

- **WHEN** executing `openspec validate --all --json` (or `--changes` / `--specs`)
- **THEN** output a JSON object with the following shape:
  - `items`: Array of objects with fields `{ id: string, type: "change"|"spec", valid: boolean, issues: Issue[], durationMs: number }`
  - `summary`: Object `{ totals: { items: number, passed: number, failed: number }, byType: { change?: { items: number, passed: number, failed: number }, spec?: { items: number, passed: number, failed: number } } }`
  - `version`: String identifier for the schema (e.g., `"1.0"`)
- **AND** exit with code 1 if any `items[].valid === false`

Where `Issue` follows the existing per-item validation report shape `{ level: "ERROR"|"WARNING"|"INFO", path: string, message: string }`.

#### Scenario: Show validation progress

- **WHEN** validating multiple items (--all, --changes, or --specs)
- **THEN** show progress indicator or status updates
- **AND** indicate which item is currently being validated
- **AND** display running count of passed/failed items

#### Scenario: Concurrency limits for performance

- **WHEN** validating multiple items
- **THEN** run validations with a bounded concurrency (e.g., 4–8 in parallel)
- **AND** ensure progress indicators remain responsive

### Requirement: Item type detection and ambiguity handling

The validate command SHALL handle ambiguous names and explicit type overrides to ensure clear, deterministic behavior.

#### Scenario: Direct item validation with automatic type detection

- **WHEN** executing `openspec validate <item-name>`
- **THEN** if `<item-name>` uniquely matches a change or a spec, validate that item

#### Scenario: Ambiguity between change and spec names

- **GIVEN** `<item-name>` exists both as a change and as a spec
- **WHEN** executing `openspec validate <item-name>`
- **THEN** print an ambiguity error explaining both matches
- **AND** suggest passing `--type change` or `--type spec`, or using `openspec change validate` / `openspec spec validate`
- **AND** exit with code 1 without performing validation

#### Scenario: Unknown item name

- **WHEN** the `<item-name>` matches neither a change nor a spec
- **THEN** print a not-found error
- **AND** show nearest-match suggestions when available
- **AND** exit with code 1

#### Scenario: Explicit type override

- **WHEN** executing `openspec validate --type change <item>`
- **THEN** treat `<item>` as a change ID and validate it (skipping auto-detection)

- **WHEN** executing `openspec validate --type spec <item>`
- **THEN** treat `<item>` as a spec ID and validate it (skipping auto-detection)

### Requirement: Interactivity controls

- The CLI SHALL respect `--no-interactive` to disable prompts.
- The CLI SHALL respect `OPEN_SPEC_INTERACTIVE=0` to disable prompts globally.
- Interactive prompts SHALL only be shown when stdin is a TTY and interactivity is not disabled.

#### Scenario: Disabling prompts via flags or environment

- **WHEN** `openspec validate` is executed with `--no-interactive` or with environment `OPEN_SPEC_INTERACTIVE=0`
- **THEN** the CLI SHALL not display interactive prompts
- **AND** SHALL print non-interactive hints or chosen outputs as appropriate

### Requirement: Parser SHALL handle cross-platform line endings
The markdown parser SHALL correctly identify sections regardless of line ending format (LF, CRLF, CR).

#### Scenario: Required sections parsed with CRLF line endings
- **GIVEN** a change proposal markdown saved with CRLF line endings
- **AND** the document contains `## Why` and `## What Changes`
- **WHEN** running `openspec validate <change-id>`
- **THEN** validation SHALL recognize the sections and NOT raise parsing errors

### Requirement: Scenario operation label 校验

`openspec validate` SHALL 对 change-local delta specs 中 `#### Scenario:` 标题上的 scenario operation labels 进行语法校验。合法 labels 为 `[ADDED]`、`[MODIFIED]`、`[REMOVED]`，且 SHALL 仅出现在 canonical `#### Scenario:` 标记之后的 scenario 标题起始处。Validate SHALL remain read-only and SHALL NOT require scenario-level labels before validation.

校验规则：
- `## MODIFIED Requirements` 下无标签 scenario 是合法输入；scenario operation labels MAY be generated by `openspec scenario-labels "<change>" --write` after validation
- `## ADDED Requirements` 下 scenario 隐式新增，不加标签（`[ADDED]` 为冗余），`[MODIFIED]` 或 `[REMOVED]` → ERROR 并解释语义原因
- `## REMOVED Requirements` 无 scenario

#### Scenario: 合法 scenario labels 通过 change validation

- **WHEN** change spec 在 `## MODIFIED Requirements` 下包含 `[ADDED]`、`[MODIFIED]` 或 `[REMOVED]` scenario labels
- **THEN** `openspec validate <change> --type change` SHALL NOT 为这些 labels 报告错误

#### Scenario: 未知 label 报错

- **WHEN** change spec 包含 `#### Scenario: [UPDATED] 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明允许的 labels 为 `[ADDED]`、`[MODIFIED]`、`[REMOVED]`

#### Scenario: 非法 label 位置报错

- **WHEN** change spec 包含 `#### [ADDED] Scenario: 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 展示合法格式 `#### Scenario: [ADDED] 场景`

#### Scenario: REMOVED scenario 不允许出现在 ADDED requirement 中

- **WHEN** change spec 在 `## ADDED Requirements` 下包含 `#### Scenario: [REMOVED] 旧场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明新增 requirement 不能有 removed scenario，建议使用 `## MODIFIED Requirements` 替代

#### Scenario: MODIFIED label 不允许出现在 ADDED requirement 中

- **WHEN** change spec 在 `## ADDED Requirements` 下包含 `#### Scenario: [MODIFIED] 场景`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明新增 requirement 只能有 `[ADDED]` scenario，建议使用 `## MODIFIED Requirements` 替代

#### Scenario: MODIFIED requirement 下无标签 scenario 通过校验

- **WHEN** change spec 在 `## MODIFIED Requirements` 下包含无标签的 `#### Scenario: 场景`
- **THEN** `openspec validate <change> --type change` SHALL NOT 为缺少 scenario operation label 报告错误
- **AND** validate SHALL NOT write scenario labels to the change spec

#### Scenario: surviving scenario 数量必须非零

- **WHEN** change spec 中某个 MODIFIED requirement 的全部 scenarios 都标记为 `[REMOVED]`
- **THEN** `openspec validate <change> --type change` SHALL report ERROR
- **AND** 错误信息 SHALL 说明至少需要一个 unlabeled、`[ADDED]` 或 `[MODIFIED]` scenario（surviving, non-removed）

#### Scenario: ADDED requirement 无标签 scenario 通过校验

- **WHEN** change spec 在 `## ADDED Requirements` 下包含无标签的 `#### Scenario: 场景`
- **THEN** `openspec validate <change> --type change` SHALL NOT 报告错误

### Requirement: Formal spec scenario label 清洁度

`openspec validate --specs` 及 spec content validation SHALL 拒绝 formal specs 中的 scenario operation labels。Formal specs SHALL 包含无需 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` operation metadata 的 canonical `#### Scenario:` 标题。

#### Scenario: Formal spec 含 ADDED label 报错
- **WHEN** `openspec/specs/<capability>/spec.md` 包含 `#### Scenario: [ADDED] 场景`
- **THEN** `openspec validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Formal spec 含 MODIFIED label 报错
- **WHEN** `openspec/specs/<capability>/spec.md` 包含 `#### Scenario: [MODIFIED] 场景`
- **THEN** `openspec validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Formal spec 含 REMOVED label 报错
- **WHEN** `openspec/specs/<capability>/spec.md` 包含 `#### Scenario: [REMOVED] 场景`
- **THEN** `openspec validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Clean formal scenario 通过清洁度校验
- **WHEN** `openspec/specs/<capability>/spec.md` 包含 `#### Scenario: 场景`
- **AND** scenario 标题不以 `[ADDED]`、`[MODIFIED]` 或 `[REMOVED]` 开头
- **THEN** scenario label 清洁度校验 SHALL NOT 报告问题

### Requirement: Task Verifies scenario label 归一化

Task structure validation SHALL 使用 label-free scenario title 将 `Verifies:` scenario 引用与 change-local specs 匹配。Scenario operation labels SHALL NOT 作为对外引用的 scenario title 的一部分。

#### Scenario: Verifies 通过 clean title 匹配 labeled scenario
- **WHEN** change-local spec 包含 `#### Scenario: [MODIFIED] 已调整场景`
- **AND** `tasks.md` 包含 `Verifies: specs/<capability>/spec.md / Requirement "能力" / Scenario "已调整场景"`
- **THEN** task structure validation SHALL treat the scenario reference as valid

#### Scenario: Verifies 不应要求 label 文本
- **WHEN** change-local spec 包含 `#### Scenario: [ADDED] 新场景`
- **AND** `tasks.md` 包含 `Verifies: specs/<capability>/spec.md / Requirement "能力" / Scenario "新场景"`
- **THEN** task structure validation SHALL treat the scenario reference as valid
- **AND** SHALL NOT 要求 `Scenario "[ADDED] 新场景"`

### Requirement: Artifact-scoped change validation

The validate command SHALL support explicit change selection and artifact-scoped validation so authors can validate generated change artifacts incrementally without waiting for every artifact to be complete.

#### Scenario: Explicit change validation defaults to full change validation
- **WHEN** executing `openspec validate --change my-change`
- **THEN** the CLI SHALL validate `openspec/changes/my-change`
- **AND** SHALL run the same full change validation as `openspec validate my-change --type change`
- **AND** SHALL include both change delta spec validation and OPSX delta validation in the merged report

#### Scenario: Specs artifact scope validates only delta specs
- **WHEN** executing `openspec validate --change my-change --artifacts specs`
- **THEN** the CLI SHALL validate `openspec/changes/my-change/specs/**/spec.md`
- **AND** SHALL report issues from change delta spec validation
- **AND** SHALL NOT report issues from OPSX delta dry-run validation

#### Scenario: OPSX delta artifact scope validates only opsx-delta
- **WHEN** executing `openspec validate --change my-change --artifacts opsx-delta`
- **THEN** the CLI SHALL validate `openspec/changes/my-change/opsx-delta.yaml`
- **AND** SHALL report issues from OPSX delta dry-run validation
- **AND** SHALL NOT report issues from change delta spec validation

#### Scenario: Unknown artifact scope fails deterministically
- **WHEN** executing `openspec validate --change my-change --artifacts unknown`
- **THEN** the CLI SHALL print an error that lists supported artifact scopes `specs` and `opsx-delta`
- **AND** SHALL exit with code 1 without running validation

#### Scenario: Missing explicit change fails deterministically
- **WHEN** executing `openspec validate --change missing-change`
- **THEN** the CLI SHALL print an unknown change error
- **AND** SHALL exit with code 1 without validating specs or unrelated changes

