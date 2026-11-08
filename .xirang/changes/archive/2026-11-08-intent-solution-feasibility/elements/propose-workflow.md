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

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`，忠实文档化已确认设计。它 MAY 在既定范围内自主处理细枝末节、组织案例和目标及修正表达或推导错误，不得自主大量扩写实质设计；新发现的重大决策点 SHALL 先说明选项与推荐，再一次一问等待用户确认。小范围内容与方案调整可在 Propose 内交互确认并维护记录；需要重新设计实验判断可行性或大幅重做设计时返回 Explore；完成披露不能代替决策前确认。没有有效 Summary 时 SHALL 通过项目证据与针对性提问建立对问题、期望结果、约束、影响范围、方案和验证方式的理解，不把用户给出的路线视为完整意图；解决影响目标的缺口及未决 Source decisions 后判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

- **复用 Design Summary**
  - conversation 包含已确认的 Design Summary
  - Propose 说明正在复用，向 proposal、Delta、design 与 tasks 分发适用的确认内容
  - SHALL NOT 重新执行字符数或 detail score 判断

- **Semantic readiness 不完整**
  - 任一 readiness 项缺失或 Source decision 未决
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
