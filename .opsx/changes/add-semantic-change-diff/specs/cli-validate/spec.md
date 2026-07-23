---
element: project.root/domain.cli/cap.cli.change-operations
---

## MODIFIED Requirements

### Requirement: Validation SHALL provide actionable remediation steps

校验输出 SHALL 为每个错误提供可执行修复指引，包括期望结构、示例标题与建议命令。Requirement 正文校验 SHALL 基于完整 requirement body；change validation SHALL 只接受 `ADDED`、`MODIFIED`、`REMOVED` Requirement sections。

#### Scenario: No deltas found in change
- **WHEN** 校验一个解析到零个 contract 与 graph operations 的 change
- **THEN** SHALL 显示 `No deltas found` 类错误
- **AND** SHALL 说明 change Specs 只支持 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`
- **AND** SHALL 建议运行 `opsx diff --change <id>` 调试 effective changes

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

### Requirement: Scenario operation label 校验

`opsx validate` SHALL 拒绝 change-local 与 formal Specs 中任何 `#### Scenario:` title 上的 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` operation label。Scenario operations SHALL 仅存在于 derived Diff IR projections。

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

### Requirement: Artifact-scoped change validation

Validate command SHALL 支持显式 change 与 `specs`、`architecture-delta` artifact scopes；full change validation SHALL 额外 materialize target 并输出 concise effective preview。

#### Scenario: Explicit change 默认完整 validation
- **WHEN** 执行 `opsx validate --change my-change`
- **THEN** SHALL 联合验证 contract 与 graph operations
- **AND** SHALL 输出 validation status、diagnostics、summary 与 concise effective entries

#### Scenario: Specs artifact scope
- **WHEN** 执行 `opsx validate --change my-change --artifacts specs`
- **THEN** SHALL 只验证 change-local delta Specs
- **AND** SHALL NOT 报 Architecture delta diagnostics

#### Scenario: Architecture artifact scope
- **WHEN** 执行 `opsx validate --change my-change --artifacts architecture-delta`
- **THEN** SHALL 只验证 Architecture delta syntax、operations 与 target graph integrity
- **AND** SHALL NOT 报 contract content errors

#### Scenario: Unknown artifact scope
- **WHEN** scope 不是 `specs` 或 `architecture-delta`
- **THEN** SHALL 输出支持值并以非零状态退出

#### Scenario: Missing active change
- **WHEN** selected change 不存在或已 archived
- **THEN** SHALL 输出 unknown active change error
- **AND** SHALL NOT validation unrelated changes

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

## ADDED Requirements

### Requirement: Change validation effective preview

`opsx validate --change <name>` SHALL 在 validation 结果中呈现该 change 实际表达的 concise semantic changes。Preview SHALL 来自与 `opsx diff` 相同的 compiler 与 Diff IR。

#### Scenario: Human-readable concise preview
- **WHEN** change 可 materialize
- **THEN** output SHALL 显示 Specs 与 Architecture 的 ADDED、MODIFIED、REMOVED summary
- **AND** SHALL 列出主要 Requirement、Scenario、element 与 relationship operations

#### Scenario: JSON concise preview
- **WHEN** 用户运行 `opsx validate --change my-change --json`
- **THEN** JSON SHALL 包含 valid、diagnostics、summary 与 concise effective entries
- **AND** SHALL NOT 输出完整 before/after field payload

#### Scenario: Preview 不写 review artifact
- **WHEN** 用户运行 validate
- **THEN** command SHALL NOT 创建或更新 `effective-change.md`
- **AND** stale 或缺失 review artifact SHALL 最多产生 non-blocking guidance
