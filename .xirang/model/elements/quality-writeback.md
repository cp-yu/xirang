---
entity: element-declaration
identity: quality-writeback
kind: element
parent: quality
title: Quality Writeback
definition: Quality Writeback 是 Quality opinion 与 Seal 声明的唯一持久化能力，负责单一 Git-tracked JSON record 的原子更新、CAS revision 与 Review/Opt 历史保留。它不修改 `tasks.md`、不保存代码快照或测试输出、不维护额外 log/evidence 文件；修正与任务状态由主 Agent 处理。
---

## Specification

### Section: CRITICAL 不一致触发回写

当 Review 发现 CRITICAL 级 spec-code 不一致时，Reviewer SHALL 在 Review opinion 中报告证据与 Required Corrections。Quality/CLI SHALL NOT 自动取消 `tasks.md` 中的 `[x]` 或写入修正清单；主 Agent 判断问题后自行处理代码、任务状态及所需制品更新，并为修正提交新 Git commit 后重新 Review。

### Section: Required Corrections 清单生成

Review opinion SHALL 保留结构化 findings 与 Required Corrections，供主 Agent 判断和处理。主 Agent SHALL 决定是否将修正加入或更新 `tasks.md`，并负责修复及其提交；Quality/CLI 不根据 severity 推断任务是否完成，不自动追加 task checkbox，也不替代主 Agent 判断 `artifact_fix` 或 `code_fix` 的实际处理。

### Section: 状态快照持久化

每个 Change SHALL 只使用 `.xirang/changes/<change>/.quality.json` 作为 Quality 持久记录。新记录包含 `schemaVersion: 4`、Change identity、单调递增的 `revision`、含 `reviewKind` 而不含 `reviewId`/`scope` 的 Review opinions、Opt disposition/opinions 及当前 Seal。CLI SHALL 使用 Node.js `path` API 定位同目录文件，以临时文件与原子 rename 写入，按 expected revision 执行 CAS；版本冲突拒绝写入且保留原文件。原有 v3 文件遇到不兼容时保留字节并返回明确诊断，不转换为 v4。

### Section: append-only 历史日志

Review opinion 与已记录的 Opt opinions SHALL 按追加历史保留在同一 JSON 中，不另建 append-only event log 或重复全量 snapshot。新 opinion 不得覆盖既有 opinion；当前 Seal 是单一声明字段。提交旧 revision 时 SHALL 拒绝更新，不得静默覆盖并发写入。

### Section: 回写内容遵循 runtime projection

系统 SHALL 在为 `tasks.md` 生成回写内容时使用从项目配置编译的 runtime projection 决定自然语言散文。

- **回写散文遵循投影语言策略**

  - 系统追加或刷新 `## Required Corrections` 内容
  - runtime projection 定义了 prose language policy
  - 回写描述 SHALL 遵循该策略
  - task checkbox、`### Section:` header、Section 引用与其他 canonical token SHALL 保持不变

### Section: 质量记录的受控轮换

新协议 SHALL NOT 提供旧记录迁移或轮换：不读取、不转换、不重写、不删除 `.quality-state.json`、`.quality-log.jsonl`、`.quality-lock`、`.quality-evidence/` 或历史归档。既有 `.gitignore` 规则与旧文件保持原样。没有 `.quality.json` 时按新协议记录缺失处理，不把旧 Review、Opt、测试或 Checkpoint 记录解释为新协议证据。

### Section: 必要持久化边界

Quality JSON SHALL 仅持久化 Review opinions 历史、Opt opinions 或明确不做 Opt 的理由，以及当前 Seal 声明和 CAS revision。Review 与 Opt opinions 按其确认的 Git commit 关联；Seal 记录主 Agent 声明的 commit、`canRun`、`testsExpectedToPass`、测试范围和 assessment。CLI 不持久化委托进度、代码 manifest、恢复位置、测试输出、重复状态快照或泛化操作日志；代码修改、失败尝试和恢复由 Git 承载。
