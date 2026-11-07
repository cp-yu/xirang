---
entity: element-declaration
identity: quality-writeback
kind: element
parent: quality
title: Quality Writeback
definition: Quality Writeback 是 Quality opinion 与 Seal 声明的唯一持久化能力，负责单一 Git-tracked JSON record 的原子更新、CAS revision 与 Review/Opt 历史保留。它不修改 `tasks.md`、不保存代码快照或测试输出、不维护额外 log/evidence 文件；修正与任务状态由主 Agent 处理。
---

## MODIFIED Sections

### Section: 状态快照持久化

每个 Change SHALL 只使用 `.xirang/changes/<change>/.quality.json` 作为 Quality 持久记录。新记录包含 `schemaVersion: 4`、Change identity、单调递增的 `revision`、含 `reviewKind` 而不含 `reviewId`/`scope` 的 Review opinions、Opt disposition/opinions 及当前 Seal。CLI SHALL 使用 Node.js `path` API 定位同目录文件，以临时文件与原子 rename 写入，按 expected revision 执行 CAS；版本冲突拒绝写入且保留原文件。原有 v3 文件遇到不兼容时保留字节并返回明确诊断，不转换为 v4。
