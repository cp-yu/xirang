---
entity: element-declaration
identity: "propose"
kind: "element"
parent: "intent-first-path"
title: "Propose"
definition: "Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。"
---

## MODIFIED Sections

### Section: 查缺补漏与决策确认

Propose SHALL 思考并与用户交互，组织实际 Change 草稿，提出想法并讨论成文时发现的问题。

Propose SHALL 复用已确认决定及仍适用的证据，在推荐方案或认定方案就绪前，独立判断方案是否可行、能否在约束下达成预期结果。SHALL 主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，并向用户表达自己的判断和关键理由。MAY 自主处理既定范围和方案内的细枝末节、案例组织与表达或推导修正；不得以合理补充为名自主大量扩写或替用户形成实质设计。补出的分支、默认值、错误结果及限制 SHALL 对照确认来源，不能静默改变承诺。

改变已确认承诺、扩大范围或涉及重大业务及架构权衡时，先说明缺口、选项与推荐理由，一次一问等待确认。小范围内容或方案调整可在 Propose 内讨论确认并继续，不因任何设计讨论或记录修订都切回 Explore。需要设计实验重新判断可行性、重选方向或大幅重做设计时，SHALL 返回 Explore 完成实验与设计调整，再继续 Propose。

用户说“细枝末节的内容点的话，我觉得可以放权”时，Agent 可处理局部细节，但不能自行写很多实质内容；允许交互不等于无需确认。直接要求 Propose、不追问或 override 就绪建议都不提供缺失决策，无法确认时报告阻碍。
