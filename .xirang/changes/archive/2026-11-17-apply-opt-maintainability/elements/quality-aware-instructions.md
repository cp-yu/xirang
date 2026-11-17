---
entity: element-declaration
identity: quality-aware-instructions
kind: element
parent: deterministic-operations
title: Quality-aware Instructions
definition: Quality-aware Instructions 是 Change 推进状态与 Quality 门禁的集成职责。它在 status 查询中联合目标完成度与 Review、Opt disposition、Seal 判定推进状态，供工作流选择后续活动；它不定义 Quality 命令、意见保存或独立质量评估，也不把制品完成等同于实现已验证。
---

## MODIFIED Sections

### Section: 联合目标与 Quality 判定推进状态

status --change SHALL 联合目标完成度与 v5 Quality 门禁给出 state。全部目标完成但缺少通过的 full-change、存在未解决的同类 FAIL，或累计变更 Opt 缺少其后的且提交关联有效的 full-change/incremental PASS 时为 needs_review；Review 满足但缺少 Opt 处置或 Seal 时为 needs_optimize；完整门禁及 Seal commit 均有效时为 all_done。无 apply.tracks 且 required artifacts 完整时保留 ready。

判断 SHALL 复用 Quality 门禁，不比较 HEAD/工作区，不把只读 Opt 当新增审查义务，也不要求所有优化都重做完整 Review。v4 及更旧格式明确诊断且不推定通过；Change status 只带必要概况，详情由 quality status 提供。
