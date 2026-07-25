---
element: cap.cli.validate
---

# cli-validate Specification

## Purpose
Define `xirang validate` behavior for validating changes and specs with actionable remediation guidance and structured output.
## Requirements
### Requirement: Validation SHALL provide actionable remediation steps

校验输出 SHALL 为每个错误提供可执行修复指引，包括期望结构、示例标题与建议命令。Requirement 正文校验 SHALL 基于完整 requirement body；change validation SHALL 只接受 `ADDED`、`MODIFIED`、`REMOVED` Requirement sections。

#### Scenario: No deltas found in change
- **WHEN** 校验一个解析到零个 contract 与 graph operations 的 change
- **THEN** SHALL 显示 `No deltas found` 类错误
- **AND** SHALL 说明 change Specs 只支持 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`
- **AND** SHALL 建议运行 `xirang diff --change <id>` 调试 effective changes

#### Scenario: Missing required sections
- **WHEN** 缺少必需章节
- **THEN** SHALL 给出期望标题与最小 canonical skeleton
- **AND** SHALL 指向当前 artifact instructions

#### Scenario: Missing requirement descriptive text
- **WHEN** requirement 标题后、scenario 前缺少描述正文
- **THEN** SHALL 报错说明必须先有包含 `SHALL` 或 `MUST` 的 normative body
- **AND** SHALL 给出合规结构示例

#### Scenario: Section-type 与主 spec header 不一致
- **WHEN** MODIFIED 或 REMOVED 引用的 requirement header 在 Formal Spec 中不存在
- **OR** ADDED header 已存在
- **THEN** SHALL emit ERROR 并建议对应的合法 operation section

#### Scenario: RENAMED section 被拒绝
- **WHEN** change Spec 包含 `## RENAMED Requirements`
- **THEN** SHALL emit breaking syntax ERROR
- **AND** SHALL 指引使用旧 Requirement 的 REMOVED 与新 Requirement 的 ADDED

#### Scenario: 跨行 body 上的 SHALL 或 MUST 被识别
- **WHEN** requirement 首条正文行不含 normative keyword，但后续非 fence body 行包含 whole-word `SHALL` 或 `MUST`
- **THEN** SHALL NOT 仅因 keyword 不在首行报告 ERROR

#### Scenario: 仅 metadata 行承载 MUST 正文
- **WHEN** requirement body 在 scenario 之前仅包含形如 `**Constraint**: The system MUST ...` 的 metadata 行
- **THEN** validation SHALL 将该行视为 requirement body

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
- Source file path (`.xirang/changes/{id}/proposal.md`, `.../specs/{cap}/spec.md`)
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
- **THEN** print "Next steps" with 2-3 targeted bullets and suggest `xirang change show <id> --json --deltas-only`

### Requirement: Top-level validate command

The CLI SHALL provide a top-level `validate` command for validating changes and specs with flexible selection options.

#### Scenario: Interactive validation selection

- **WHEN** executing `xirang validate` without arguments
- **THEN** prompt user to select what to validate (all, changes, specs, or specific item)
- **AND** perform validation based on selection
- **AND** display results with appropriate formatting

#### Scenario: Non-interactive environments do not prompt

- **GIVEN** stdin is not a TTY or `--no-interactive` is provided or environment variable `XIRANG_INTERACTIVE=0`
- **WHEN** executing `xirang validate` without arguments
- **THEN** do not prompt interactively
- **AND** print a helpful hint listing available commands/flags and exit with code 1

#### Scenario: Direct item validation

- **WHEN** executing `xirang validate <item-name>`
- **THEN** automatically detect if item is a change or spec
- **AND** validate the specified item
- **AND** display validation results

### Requirement: Bulk and filtered validation

The validate command SHALL support flags for bulk validation (--all) and filtered validation by type (--changes, --specs).

#### Scenario: Validate everything

- **WHEN** executing `xirang validate --all`
- **THEN** validate all changes in .xirang/changes/ (excluding archive)
- **AND** validate all specs in .xirang/specs/
- **AND** display a summary showing passed/failed items
- **AND** exit with code 1 if any validation fails

#### Scenario: Scope of bulk validation

- **WHEN** validating with `--all` or `--changes`
- **THEN** include all change proposals under `.xirang/changes/`
- **AND** exclude the `.xirang/changes/archive/` directory

- **WHEN** validating with `--specs`
- **THEN** include all specs that have a `spec.md` under `.xirang/specs/<id>/spec.md`

#### Scenario: Validate all changes

- **WHEN** executing `xirang validate --changes`
- **THEN** validate all changes in .xirang/changes/ (excluding archive)
- **AND** display results for each change
- **AND** show summary statistics

#### Scenario: Validate all specs

- **WHEN** executing `xirang validate --specs`
- **THEN** validate all specs in .xirang/specs/
- **AND** display results for each spec
- **AND** show summary statistics

### Requirement: Validation options and progress indication

The validate command SHALL support standard validation options (--strict, --json) and display progress during bulk operations.

#### Scenario: Strict validation

