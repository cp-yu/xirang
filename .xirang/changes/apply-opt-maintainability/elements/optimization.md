---
operation: MODIFIED
entity: element-declaration
identity: optimization
kind: element
parent: quality
title: Optimization
definition: Optimization 是 Quality 中保持目标语义与行为的实现改进活动，独立承载只读机会发现、授权组实施、局部验证和结果交付。它从独立基线 Review 后的干净上下文检查开始，协调者选择实施范围、后续投入和验证范围，Reviewer 评估累计保留改动。代码历史与恢复由 Git 承载，不由 Quality 复制。
---

## MODIFIED Sections

### Section: 无需继续优化时完成

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

Opt opinion SHALL 按模式报告机会、实际保留结果、验证、失败或放弃事项及继续建议，不要求证明不存在更多机会。适用测试在实施过程中运行，Quality 不保存原始测试输出或判断其客观成功。

### Section: 在独立审查基线后开始

Optimization SHALL 在实现通过独立 full-change Review 后默认启动干净上下文的只读检查；协调者不以自己的无需优化判断替代这次独立发现。实施只在明确授权后开始。后续 Opt 可基于累计优化状态，不强制每批取得新基线 Review。实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

### Section: 委托内执行与局部验证

inspection SHALL 独立只读评估当前实现，动态选择可读性、可维护性、认知与结构复杂度、性能、资源、健壮性、封装、类型安全、扩展性等适用维度，允许评估未列出的相关维度。返回具有具体代码证据的机会、预期收益、成本、风险和验证方法，或说明无需继续。结构信号本身不能证明修改价值，程序体积小不能作为无需维护质量评估的依据。

implementation SHALL 仅实施获授权的一组相关改进并验证行为，保持目标语义和项目行为；可在组内连续修改、合并与局部验证后统一交付，不要求每个函数修改后交回。范围外机会只报告、不自行实施。既有发现和尝试是结合当前实现重新评估的证据，不是必须保留的结论；没有改动是合法结果，不为证明任务价值制造工作。

实施前 SHALL 检查对应测试并补足缺失保护，实施后运行局部验证，低风险不免除测试。协调者判断最终验证范围，自测不代替独立 Review。

### Section: 优先消除不必要复杂度

Optimization SHALL 优先识别可删除或简化的不必要复杂度。

- **正确实现含冗余复杂度**

  - 删除或简化可保持行为
  - Optimization 将其作为候选事项

抽象增加、合并或删除 SHALL 按对职责、控制流和修改局部性的具体收益判断；函数、文件、层数和体积本身不决定优劣。

### Section: 读取完整优化依据

Optimization SHALL 读取 Semantic Model、Change、当前代码、通过的基线 Review 及其 commit、Opt 委托范围、项目证据与既有 Opt opinions。后续委托基于累计改动后的实际状态，不能假定基线 Review 审查过这些改动；代码恢复依据从 Git history 取得，不依赖 Quality checkpoint。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。
