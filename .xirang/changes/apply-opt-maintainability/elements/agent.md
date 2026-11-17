---
entity: element-declaration
identity: agent
kind: element
parent: agents
title: Agent
definition: Agent 是与用户交互、并端到端编排 Realization 的默认执行身份。它可写入项目与 Change 制品，消费 CLI 的查询与投影，在需要时委托 Internal Agents；不得替代用户作出需明确授权的决策，也不得自行重做 CLI 已提供的确定性操作。
---

## MODIFIED Sections

### Section: 负责优化范围与最终验证

主 Agent SHALL 在必需 Review 前确认受托实现已提交、适用测试已运行通过，委派 Reviewer 审查 checkout 的当前 HEAD；可以按非冲突质量维度并行委派，并在取得全部有效结论后合并为一条 Review opinion。主 Agent SHALL 确定 Opt 委托范围、处理越界和契约问题，依据实际代码、证据、收益、成本与风险判断继续投入；优化前实现须通过 `full-change` Review。主 Agent SHALL 根据累计优化改动、行为保持与测试覆盖决定最终所需测试；保留改动必须独立 Review，按影响选择 full-change 或 incremental，全量测试不自动要求。已确认的当前 Change 原有正确性缺陷 SHALL 修复并对缺陷及影响执行 `supplemental` Review。必需的验证全部通过、证据适用、交付完整且无未解决的正确性或恢复问题后才可保存最终成功状态并完成；旧 Review 不证明后续改动，后续代码变化重新判断受影响验证。

主 Agent SHALL 在收尾告知放弃优化的事项、原因及处理结果；中断更换写入者前确认旧 Opt 停止，无法确认归属或恢复可靠时不继续完成。Reviewer 输入或 HEAD 变化导致无法形成意见时修正委派、重新审查，不把该错误当作实现 FAIL。

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。
