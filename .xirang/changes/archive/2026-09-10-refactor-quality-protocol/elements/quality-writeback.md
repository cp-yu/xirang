---
operation: ADDED
entity: element-declaration
identity: quality-writeback
kind: element
parent: quality
title: Quality Writeback
definition: Quality Writeback 定义 quality 如何把关键诊断结果回写到 change 工件，以及如何持久化自己的记录：CRITICAL 级不一致触发 `tasks.md` 任务 unmark、Required Corrections 清单生成、状态快照 `.quality-state.json` 的覆盖写与 append-only 历史日志 `.quality-log.jsonl` 的追加。它不定义状态判定规则（属于 Quality Freshness），也不定义命令面的输出形状。
---

## ADDED Requirements

### Requirement: CRITICAL 不一致触发回写
当 Review 发现 CRITICAL 级的 spec-code 不一致时，系统 SHALL 把 `tasks.md` 中对应任务的完成标记从 `[x]` 回退为 `[ ]`，并生成修正事项清单。

#### Scenario: CRITICAL 不一致触发 task unmark
- **WHEN** Review 检测到某个 requirement 在代码中完全缺失实现
- **AND** 该 requirement 对应的 task 在 `tasks.md` 中标记为 `[x]`
- **THEN** 系统 SHALL 将该 task 的 `[x]` 替换为 `[ ]`
- **AND** SHALL 在修正事项清单中记录 unmark 原因和对应的 requirement

#### Scenario: WARNING 级别不触发自动回写
- **WHEN** Review 检测到 WARNING 级别的不一致
- **THEN** 系统 SHALL 仅在报告中列出 WARNING
- **AND** SHALL NOT 自动修改 `tasks.md`

#### Scenario: 无 CRITICAL 不一致时不修改 tasks.md
- **WHEN** Review 完成且无 CRITICAL 级 issue
- **THEN** 系统 SHALL NOT 修改 `tasks.md`

### Requirement: Required Corrections 清单生成
系统 SHALL 在发现问题时生成结构化的修正事项清单，区分 `code_fix` 和 `artifact_fix` 两类。

#### Scenario: 生成 code_fix 类型修正事项
- **WHEN** Review 发现代码未实现某个 requirement
- **THEN** 修正事项清单 SHALL 包含一条 `code_fix` 条目
- **AND** 条目 SHALL 包含对应的 requirement 名称、缺失的具体行为与建议修改的文件

#### Scenario: 生成 artifact_fix 类型修正事项
- **WHEN** Review 发现代码实现与 spec 或 design 描述不一致，但代码实现是合理的
- **THEN** 修正事项清单 SHALL 包含一条 `artifact_fix` 条目
- **AND** 条目 SHALL 包含需要更新的 artifact 与当前描述与实际行为的差异

#### Scenario: Required Corrections 清单追加到 tasks.md
- **WHEN** 修正事项清单非空
- **THEN** 系统 SHALL 在 `tasks.md` 末尾追加 `## Required Corrections` section
- **AND** 每条修正事项 SHALL 以 `- [ ]` checkbox 格式列出并标注类型

### Requirement: 状态快照持久化
系统 SHALL 把当前状态持久化到 change 目录下的 `.quality-state.json`，供 gate 与 archive 读取。快照 SHALL 包含 record 类型、时间戳、`result`、`issues`、`tasksFileHash`、验证上下文，以及已收口时的 Optimization 终态与 `stopReason`。

#### Scenario: 持久化当前状态
- **WHEN** `xirang quality review` 或 `xirang quality optimize` 成功
- **THEN** 系统 SHALL 写入 `.xirang/changes/<name>/.quality-state.json`
- **AND** 写入 SHALL 使用跨平台路径处理（`path.join`、`path.resolve`）
- **AND** SHALL NOT 硬编码路径分隔符

#### Scenario: 记录验证上下文
- **WHEN** 系统写入状态快照
- **THEN** 验证上下文 SHALL 包含 `contractVersion`、`evidenceFiles`、`evidenceFingerprint`、`evidenceFingerprintEntries`、`gitHeadCommit` 与时间戳
- **AND** 指纹 entries 的排序 JSON 哈希 SHALL 等于整体 `evidenceFingerprint`

### Requirement: append-only 历史日志
系统 SHALL 把每次记录追加到 change 目录下的 `.quality-log.jsonl`，每行一条 JSON 记录。日志 SHALL 只追加，既有行 MUST NOT 被改写或删除；轮次判断、失败方向与被否决方向的记录 SHALL 在日志中保留。

#### Scenario: 每次记录追加一行
- **WHEN** `review` 或 `optimize` 成功写入记录
- **THEN** 系统 SHALL 向 `.quality-log.jsonl` 追加一行 JSON
- **AND** 既有行 SHALL 保持不变

#### Scenario: 快照与日志的写入顺序
- **WHEN** 系统持久化一轮记录
- **THEN** SHALL 先追加历史日志，再写入状态快照
- **AND** 两者不一致时后续状态判定 SHALL 按保守方向判为 `dirty`

#### Scenario: 失败方向可从日志恢复
- **WHEN** 需要判断某方向是否已被否决或其失败原因
- **THEN** 系统 SHALL 能从日志中的历史记录得到该结论

### Requirement: 回写内容遵循 runtime projection
系统 SHALL 在为 `tasks.md` 生成回写内容时使用从项目配置编译的 runtime projection 决定自然语言散文。

#### Scenario: 回写散文遵循投影语言策略
- **WHEN** 系统追加或刷新 `## Required Corrections` 内容
- **AND** runtime projection 定义了 prose language policy
- **THEN** 回写描述 SHALL 遵循该策略
- **AND** task checkbox、section header、requirement 引用与其他 canonical token SHALL 保持不变
