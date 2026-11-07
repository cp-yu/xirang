---
entity: element-declaration
identity: quality-aware-instructions
kind: element
parent: deterministic-operations
title: Quality-aware Instructions
definition: Quality-aware Instructions 定义 `xirang instructions apply` 集成 Quality 状态检查的行为：判定 Change 的 `state` 时同时考虑 task checkbox 完成度与新 Quality JSON 中的 Review、Opt disposition 和 Seal，产生 `needs_review`、`needs_optimize`、`all_done` 与 `ready`。它只描述指令投影的状态判定，不定义 Quality 命令入口或诊断。
---

## Specification

### Section: Apply 指令依据 quality 状态判定 state

`instructions apply` SHALL 联合任务完成度与 v4 Quality 门禁给出状态。全部目标完成但缺少通过的 `full-change` Review，或任一 `reviewKind` 的失败意见未由该类别不同 commit 上的 PASS 解决时为 `needs_review`；完整 Review 通过但缺少 Opt disposition 或 Seal 时为 `needs_optimize`；完整 Review、适用的其他 Review、Opt disposition 和绑定现存 Git commit 的 Seal 均满足时为 `all_done`。无 apply.tracks 且 required artifacts 完整时保留 `ready`。不比较 HEAD/工作区与 Seal commit，也不因 Opt 代码变化自动要求完整 Review；旧 v3 或更早的 Quality 格式不推定为已通过并报告具体诊断。