- **WHEN** executing `xirang validate --all --strict`
- **THEN** apply strict validation to all items
- **AND** treat warnings as errors
- **AND** fail if any item has warnings or errors

#### Scenario: JSON output

- **WHEN** executing `xirang validate --all --json`
- **THEN** output validation results as JSON
- **AND** include detailed issues for each item
- **AND** include summary statistics

#### Scenario: JSON output schema for bulk validation

- **WHEN** executing `xirang validate --all --json` (or `--changes` / `--specs`)
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

- **WHEN** executing `xirang validate <item-name>`
- **THEN** if `<item-name>` uniquely matches a change or a spec, validate that item

#### Scenario: Ambiguity between change and spec names

- **GIVEN** `<item-name>` exists both as a change and as a spec
- **WHEN** executing `xirang validate <item-name>`
- **THEN** print an ambiguity error explaining both matches
- **AND** suggest passing `--type change` or `--type spec`, or using `xirang change validate` / `xirang spec validate`
- **AND** exit with code 1 without performing validation

#### Scenario: Unknown item name

- **WHEN** the `<item-name>` matches neither a change nor a spec
- **THEN** print a not-found error
- **AND** show nearest-match suggestions when available
- **AND** exit with code 1

#### Scenario: Explicit type override

- **WHEN** executing `xirang validate --type change <item>`
- **THEN** treat `<item>` as a change ID and validate it (skipping auto-detection)

- **WHEN** executing `xirang validate --type spec <item>`
- **THEN** treat `<item>` as a spec ID and validate it (skipping auto-detection)

### Requirement: Interactivity controls

- The CLI SHALL respect `--no-interactive` to disable prompts.
- The CLI SHALL respect `XIRANG_INTERACTIVE=0` to disable prompts globally.
- Interactive prompts SHALL only be shown when stdin is a TTY and interactivity is not disabled.

#### Scenario: Disabling prompts via flags or environment

- **WHEN** `xirang validate` is executed with `--no-interactive` or with environment `XIRANG_INTERACTIVE=0`
- **THEN** the CLI SHALL not display interactive prompts
- **AND** SHALL print non-interactive hints or chosen outputs as appropriate

### Requirement: Parser SHALL handle cross-platform line endings
The markdown parser SHALL correctly identify sections regardless of line ending format (LF, CRLF, CR).

#### Scenario: Required sections parsed with CRLF line endings
- **GIVEN** a change proposal markdown saved with CRLF line endings
- **AND** the document contains `## Why` and `## What Changes`
- **WHEN** running `xirang validate <change-id>`
- **THEN** validation SHALL recognize the sections and NOT raise parsing errors

### Requirement: Scenario operation label 校验

`xirang validate` SHALL 拒绝 change-local 与 formal Specs 中任何 `#### Scenario:` title 上的 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` operation label。Scenario operations SHALL 仅存在于 derived Diff IR projections。

#### Scenario: Change-local label 报错
- **WHEN** change Spec 包含 `#### Scenario: [MODIFIED] 调整行为`
- **THEN** SHALL report location-aware ERROR
- **AND** SHALL 指引删除 label 并保留完整 target Scenario body

#### Scenario: ADDED label 报错
- **WHEN**任意 Spec 包含 `#### Scenario: [ADDED] 新行为`
- **THEN** SHALL report ERROR
- **AND** SHALL 说明 Scenario 新增由 Formal/Target 比较派生

#### Scenario: REMOVED label block 报错
- **WHEN** change Spec 包含 `#### Scenario: [REMOVED] 旧行为`
- **THEN** SHALL report ERROR
- **AND** SHALL 指引从完整 `MODIFIED Requirement` 中省略该 Scenario

#### Scenario: Unknown bracket prefix
- **WHEN** Scenario title 以 `[UPDATED]` 等 operation-like prefix 开头
- **THEN** SHALL report unsupported Scenario operation metadata ERROR

#### Scenario: Canonical unlabeled Scenario 通过
- **WHEN** Requirement 包含无 label 的 canonical `#### Scenario: 场景`
- **THEN** label validation SHALL 通过

### Requirement: Formal spec scenario label 清洁度

`xirang validate --specs` 及 spec content validation SHALL 拒绝 formal specs 中的 scenario operation labels。Formal specs SHALL 包含无需 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` operation metadata 的 canonical `#### Scenario:` 标题。

#### Scenario: Formal spec 含 ADDED label 报错
- **WHEN** `.xirang/specs/<capability>/spec.md` 包含 `#### Scenario: [ADDED] 场景`
- **THEN** `xirang validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Formal spec 含 MODIFIED label 报错
- **WHEN** `.xirang/specs/<capability>/spec.md` 包含 `#### Scenario: [MODIFIED] 场景`
- **THEN** `xirang validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Formal spec 含 REMOVED label 报错
- **WHEN** `.xirang/specs/<capability>/spec.md` 包含 `#### Scenario: [REMOVED] 场景`
- **THEN** `xirang validate --specs` SHALL 为该 spec 报告 ERROR

#### Scenario: Clean formal scenario 通过清洁度校验
- **WHEN** `.xirang/specs/<capability>/spec.md` 包含 `#### Scenario: 场景`
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

