---
entity: "element-declaration"
identity: "quality-aware-instructions"
kind: "element"
parent: "deterministic-operations"
title: "Quality-aware Instructions"
definition: "Quality-aware Instructions 定义 `xirang instructions apply` 集成 quality 状态检查的行为：判定 change 的 `state` 时同时考虑 task checkbox 完成度与 quality 记录状态，产生 `needs_review`、`needs_optimize`、`all_done` 与 `ready`。它只描述指令投影的状态判定，不定义 quality 命令本身的入口条件与诊断。"
---

## MODIFIED Sections

### Section: Apply 指令依据 quality 状态判定 state

instructions apply SHALL 联合任务完成度与质量证据缺口给出状态。全部 tasks 完成但缺少必需基线 Review 时为 needs_review；已有基线而优化未交付、最终验证待定或过期时为 needs_optimize，并指向共享优化/恢复 reference，不因为优化代码变化自动要求整 Change Review。只有当前完整完成条件通过时为 all_done。无 apply.tracks 且 required artifacts 完整时保留 ready 行为。

完成条件 SHALL 关联优化前通过的独立基线 Review、已完整交付的委托或配置禁用/用户拒绝的明确跳过、实际成功测试、主 Agent 的最终验证范围与理由、所有已声明必需的增量 Review，以及当前 Change 基线缺陷修复后必需的针对性独立 Review；所需验证全部通过且证据适用当前状态、无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。未追加 Review 的风险判断不记为 Reviewer PASS，基线 PASS 不声称覆盖优化后代码。

恢复可靠性不明或不支持旧格式时 SHALL 说明具体阻塞，不报 all_done，也不引导删除历史或自动迁移。明确新验证请求需要新基线时为 needs_review，历史 PASS 不满足该请求。
