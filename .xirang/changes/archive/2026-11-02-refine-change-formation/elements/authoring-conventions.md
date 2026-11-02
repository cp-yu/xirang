---
entity: element-declaration
identity: authoring-conventions
kind: element
parent: agent-workbench-projection
title: Authoring Conventions
definition: Authoring Conventions 定义契约与变更写作规范：Section 结构与自由载体、behavior-first 边界、稳态命名、progressive rigor、Header 即 identity、verb-first CLI 与 structure token/填充 prose 区分。其中项目目录结构语义已被 Semantic Model 四分区存储吸收，不在此重复。
---

## ADDED Sections

### Section: 精简 Contract 表达

Contract SHALL 只写宿主 Element 在自身层级的职责、保证、约束与行为。Scope 写本 Element 的职责边界，Non-goals 只澄清必要职责排除，不罗列所有不负责的事情；整个 Change 范围属于 proposal，实现取舍与影响设计理解的理由属于 design。

- pi-native-markdown-preview 的“自研 HTTP 预览服务”是实现方案排除，应放 design.md，放入该 Element Contract 的 Scope and Non-goals 属于错误路由。

SHALL 直接写条件、行为和结果，删除不增加含义的解释。表达对照：“系统 MUST 对提交的来源版本进行严格校验，以确保更新始终基于最新记录，避免过期操作对现有内容造成覆盖。”可精简为“来源版本过期时，MUST 拒绝更新，记录保持不变。”

同层同一规则 SHALL 集中表达，其他位置补充不同信息：Scope 不复述完整管线，Business Logic 讲机制，异常部分补异常条件与结果，验收用具体输入和结果验证，不换措辞重复正文。父子 Contract 在不同抽象层级的必要覆盖保持完整，不为去重使父级依赖 children 才能理解承诺。

已有表达准确时 SHALL 尽量沿用，只改受影响行为，不顺带润色整段；用户已确认且清楚的表达不为正式文档化重新包装，条件、数值、例外与时序完整保留。

## MODIFIED Sections

### Section: Behavior-First Specification Boundary

Element Contracts SHALL 表达其 owner Element 在对应 abstraction level 的可验证 intent、guarantees、constraints、Sections 与 Acceptance Cases。Contract SHALL 避免实现、refactor 与 process detail；parent Contract MUST NOT 逐条复制 child contracts，但 SHALL 在自身抽象层级独立表达完整承诺，不为去重遗漏父级语义，跨 element collaboration SHALL 由 Semantic Relationships 表达。

- **Capability-like contract 表达行为**
  - element kind 的 contract schema 定义 observable behavior
  - Sections SHALL 聚焦 externally observable behavior、interfaces、error handling 与 constraints
  - Acceptance Cases SHALL 可测试或显式可验证

- **Parent contract 表达本层 guarantees**
  - Contract 属于包含 child elements 的 parent
  - SHALL 表达 parent 本层 aggregate intent、guarantees、cross-child invariants 或 decomposition rationale
  - MUST NOT 逐条复制 child Contracts

- **非 contract 内容路由**
  - 内容涉及具体 library、类/函数结构、执行机制、call path、refactor rationale、rejected approach 或 exploration notes
  - SHALL 路由到 `design.md` 或 `tasks.md`
  - MUST NOT 作为 Element Contract 写入

- **Section 使用稳态名称**
  - 为 Contract 撰写 Section
  - 标题 SHALL 使用持久、可验证的 contract 名称
  - SHALL NOT 使用缺口、恢复、迁移等一次性 change action 命名

- **单一 Section 不打包多个能力**
  - candidate Section 覆盖多个互不相关 guarantees 或 behaviors
  - SHALL 拆分为独立 Sections
