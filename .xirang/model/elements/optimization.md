---
entity: element-declaration
identity: optimization
kind: element
parent: quality
title: Optimization
definition: Optimization 是 Quality 中在通过的独立基线 Review 后、由主 Agent 可选委托的实现改进活动，独立承载优化机会发现、分组合并、实施、局部验证和结果交付。Opt 在委托范围内执行并保持 Expected Semantic Model 与项目行为；主 Agent 决定是否进行 Opt、后续投入及最终风险判断，Reviewer 提供主 Agent 选择的独立审查。代码历史和恢复由 Git 承载，不由 Quality checkpoint 复制。
---

## Specification

### Section: 读取完整优化依据

Optimization SHALL 读取 Semantic Model、Change、当前代码、通过的基线 Review 及其 commit、Opt 委托范围、项目证据与既有 Opt opinions。后续委托基于累计改动后的实际状态，不能假定基线 Review 审查过这些改动；代码恢复依据从 Git history 取得，不依赖 Quality checkpoint。

### Section: 优先消除不必要复杂度

Optimization SHALL 优先识别可删除或简化的不必要复杂度。

- **正确实现含冗余复杂度**

  - 删除或简化可保持行为
  - Optimization 将其作为候选事项

### Section: 优化必须存在的工作

Optimization SHALL 评估必要工作是否可通过更合适的算法、数据结构、控制流、I/O 或资源使用提高效率。

- **必要工作存在可证明低效**

  - 更合适实现可保持目标语义
  - Optimization 可形成候选事项

### Section: 只选择有价值且可验证的事项

选中的优化 SHALL 有可说明的实际收益、充分代码证据、目标语义与行为保持约束、相称的成本风险和可执行验证。Opt 与主 Agent 根据证据及委托约束判断价值，不要求固定收益等级或 CLI 门槛。用户给出的收益、范围、预算与停止条件 SHALL 遵守；没有新证据或实质进展的重复尝试 SHALL 停止，并在交付 Opt opinion 时记录处理结果。

- **收益无法证明**：仅重排代码而无效果或收益依赖未知条件时，不声称已证明收益；获得适用证据后再判断是否实施。

### Section: 语义变化形成新 Change

改变 Expected Semantic Model 的建议 SHALL 形成新的 Change。

- **建议会改变目标行为**

  - 候选方向不是行为保持优化
  - 它不在当前 Optimization 中实施

### Section: 无需继续优化时完成

通过基线 Review 后，是否进行 Opt 由主 Agent 按实际情况决定；Opt 是可选阶段。执行 Opt 时，可交回具体问题修正或委托 fresh-context Opt 探索新机会，不要求主 Agent 先找到新方向。Opt opinion SHALL 汇总实际保留改动、收益和影响、行为保持依据、局部测试结果、失败/放弃事项及后续建议；不要求固定轮数或证明不存在更多机会。Opt 后是否追加 Review、是否扩大测试由主 Agent 按实际风险决定。适用的测试仍 SHALL 在执行过程中运行；Quality JSON 不保存测试输出或判断其客观成功。Seal 仅在基线 Review 通过且主 Agent 已明确记录 Opt opinion 或不做 Opt 的理由后成立。

### Section: 在独立审查基线后开始

实际 Opt 修改 SHALL 只在优化前实现通过独立基线 Review 后开始。若主 Agent 不执行 Opt，Seal 前 SHALL 记录 `not_performed` 处置与简短理由，不伪造 Opt opinion。后续 Opt 可基于累计优化状态，不单因前轮改动要求新的基线 Review。

### Section: 委托内执行与局部验证

Opt SHALL 在主 Agent 确定的委托范围内自主发现、分组、合并、修改、补充并运行局部测试，可连续处理多个优化而不逐项交回。缺少对应测试时 SHALL 在修改实现前补充；低风险也必须测试。主 Agent 保留最终验证范围判断，Opt 自测不是独立 Review。建议仍有效时无需重新 fresh 扫描、排序；假设失效、建议不适用或有新机会时按需重评。

### Section: 按证据处理问题

Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可依据 Git 中实际代码状态局部修正或撤销；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，可继续委托 Opt 或由主 Agent 处理，修正必须形成不同 Git commit，并经针对问题及影响的独立 Review 后才能作为已处理。无关历史问题记录在 Opt opinion 并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。无法确认恢复可靠时停止并交回主 Agent，不以未解决状态完成。

### Section: 按实际影响确定文件范围

Opt SHALL 以当前 Change 目标和证据化影响为界，按需追踪调用、依赖及其他调用方，允许必要的实现/测试文件新增、删除或移动，不固定为原文件列表或一层依赖。

- **公共辅助函数**：优化当前 Change 新增的查询逻辑需要调整其调用的公共辅助函数，可以纳入，但必须检查其他调用方；顺便重构另一套无关查询系统超出本次委托。
