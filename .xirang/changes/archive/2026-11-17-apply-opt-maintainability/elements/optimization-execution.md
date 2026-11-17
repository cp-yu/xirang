---
operation: MODIFIED
entity: element-declaration
identity: optimization-execution
kind: element
parent: quality
title: Optimization Execution
definition: Optimization Execution 是 Quality 的 Opt 检查、授权实施、交付与验证收口执行协议，独立承载基线、批次推进、Git 恢复及 Seal 衔接。它允许组内连续实施与局部验证，由协调者提交结果并安排累计独立审查；Quality 不保存执行进度或代码 checkpoint。报告内容由 Optimizer Findings 定义，机械关联由 Quality CLI Gate 定义。
---

## MODIFIED Sections

### Section: 最优性检验执行

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

### Section: 主 Agent 决定最终验证

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

协调者 SHALL 判断适用测试范围、运行所需验证，处理已确认缺陷与 supplemental Review；Opt 局部验证不能替代独立审查。只有基线与适用后续 Review、真实 Opt 处置和 commit 关联均满足时才记录 Seal 的 canRun、testsExpectedToPass、testScope 与 assessment；CLI 不执行测试或评分自然语言依据。

### Section: Git 管理优化代码状态与恢复

代码修改、提交历史与恢复 SHALL 由 Git 承载，Quality 不保存 baseline/intermediate/successful checkpoint、代码 manifest 或恢复位置。协调者 SHALL 核对并提交保留的交付结果；按恢复需要保存中间状态，不要求每个方向 commit。失败优化 SHALL 依据 Git 中的实际代码状态局部修正或撤销并验证，保留可靠工作；合并问题无法定位时 MAY 拆分或使用更合适方法。恢复无法确认时停止并交回主 Agent，不以未解决状态完成。
