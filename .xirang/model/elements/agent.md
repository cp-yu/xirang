---
entity: element-declaration
identity: agent
kind: element
parent: agents
title: Agent
definition: Agent 是与用户交互、并端到端编排 Realization 的默认执行身份。它可写入项目与 Change 制品，消费 CLI 的查询与投影，在需要时委托 Internal Agents；不得替代用户作出需明确授权的决策，也不得自行重做 CLI 已提供的确定性操作。
---

## Specification

### Section: 写入获授权制品

Agent SHALL 在授权范围内写入项目与 Change 制品。

- **Apply 获准修改项目**
  - Change 已进入 Implementation
  - Agent 写入实现所需项目文件

### Section: 消费 CLI 查询与投影

Agent SHALL 消费 CLI 提供的查询与投影结果推进编排。

- **需要模型上下文**
  - Agent 需要确定性模型信息
  - 它使用 CLI 查询结果

### Section: 按需委托 Internal Agents

Agent SHALL 按角色委托 Internal Agents：独立正确性评估交给 Reviewer，优化执行交给 Opt，实验交给 Experimenter；主 Agent 不以自身判断或 Opt 自测代替必需的独立 Review。

### Section: 不替代用户授权

Agent SHALL NOT 替代用户作出需要明确授权的决策。

- **Candidate 等待确认**
  - CLI 返回有效 review digest
  - Agent 请求用户确认而不自行 promotion

### Section: 不重做确定性操作

Agent SHALL NOT 自行重做 CLI 已提供的确定性操作。

- **CLI 提供原子转换**
  - Realization 需要 promotion、sync 或 archive
  - Agent 调用 CLI 而不手工模拟转换

### Section: 负责优化范围与最终验证

主 Agent SHALL 在必需 Review 前确认受托实现已提交、适用测试已运行通过，委派 Reviewer 审查 checkout 的当前 HEAD；可以按非冲突质量维度并行委派，并在取得全部有效结论后合并为一条 Review opinion。主 Agent SHALL 确定 Opt 委托范围、处理越界和契约问题，依据实际代码、证据、收益、成本与风险判断继续投入；优化前实现须通过 `full-change` Review。主 Agent根据累计优化改动、行为保持与测试覆盖决定最终所需测试和可选 `incremental` Review；全量测试不自动要求。已确认的当前 Change 原有正确性缺陷 SHALL 修复并对缺陷及影响执行 `supplemental` Review。必需的验证全部通过、证据适用、交付完整且无未解决的正确性或恢复问题后才可保存最终成功状态并完成；旧 Review 不证明后续改动，后续代码变化重新判断受影响验证。

主 Agent SHALL 在收尾告知放弃优化的事项、原因及处理结果；中断更换写入者前确认旧 Opt 停止，无法确认归属或恢复可靠时不继续完成。Reviewer 输入或 HEAD 变化导致无法形成意见时修正委派、重新审查，不把该错误当作实现 FAIL。
