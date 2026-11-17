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

每个 Change SHALL 仅以 .xirang/changes/<change>/.quality.json 持久化 Quality。记录包含 schemaVersion: 5、Change identity、单调递增 revision、Review opinions、Opt 处置/意见及当前 Seal；每条 Review/Opt opinion 有正整数 recordedRevision，等于写入它的成功事务 revision，不大于记录 revision。每次成功写入全局 revision 增加一，失败不增加；CLI 在同一锁、CAS、原子事务内分配并保存序号，调用方不传意见序号。多条 Opt 在同事务共享 recordedRevision，按数组保留顺序；跨事务先后用 revision，不新增时间戳或独立计数器。

CLI SHALL 校验意见序号与记录 revision 的一致性及各历史数组的顺序，不接受缺失、非法或越界序号。使用 Node.js path API 定位、同目录临时文件与原子 rename 写入；CAS 冲突保留原文件。Windows、macOS、Linux 同样保留历史和事务原子性。v4 及更早格式保持原字节并明确拒绝，不转换为 v5。

### Section: append-only 历史日志

Review opinion 与已记录的 Opt opinions SHALL 按追加历史保留在同一 JSON 中，不另建 append-only event log 或重复全量 snapshot。新 opinion 不得覆盖既有 opinion；当前 Seal 是单一声明字段。提交旧 revision 时 SHALL 拒绝更新，不得静默覆盖并发写入。

已交付 Opt 历史 SHALL NOT 通过改写 not_performed 清除；无变更交付追加真实意见，也保留此前累计审查义务。