Validate command SHALL 支持显式 change 与 `specs`、`architecture-delta` artifact scopes；full change validation SHALL 额外 materialize target 并输出 concise effective preview。

#### Scenario: Explicit change 默认完整 validation
- **WHEN** 执行 `xirang validate --change my-change`
- **THEN** SHALL 联合验证 contract 与 graph operations
- **AND** SHALL 输出 validation status、diagnostics、summary 与 concise effective entries

#### Scenario: Specs artifact scope
- **WHEN** 执行 `xirang validate --change my-change --artifacts specs`
- **THEN** SHALL 只验证 change-local delta Specs
- **AND** SHALL NOT 报 Architecture delta diagnostics

#### Scenario: Architecture artifact scope
- **WHEN** 执行 `xirang validate --change my-change --artifacts architecture-delta`
- **THEN** SHALL 只验证 Architecture delta syntax、operations 与 target graph integrity
- **AND** SHALL NOT 报 contract content errors

#### Scenario: Unknown artifact scope
- **WHEN** scope 不是 `specs` 或 `architecture-delta`
- **THEN** SHALL 输出支持值并以非零状态退出

#### Scenario: Missing active change
- **WHEN** selected change 不存在或已 archived
- **THEN** SHALL 输出 unknown active change error
- **AND** SHALL NOT validation unrelated changes

### Requirement: Requirement reader SHALL be fence-aware for body and scenarios

Change delta 与 formal spec 校验 SHALL 使用同一套 fence-aware requirement 读取规则：跳过 fenced code block（含 fence 行本身）内的内容；requirement body 提取与 scenario 计数均不得把 fence 内文本当作真实正文或真实 scenario。在 CRLF/LF/CR 行尾规范化后，上述规则 SHALL 保持一致。

#### Scenario: Fence 内 Scenario 不计入 surviving

- **WHEN** change delta 中某个 ADDED 或 MODIFIED requirement 在 fenced code block 内包含 `#### Scenario:` 示例，且 fence 外没有任何 unlabeled、`[ADDED]` 或 `[MODIFIED]` scenario
- **THEN** `xirang validate <change> --type change` SHALL report ERROR，要求至少一个 surviving scenario
- **AND** SHALL NOT 将 fence 内 scenario 计为 surviving

#### Scenario: Fence 后的正文用于 keyword 检测

- **WHEN** requirement header 之后首先出现 fenced code block，随后在非 fence 行出现含 whole-word `SHALL` 或 `MUST` 的正文，再出现真实 `#### Scenario:`
- **THEN** validation SHALL 接受该 requirement 的 keyword 检测
- **AND** SHALL NOT 将 fence 打开行当作 requirement text

#### Scenario: CRLF 下 fence 与跨行 body 行为一致

- **WHEN** 同一 change delta 使用 CRLF 行尾，且包含跨行 `SHALL`/`MUST` 与 fenced scenario 示例
- **THEN** validation 结果 SHALL 与等价 LF 内容一致（keyword 与 surviving scenario 判定相同）

### Requirement: Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels

Surviving Scenario 计数 SHALL 仅考虑 fenced code block 外的 canonical unlabeled `#### Scenario:` headings。每个 ADDED 或 MODIFIED Requirement SHALL 至少包含一个 surviving Scenario；operation-like labels 已由 syntax validation 拒绝。

#### Scenario: 非 fence Scenario 与 fence 示例并存
- **WHEN** requirement 同时包含 fence 外 canonical Scenario 与 fence 内 Scenario 示例
- **THEN** surviving count SHALL 至少为 1
- **AND** fence 内示例 SHALL NOT 计数

#### Scenario: 只有 fence 内示例
- **WHEN** requirement 只在 fenced code block 内包含 `#### Scenario:`
- **THEN** SHALL report 至少需要一个 surviving Scenario 的 ERROR

#### Scenario: CRLF 行尾
- **WHEN**同一内容使用 CRLF 行尾
- **THEN** fence 与 surviving count 结果 SHALL 与 LF 内容一致

### Requirement: Change validation effective preview

`xirang validate --change <name>` SHALL 在 validation 结果中呈现该 change 实际表达的 concise semantic changes。Preview SHALL 来自与 `xirang diff` 相同的 compiler 与 Diff IR。

#### Scenario: Human-readable concise preview
- **WHEN** change 可 materialize
- **THEN** output SHALL 显示 Specs 与 Architecture 的 ADDED、MODIFIED、REMOVED summary
- **AND** SHALL 列出主要 Requirement、Scenario、element 与 relationship operations

#### Scenario: JSON concise preview
- **WHEN** 用户运行 `xirang validate --change my-change --json`
- **THEN** JSON SHALL 包含 valid、diagnostics、summary 与 concise effective entries
- **AND** SHALL NOT 输出完整 before/after field payload

#### Scenario: Preview 不写 review artifact
- **WHEN** 用户运行 validate
- **THEN** command SHALL NOT 创建或更新 `effective-change.md`
- **AND** stale 或缺失 review artifact SHALL 最多产生 non-blocking guidance

