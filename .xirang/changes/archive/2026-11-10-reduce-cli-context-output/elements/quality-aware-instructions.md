---
operation: MODIFIED
entity: element-declaration
identity: quality-aware-instructions
kind: element
parent: deterministic-operations
title: "Quality-aware Instructions"
definition: "Quality-aware Instructions 是 Change 推进状态与 Quality 门禁的集成职责。它在 status 查询中联合目标完成度与 Review、Opt disposition、Seal 判定推进状态，供工作流选择后续活动；它不定义 Quality 命令、意见保存或独立质量评估，也不把制品完成等同于实现已验证。"
---

## ADDED Sections

### Section: 联合目标与 Quality 判定推进状态

status --change SHALL 联合目标完成度与 v4 Quality 门禁给出 state。全部目标完成但缺少通过的 full-change Review，或任一 reviewKind 的失败意见未由该类别不同 commit 上的 PASS 解决时为 needs_review；完整 Review 通过但缺少 Opt disposition 或 Seal 时为 needs_optimize；完整 Review、适用的其他 Review、Opt disposition 和绑定现存 Git commit 的 Seal 均满足时为 all_done。无 apply.tracks 且 required artifacts 完整时保留 ready。

该判断 SHALL 不比较 HEAD/工作区与 Seal commit，也不因 Opt 代码变化自动要求完整 Review；旧 v3 或更早的 Quality 格式 SHALL 不推定为已通过，并报告具体诊断。Change status SHALL 只携带必要概况，Quality 的具体当前结论和缺口由 quality status 查询。

## REMOVED Sections

### Section: Apply 指令依据 quality 状态判定 state
