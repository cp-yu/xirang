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

### Section: 按用户意图修改项目配置

Agent SHALL 将用户明确提出的长期配置要求或上下文明确的配置修改写入当前项目对应配置项，不重复请求同一内容的保存授权；仅本次要求不得升级为长期设置，范围不明时先澄清。模型自行提出或推断的习惯未经用户确认不得持久化。

修改前 SHALL 按 common 入口读取项目根 reference `.xirang/references/xirang-configuration-edit.md`，先查字段定义与说明，优先更新已有项，不另存同义个人偏好。没有对应能力时说明限制，不造无效键。修改 SHALL 保留无关用户内容，不通过直接改 configVersion 跳过迁移；配置修改须符合当前角色授权，Reviewer 保持只读。

修改后 SHALL 重新读取适用有效配置并核对，完成必要配置校验，简短报告字段、前后值、影响操作与生效时机；不必展示整份 check。用户可直接编辑，也可委托 Agent 处理缺失/损坏文件；CLI 不承担恢复。context 读取出错不得被冒充为成功，也不得成为无法获取诊断/编辑指导的循环门禁。无文件监听或自动 session 刷新。

- 在 Definition 加载深度配置语境中，“以后默认展开三层”：更新 definitionDepth 为 3；“这次展开三层”：仅本次读取；“改成三层”且正在讨论配置：更新对应字段。此处“展开”不表示裁剪树或浏览器状态。
- 已有隔离配置项时，用户提出默认 worktree：更新 apply.defaultIsolation，不另写同义个人偏好。
