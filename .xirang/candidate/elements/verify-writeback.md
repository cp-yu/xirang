---
entity: element-declaration
identity: verify-writeback
kind: capability
parent: verify
title: Verify Writeback
definition: Verify Writeback 定义 verify 如何将关键诊断结果回写到 change 工件：CRITICAL 级别 spec-code 不一致触发 `tasks.md` 任务 unmark、Required Corrections 清单生成、验证结果持久化到 `.verify-result.json` 与 freshness 判定上下文记录。
---

## Requirements

### Requirement: Verify Write-back 能力

当 verify 发现 CRITICAL 级别的 spec-code 不一致时，系统 SHALL 自动将 `tasks.md` 中对应任务的完成标记从 `[x]` 回退为 `[ ]`，并生成修正事项清单。

#### Scenario: CRITICAL 不一致触发 task unmark

- **WHEN** verify 检测到某个 requirement 在代码中完全缺失实现
- **AND** 该 requirement 对应的 task 在 `tasks.md` 中标记为 `[x]`
- **THEN** 系统 SHALL 将该 task 的 `[x]` 替换为 `[ ]`
- **AND** 在修正事项清单中记录 unmark 原因和对应的 requirement

#### Scenario: WARNING 级别不触发自动 write-back

- **WHEN** verify 检测到 WARNING 级别的不一致（如实现偏离 spec 意图但功能存在）
- **THEN** 系统 SHALL 仅在报告中列出 WARNING
- **AND** SHALL NOT 自动修改 `tasks.md`

#### Scenario: 无 CRITICAL 不一致时不修改 tasks.md

- **WHEN** verify 完成且无 CRITICAL 级别 issue
- **THEN** 系统 SHALL NOT 修改 `tasks.md`
- **AND** 验证结果标记为 `PASS` 或 `PASS_WITH_WARNINGS`

### Requirement: Required Corrections 清单生成

系统 SHALL 在 verify 发现问题时生成结构化的修正事项清单，区分 `code_fix` 和 `artifact_fix` 两类。

#### Scenario: 生成 code_fix 类型修正事项

- **WHEN** verify 发现代码未实现某个 requirement
- **THEN** 修正事项清单 SHALL 包含一条 `code_fix` 条目
- **AND** 条目包含：对应的 requirement 名称、缺失的具体行为、建议修改的文件

#### Scenario: 生成 artifact_fix 类型修正事项

- **WHEN** verify 发现代码实现与 spec/design 描述不一致，但代码实现是合理的
- **THEN** 修正事项清单 SHALL 包含一条 `artifact_fix` 条目
- **AND** 条目包含：需要更新的 artifact（spec 或 design）、当前描述与实际行为的差异

#### Scenario: Required Corrections 清单追加到 tasks.md

- **WHEN** 修正事项清单非空
- **THEN** 系统 SHALL 在 `tasks.md` 末尾追加 `## Required Corrections` section
- **AND** 每条修正事项以 `- [ ]` checkbox 格式列出，标注类型（`[code_fix]` 或 `[artifact_fix]`）

### Requirement: 验证结果持久化

系统 SHALL 将 verify 结果持久化到 change 目录下的 `.verify-result.json`，供 archive 检查，并显式记录 freshness 判定所需的验证上下文。

#### Scenario: 持久化验证结果

- **WHEN** verify 完成
- **THEN** 系统 SHALL 在 `.xirang/changes/<name>/` 下写入 `.verify-result.json`
- **AND** 文件包含 `timestamp`、`result`、`issues`、`tasksFileHash` 与 `verificationContext` 对象
- **AND** 持久化逻辑由 verify CLI 工具处理，reviewer subagent 的 writeBackPlan 通过其 Output Contract 定义

#### Scenario: 记录 verification context

- **WHEN** verify 写入 `.verify-result.json`
- **THEN** 系统 SHALL 在 `verificationContext` 对象中记录 `contractVersion`、`executionMode`、`evidenceFiles`、`evidenceFingerprint`、`gitHeadCommit` 与 `gitDiffSummary`
- **AND** SHALL 使用跨平台路径处理（`path.join`, `path.resolve`）

#### Scenario: Windows 下的 evidence file 路径处理

- **WHEN** verification context 持久化 evidence file 路径
- **THEN** 系统 SHALL 使用跨平台可比较的路径表示
- **AND** archive 在比较 freshness 时 SHALL NOT 因 `\\` 与 `/` 的差异误判结果过期或新鲜
#### Scenario: 跨平台路径处理
- **WHEN** 写入或读取 `.verify-result.json`
- **THEN** 系统 SHALL 使用 `path.join()` 构建文件路径
- **AND** SHALL NOT 硬编码路径分隔符
### Requirement: Verify write-back SHALL consume runtime projection
When verify writes Required Corrections content back to `tasks.md`, the system SHALL use runtime projection compiled from project config for natural-language prose decisions.

#### Scenario: Required Corrections prose follows projected language policy
- **WHEN** verify appends or refreshes `## Required Corrections` content
- **AND** runtime projection defines a prose-language policy
- **THEN** Required Corrections descriptions SHALL follow that policy
- **AND** task checkboxes、section headers、requirement references 与其他 canonical tokens SHALL 保持不变
