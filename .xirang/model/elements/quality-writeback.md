---
entity: element-declaration
identity: quality-writeback
kind: element
parent: quality
title: Quality Writeback
definition: Quality Writeback 定义 quality 如何把关键诊断结果回写到 change 工件，以及如何持久化自己的记录：CRITICAL 级不一致触发 `tasks.md` 任务 unmark、Required Corrections 清单生成、状态快照 `.quality-state.json` 的覆盖写与 append-only 历史日志 `.quality-log.jsonl` 的追加。它不定义状态判定规则（属于 Quality Freshness），也不定义命令面的输出形状。
---

## Specification

### Section: CRITICAL 不一致触发回写

当 Review 发现 CRITICAL 级的 spec-code 不一致时，系统 SHALL 把 `tasks.md` 中对应任务的完成标记从 `[x]` 回退为 `[ ]`，并生成修正事项清单。

- **CRITICAL 不一致触发 task unmark**

  - Review 检测到某个 Section 语义在代码中完全缺失实现
  - 该 Section 对应的 task 在 `tasks.md` 中标记为 `[x]`
  - 系统 SHALL 将该 task 的 `[x]` 替换为 `[ ]`
  - SHALL 在修正事项清单中记录 unmark 原因和对应的 Section

- **WARNING 级别不触发自动回写**

  - Review 检测到 WARNING 级别的不一致
  - 系统 SHALL 仅在报告中列出 WARNING
  - SHALL NOT 自动修改 `tasks.md`

- **无 CRITICAL 不一致时不修改 tasks.md**

  - Review 完成且无 CRITICAL 级 issue
  - 系统 SHALL NOT 修改 `tasks.md`

### Section: Required Corrections 清单生成

系统 SHALL 在发现问题时生成结构化的修正事项清单，区分 `code_fix` 和 `artifact_fix` 两类。

- **生成 code_fix 类型修正事项**

  - Review 发现代码未实现某个 Section 语义
  - 修正事项清单 SHALL 包含一条 `code_fix` 条目
  - 条目 SHALL 包含对应的 Section 名称、缺失的具体行为与建议修改的文件

- **生成 artifact_fix 类型修正事项**

  - Review 发现代码实现与 spec 或 design 描述不一致，但代码实现是合理的
  - 修正事项清单 SHALL 包含一条 `artifact_fix` 条目
  - 条目 SHALL 包含需要更新的 artifact 与当前描述与实际行为的差异

- **Required Corrections 清单追加到 tasks.md**

  - 修正事项清单非空
  - 系统 SHALL 在 `tasks.md` 末尾追加 `## Required Corrections` section
  - 每条修正事项 SHALL 以 `- [ ]` checkbox 格式列出并标注类型

### Section: 状态快照持久化

系统 SHALL 把当前状态持久化到 change 目录下的 `.quality-state.json`，供 gate 与 archive 读取。快照 SHALL 包含 record 类型、时间戳、`result`、`issues`、`tasksFileHash`、验证上下文，以及已收口时的 Optimization 终态与 `stopReason`。

- **持久化当前状态**

  - `xirang quality review` 或 `xirang quality optimize` 成功
  - 系统 SHALL 写入 `.xirang/changes/<name>/.quality-state.json`
  - 写入 SHALL 使用跨平台路径处理（`path.join`、`path.resolve`）
  - SHALL NOT 硬编码路径分隔符

- **记录验证上下文**

  - 系统写入状态快照
  - 验证上下文 SHALL 包含 `contractVersion`、`evidenceFiles`、`evidenceFingerprint`、`evidenceFingerprintEntries`、`gitHeadCommit` 与时间戳
  - 指纹 entries 的排序 JSON 哈希 SHALL 等于整体 `evidenceFingerprint`

### Section: append-only 历史日志

系统 SHALL 把每次记录追加到 change 目录下的 `.quality-log.jsonl`，每行一条 JSON 记录。日志 SHALL 只追加，既有行 MUST NOT 被改写或删除；轮次判断、失败方向与被否决方向的记录 SHALL 在日志中保留。

- **每次记录追加一行**

  - `review` 或 `optimize` 成功写入记录
  - 系统 SHALL 向 `.quality-log.jsonl` 追加一行 JSON
  - 既有行 SHALL 保持不变

- **快照与日志的写入顺序**

  - 系统持久化一轮记录
  - SHALL 先追加历史日志，再写入状态快照
  - 两者不一致时后续状态判定 SHALL 按保守方向判为 `dirty`

- **失败方向可从日志恢复**

  - 需要判断某方向是否已被否决或其失败原因
  - 系统 SHALL 能从日志中的历史记录得到该结论

### Section: 回写内容遵循 runtime projection

系统 SHALL 在为 `tasks.md` 生成回写内容时使用从项目配置编译的 runtime projection 决定自然语言散文。

- **回写散文遵循投影语言策略**

  - 系统追加或刷新 `## Required Corrections` 内容
  - runtime projection 定义了 prose language policy
  - 回写描述 SHALL 遵循该策略
  - task checkbox、`### Section:` header、Section 引用与其他 canonical token SHALL 保持不变
