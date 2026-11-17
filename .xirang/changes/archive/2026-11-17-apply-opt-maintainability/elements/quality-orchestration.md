---
operation: MODIFIED
entity: element-declaration
identity: quality-orchestration
kind: element
parent: quality
title: Quality Orchestration
definition: Quality Orchestration 是 Quality 的 Review、Opt 检查与授权实施及 Seal 提示协议，独立承载协调者的范围、等待、后续投入、Git 恢复、提交与最终声明编排。它区分实现、独立审查和确定性记录责任，供 Apply 与 Archive 共用；不替 Reviewer 作结论，不让 CLI 自主选择优化工作。
---

## MODIFIED Sections

### Section: Git recovery 与 Seal 顺序

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

失败 Review 的修正 SHALL 形成新 Git commit 并针对相应类别复审，基线缺陷必须 supplemental Review。Seal 绑定符合意见顺序与提交关联的受审 commit；CLI 不比较 HEAD/工作区或执行测试，Archive 只检查有效记录的 Seal commit 存在。

### Section: Coordinator 角色声明

Quality 提示词 SHALL 区分主 Agent、Optimizer、Reviewer 与 CLI：主 Agent 在委派前确保待审实现已提交且受托工作所需测试已运行通过，选择 `reviewKind` 与非冲突质量维度、处理输入错误和修正、等待并合并 Reviewer 结论、决定 Opt 和最终 Seal；Opt 按 inspection 只读检查或 implementation 授权组内修改与局部测试；Reviewer 自主从受托 checkout 的 HEAD 独立只读审查，判断测试及其他证据是否充分而不必重复运行测试；CLI 只负责 v5 opinion、Opt disposition、Seal 的确定性记录和门禁。主 Agent 和 Opt 的判断不能代替必需独立 Review。

面向当前执行者的提示词 SHALL 使用直接祈使或 you，不用 The main Agent 含混自指；内部角色指向另一协调角色时保留明确角色区别，不机械全局替换。
