---
entity: element-declaration
identity: apply-quality-integration
kind: element
parent: apply
title: Apply Quality Integration
definition: Apply Quality Integration 是 Apply 对独立基线 Review、Opt 检查与授权实施、累计独立 Review、Git 恢复和 Seal 的集成协议，独立承载角色分工、共享 references 及 Quality 诊断消费。协调者负责提交、委派、修正和任务状态；不定义自动 task writeback、Quality checkpoint 或逐方向台账。
---

## Specification

### Section: Review 记录先写回再持久化

`xirang-apply-change` SHALL 在委派前提交待审实现并运行本次受托工作所需测试，向 fresh-context Reviewer 提供 `changeName`、checkout 的绝对 `projectRoot`、`reviewKind` 与选定的质量维度。主 Agent SHALL 收齐所有受托维度的有效结果，合并为一条包含 `reviewKind`、所审查 `commit`、`result`、`summary`、`findings` 的 v5 opinion 后调用 `xirang quality review` 持久化；任一必需维度失败或未解决时不能合并为 PASS。输入或委派错误、HEAD 变化不写入 FAIL opinion，而由主 Agent 修正并重新委派；真实失败的修正由主 Agent 处理任务与代码并形成新提交，Quality/CLI 不自动回写 `tasks.md`。

### Section: 主 agent 和 subagent 角色分工

Apply SHALL 由主 Agent负责提交、适用测试、质量维度分工、完整结果等待、后续投入和最终验证范围；Reviewer 独立判断已提交状态的目标实现及测试充分性，保持只读但不设专属工具白名单或硬只读权限。Opt 在 inspection 只读发现机会，在 implementation 负责授权组内改进及局部测试，缺少对应测试时先补后改；协调者负责结果提交。主 Agent 和 Opt 不替代必需独立 Review；Pi Reviewer 在后台运行以使用环境中可用的扩展工具，Opt 的调用方式不因此改变。

### Section: Apply 读取 Quality 诊断信息

当新 Quality JSON 存在时，Apply SHALL 读取 Review opinions、Opt disposition/opinions、Seal 与具体诊断，将其作为修复或收口上下文。失败 Review 的 findings 交由主 Agent 判断并安排修正；主 Agent 可更新对应 task 与 Required Corrections，形成修正 commit 后重新 Review。Quality/CLI SHALL NOT 自动 unmark task 或追加 task section。没有新 Quality JSON 时，Apply SHALL 按新协议取得基线 Review，不得从旧 snapshot/log/evidence 推断已通过。

### Section: Apply reference 拥有 checkpoint 编排

Apply 的共享优化 reference SHALL 定义修改前可恢复基线、Opt 按需中间保存、主 Agent 所需验证通过后最终 successful checkpoint；Reviewer 不创建、恢复 checkpoint 或写入项目。局部失败优先按证据修正或撤销并保留有效工作，必要时恢复可确认基线；无法确认恢复则停止。代码、commits/checkpoints、当前及历史记录保持可用，不强制逐方向 commit 或整批回滚。

### Section: 共享恢复 reference 编排重验

Apply SHALL 使用共享 Git recovery reference 执行重验；Archive 的默认交付门禁若拒绝 Seal，Archive SHALL 报告诊断并交回 Apply，不自行运行恢复或重验协议。用户要求活动 Change 从头重新验证时，主 Agent 在旧流程停止后用当前 checkout 的 HEAD 重新委派 `full-change` Review，不传目标 commit 或新 `reviewId`，也不重置 v5 Quality 历史。输入无效、HEAD 在审查期间变化或错误的完整 Review 委派需要重新委派，不能以伪造的失败 opinion 占据门禁；不支持的旧 v4 和更早质量文件保留原样并报诊断，待用户决定受影响 Change 的处理。

### Section: 恢复交付的验证证据

恢复交付 SHALL 以可复现的 Git commit 和项目测试/检查结果支持主 Agent 判断，包括局部撤销保留有效工作及失败历史可从 Git 读取。Quality JSON 只记录 Review/Opt opinions、Opt disposition 和 Seal，不记录测试输出、manifest 或恢复快照。持久测试验证 CLI commit 关联、JSON 原子 CAS 与门禁；路径使用 Node.js path API，并覆盖 Windows 与 POSIX。

### Section: 以委托交付推进优化

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

基线缺陷修复 SHALL 形成新提交并接受 supplemental Review。每次必需 Review 前提交实现并确认所需测试已通过；CLI 不运行测试或比较工作区。

### Section: 记录失败尝试并告知

Opt 可选尝试失败时 SHALL 依据 Git 状态修正或撤销，保留可靠结果，并在交付 opinion 中记录尝试、原因、处理与遗留问题，最终由主 Agent 告知用户。未完成的中断工作不视为 Opt opinion；当前 Change 正确性缺陷由主 Agent 安排修复并针对性独立 Review。
