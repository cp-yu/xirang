---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: "Propose Workflow"
definition: "Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。"
---

## MODIFIED Sections

### Section: Propose smart routing

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`，忠实文档化已确认设计。它 MAY 依据已确认意图和建模规则完成局部模型组织，并在既定范围内自主处理细枝末节、组织案例和目标及修正表达或推导错误，不得自主大量扩写实质设计；新发现的重大决策点 SHALL 先说明选项与推荐，再一次一问等待用户确认。小范围内容与方案调整可在 Propose 内交互确认并维护记录；需要重新设计实验判断可行性或大幅重做设计时返回 Explore；完成披露不能代替决策前确认。没有有效 Summary 时 SHALL 通过项目证据与针对性提问建立对问题、期望结果、约束、影响范围、方案和验证方式的理解，不把用户给出的路线视为完整意图；解决影响目标且需要用户裁决的缺口及未决 Source decisions 后判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

Propose SHALL 复用已确认决定及仍适用的证据，在推荐方案或认定方案就绪前，独立判断方案是否可行、能否在约束下达成预期结果。SHALL 主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，并向用户表达自己的判断和关键理由。

- **复用 Design Summary**
  - conversation 包含已确认的 Design Summary
  - Propose 说明正在复用，向 proposal、Delta、design 与 tasks 分发适用的确认内容
  - SHALL NOT 重新执行字符数或 detail score 判断

- **Semantic readiness 不完整**
  - 必要设计依据缺失或影响目标的实质 Source decision 未决
  - Propose 在对话中列出具体缺口；孤立决策可就地询问，大幅设计工作建议 Explore
  - readiness 通过或被明确 override 前 SHALL NOT 创建 change 或写入制品
  - 新决策确认前 SHALL NOT 将依赖它的内容写成确定方案

- **用户显式 override**
  - Propose 已报告 readiness 缺口且用户明确要求直接生成
  - Propose 接受 override 但 SHALL NOT 猜测影响 behavior 或 architecture 的关键决策；必要确认无法取得时报告阻碍

- **无 Summary 的最低就绪条件**
  - 问题、期望结果、约束、影响范围、方案与验证方式均明确且不存在影响 Source 的未决决策
  - Propose 说明就绪并继续，不因涉及多个 subsystem 就强制返回 Explore

- **测试安排分发**
  - 已确认测试策略含过时测试原因或一次性验证
  - 过时原因写入 design；tasks 只记录对应目标与要验证的结果，包括删除后的缺失结果，不预定测试文件、动作或一次性命令
  - Apply 在实施时判断具体测试更新、删除与一次性验证，不制造多余持久测试

- **Routing decision 不污染 artifacts**
  - Propose 报告 readiness、缺失项或 override
  - 这些运行过程信息 SHALL 只保留在对话，不写入 Change 制品

- **已有充分上下文**：复用已明确内容，继续成文，不为完成流程重复提问。

可按已确认意图与框架规则完成的局部组织 SHALL NOT 作为独立的就绪阻塞；真正待裁决的承诺、范围或重大方案选择仍阻塞相关写入，显式 override 不提供缺失决策。

### Section: 仅在 Propose 形成结构目标时应用拆分指导

Propose Workflow SHALL 仅在形成或重组 hierarchy 时读取 normalized decomposition 指向的完整方法，并在框架约束内组织结构；已经确认的记录或 Summary 结构决定 SHALL 复用，不静默重做。局部组织与实质选择的处理 SHALL 使用本阶段的统一决策规则，不因记录部分确认、答案不唯一或 BF 逐层推进自动暂停。

- **记录只确认部分结构**：保留已确认字段，对其余部分依据当前模型、意图和配置方法继续组织；需要改变确认决定或作出实质选择时，先请求用户裁决。
- **Contract-only**：没有 hierarchy 形成或重组需求时，不加载分解方法，不因存在默认方法制造结构变化。
- **指导不可读**：停止相关结构形成，不替换为另一个方法或从实现目录猜测目标。
- **方法存在语义疑点**：按本阶段决策规则取证和判断；需要用户裁决时等待，不能以方法内的笼统逐层确认要求替代该判断。

### Section: Propose 在架构 delta 前 reconcile architecture scope

Contracts 与 `design.md` 完成后，propose SHALL 重新读取 proposal graph scope、design decisions、formal Semantic Model 与 implementation evidence，再生成结构目标。Workflow SHALL 在完整 Target Semantic Model 上联合检查 Element Declarations、Relationships 与 Element Contracts。

- **Design 改变 graph scope**

  - 已确认决定或允许自主完成的局部模型组织使结构影响及相关 Contract 归属与 proposal 初稿不同；写入 design 本身不构成确认
  - SHALL 更新 proposal 中受影响的源范围，并同步调和 Delta 与 Plan
  - exact target graph SHALL 写入 Semantic Delta

- **无 graph change**

  - Architecture Source 为 `None`
  - SHALL 省略结构目标
  - SHALL NOT 从 contract change 发明 graph operations

- **指导生成 Semantic Delta**

  - change 影响 Architecture semantics
  - skill SHALL 指导在对应分区创建顶层 ADDED、MODIFIED、REMOVED sections
  - SHALL 要求 MODIFIED entity 使用完整 target payload

- **Binding 指向同一 delta 新 element**

  - Contract 的宿主 Element 只存在于同一 delta 中新增
  - propose SHALL 在 Target Semantic Model 上联合验证
  - MUST NOT 将其误报为 formal model missing element

- **Graph no-op**

  - Architecture Source 为 None
  - SHALL 省略 `metamodel/`、`relationships/` 与 `views/` delta 单元
  - SHALL NOT 创建空 model 单元
