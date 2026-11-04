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

`instructions apply` SHALL 联合任务完成度与 Quality JSON 门槛给出状态。全部 tasks 完成但缺少通过的独立基线 Review，或存在尚未由不同 commit 上的通过 Review 解决的失败 Review 时为 `needs_review`。基线 Review 通过但缺少 Opt disposition 或 Seal 时为 `needs_optimize`；此状态指向共享 Quality guidance，由主 Agent 决定执行 Opt 或记录不做 Opt，再 Seal。只有基线 Review、Opt disposition 和绑定现存 Git commit 的 Seal 完整时为 `all_done`。无 apply.tracks 且 required artifacts 完整时保留 `ready` 行为。

Quality state SHALL NOT 比较 HEAD、工作区文件集合或内容与 Seal commit，也不因 Opt 代码变化自动要求整 Change Review。缺少新 JSON 时不得从旧记录推断通过；不支持旧格式时说明具体诊断且不报 `all_done`。明确的新 Review 请求需要新的基线 Review；历史 PASS 不满足该请求。
