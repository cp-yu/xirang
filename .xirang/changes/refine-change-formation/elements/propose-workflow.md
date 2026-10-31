---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
---

## ADDED Sections

### Section: 按复杂度组织交互审阅

Workflow SHALL 指导简单变更先形成完整草稿并集中审阅具体差异与问题，复杂变更按一项机制或相关 Elements 分组编写、审阅，确认后继续；不按 Element 数量机械要求逐个确认。成文中提出新想法与用户讨论，明确细节自主权与重大决策确认边界，不以一次调用后无须交互为目标。

## MODIFIED Sections

### Section: Propose 创建完整 change 制品

系统 SHALL 提供 propose workflow，在不实施代码的前提下创建或更新 change，并生成 `proposal.md`、delta Contracts、`design.md`、`tasks.md` 与架构变化所需的结构目标制品。Workflow SHALL 在 semantic readiness 通过或用户明确 override 后才创建新 change，并 SHALL 将 graph 与 contract impacts 解释为同一 Semantic Model 的 module scopes。

- **创建新 change**

  - 用户明确要求创建 new change
  - semantic readiness 已通过或用户已明确 override
  - 派生 change ID 不存在
  - workflow SHALL 执行 `xirang new change`
  - SHALL 按 artifact dependency order 生成 apply 所需制品

- **Readiness 未通过时不创建 change**

  - semantic readiness 不完整且用户未 override
  - SHALL 报告缺失项并停止
  - SHALL NOT 创建 change directory

- **更新 existing change**

  - 用户明确要求更新 existing change
  - SHALL 原地更新
  - SHALL 合并现有 artifacts、当前输入、Design Summary、formal model 与 implementation evidence 判断 readiness

- **Workflow stage 边界**

  - 生成 propose skill
  - 声明 PROPOSE 只写目标 Change 制品，禁止修改 implementation 或正式模型
  - 允许通过 CLI 维护共享设计记录，pending 可主动维护，accepted、excluded 及确认内容的实质修改须用户允许；允许 record coverage 记录覆盖结果，并在版本、覆盖、结构及校验门禁通过后 record consume。除此之外不得任意写入 Change 目录外文件，不将记录权限视为正式实现权限

- **New change ID 冲突**

  - 用户要求 new change 且 ID 已存在
  - SHALL 停止并要求另一个 ID
  - SHALL NOT 覆盖或自动改名

- **Identity 不明确且 ID 已存在**

  - 用户意图未明确区分 update existing change 或 create new change
  - 派生 ID 已存在
  - SHALL 一次询问用户选择
  - non-interactive mode SHALL fail fast

- **等价 artifact 结果**

  - 用户调用 propose
  - change directory 与 planning artifact set SHALL 完整创建

### Section: Propose smart routing

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`，忠实文档化已确认设计。它 MAY 在既定范围内自主处理细枝末节、组织案例和任务及修正表达或推导错误，不得自主大量扩写实质设计；新发现的决策点 SHALL 先说明选项与推荐，再一次一问等待用户确认。小范围内容与方案调整可在 Propose 内交互确认并维护记录；需要重新设计实验判断可行性或大幅重做设计时返回 Explore；完成披露不能代替决策前确认。没有 summary 时，SHALL 依据 problem、impact scope、approach、verification method 与未决 Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

- **复用 Design Summary**

  - conversation 包含已确认的 `Design Summary`
  - propose SHALL 说明正在复用该 summary
  - SHALL 将其中的 architecture、testing、risk 与 trade-off decisions 路由到对应 artifacts
  - SHALL NOT 重新执行字符数或 detail score 判断

- **Semantic readiness 不完整**

  - 任一 readiness 项缺失或 source decision 未决
  - propose SHALL 在对话中列出具体缺口；孤立决策可就地询问，大幅设计工作建议 Explore
  - readiness 通过或被明确 override 前 SHALL NOT 创建 change 或写入制品
  - 新决策确认前 SHALL NOT 将依赖它的内容写成确定方案；routing decision 保留在会话

- **用户显式 override**

  - propose 已报告 readiness 缺口且用户明确要求直接生成
  - propose SHALL 接受 override 并继续
  - override SHALL NOT 授权 Agent 猜测影响 behavior 或 architecture 的关键决策
  - 直接要求 propose 或不追问不提供缺失决策，必要确认无法取得时 SHALL 报告阻碍

- **Semantic readiness 完整**

  - conversation 不包含已确认的 Design Summary
  - problem、impact scope、approach 与 verification method 均明确
  - 不存在会改变 Behavior Source 或 Architecture Source 的未决决策
  - propose SHALL 说明 readiness 已满足并继续 artifact generation

- **多 subsystem scope**

  - 请求涉及多个 subsystem
  - propose SHALL 将其作为 impact scope 证据
  - 只有无法形成单一一致 change scope 时才 SHALL 报告 readiness 缺口
  - MUST NOT 仅凭 subsystem 数量强制 Explore

- **Test Maintenance 分发**

  - Testing Strategy 包含过时测试信息
  - 过时原因 SHALL 进入 `design.md`
  - 具体更新或删除操作 SHALL 进入 `tasks.md`

- **One-time Verification 分发**

  - Testing Strategy 包含 `One-time Verification`
  - 项目 SHALL 生成 evidence-only Check 且 SHALL NOT 创建 persistent test file
  - absence assertion SHALL 锚定 REMOVED Section

- **Routing decision 不污染 artifacts**

  - propose 报告 readiness、缺失项或用户 override
  - 这些运行过程信息 SHALL 仅保留在对话中
  - SHALL NOT 写入 `proposal.md` comment 或其他 change artifacts
