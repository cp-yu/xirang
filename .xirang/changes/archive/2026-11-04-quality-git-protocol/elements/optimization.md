---
operation: MODIFIED
entity: element-declaration
identity: optimization
kind: element
parent: quality
title: Optimization
definition: Optimization 是 Quality 中在通过的独立基线 Review 后、由主 Agent 可选委托的实现改进活动，独立承载优化机会发现、分组合并、实施、局部验证和结果交付。Opt 在委托范围内执行并保持 Expected Semantic Model 与项目行为；主 Agent 决定是否进行 Opt、后续投入及最终风险判断，Reviewer 提供主 Agent 选择的独立审查。代码历史和恢复由 Git 承载，不由 Quality checkpoint 复制。
---

## MODIFIED Sections

### Section: 读取完整优化依据
Optimization SHALL 读取 Semantic Model、Change、当前代码、通过的基线 Review 及其 commit、Opt 委托范围、项目证据与既有 Opt opinions。后续委托基于累计改动后的实际状态，不能假定基线 Review 审查过这些改动；代码恢复依据从 Git history 取得，不依赖 Quality checkpoint。

### Section: 只选择有价值且可验证的事项
选中的优化 SHALL 有可说明的实际收益、充分代码证据、目标语义与行为保持约束、相称的成本风险和可执行验证。Opt 与主 Agent 根据证据及委托约束判断价值，不要求固定收益等级或 CLI 门槛。用户给出的收益、范围、预算与停止条件 SHALL 遵守；没有新证据或实质进展的重复尝试 SHALL 停止，并在交付 Opt opinion 时记录处理结果。

- **收益无法证明**：仅重排代码而无效果或收益依赖未知条件时，不声称已证明收益；获得适用证据后再判断是否实施。

### Section: 无需继续优化时完成
通过基线 Review 后，是否进行 Opt 由主 Agent 按实际情况决定；Opt 是可选阶段。执行 Opt 时，可交回具体问题修正或委托 fresh-context Opt 探索新机会，不要求主 Agent 先找到新方向。Opt opinion SHALL 汇总实际保留改动、收益和影响、行为保持依据、局部测试结果、失败/放弃事项及后续建议；不要求固定轮数或证明不存在更多机会。Opt 后是否追加 Review、是否扩大测试由主 Agent 按实际风险决定。适用的测试仍 SHALL 在执行过程中运行；Quality JSON 不保存测试输出或判断其客观成功。Seal 仅在基线 Review 通过且主 Agent 已明确记录 Opt opinion 或不做 Opt 的理由后成立。

### Section: 在独立审查基线后开始
实际 Opt 修改 SHALL 只在优化前实现通过独立基线 Review 后开始。若主 Agent 不执行 Opt，Seal 前 SHALL 记录 `not_performed` 处置与简短理由，不伪造 Opt opinion。后续 Opt 可基于累计优化状态，不单因前轮改动要求新的基线 Review。

### Section: 按证据处理问题
Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可依据 Git 中实际代码状态局部修正或撤销；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，可继续委托 Opt 或由主 Agent 处理，修正必须形成不同 Git commit，并经针对问题及影响的独立 Review 后才能作为已处理。无关历史问题记录在 Opt opinion 并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。无法确认恢复可靠时停止并交回主 Agent，不以未解决状态完成。
