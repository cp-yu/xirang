---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
---

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
  - 仅允许 CLI-managed `xirang record coverage` 向目标 Change 记录覆盖结果，并在覆盖结果有效、结构比对一致与校验通过后以 `xirang record consume` 完成明确来源的交接及受控清理；不允许任意 change 目录外写入，也不允许创建、更新、重命名或丢弃记录

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

### Section: 仅在 Propose 形成结构目标时应用拆分指导

Propose Workflow SHALL 在需要形成尚未确认的新增或重组 hierarchy 时消费 normalized decomposition；对已经确认的记录或 Summary 结构决策 SHALL 忠实编译而不重新裁决。精简记录的存在不表示全部结构都已确认；尚未决部分仍须指导和用户确认。Contract-only 变化不因默认方法制造 Architecture Source。

- **无记录时形成结构 Delta**

  - 设计要求新增或重组结构且不存在记录
  - 使用配置指导确认目标结构，再编译对应 Delta。

- **已确认记录优先**

  - 记录结构部分已确认部分 identity、parent 或 Kind，但仍有未决结构
  - 保持已确认决策；仅对未决部分使用指导并请求用户确认，不能跳过全部结构设计或静默重做旧决策。

- **Architecture Source 为 None**

  - Change 只改变 Contracts 或 implementation scaffolding
  - 不调用拆分 skill，不从默认方法发明结构变化。

- **拆分指导不可用时阻塞 Formation**

  - 必须形成结构但方法不明确或 skill 不可用
  - 停止相关结构写入并询问用户，不猜测默认方法或实现目录作为目标。
