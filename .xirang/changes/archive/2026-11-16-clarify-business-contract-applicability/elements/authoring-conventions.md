---
entity: element-declaration
identity: authoring-conventions
kind: element
parent: references-home
title: 共享语义写作指导
definition: 共享语义写作指导是息壤 Declaration、Contract、Change 与相关交互表达的写作契约。它独立承载抽象层级完整性、目标状态表达、Section 身份与自由载体、规范标记、制品职责分工及精简规则，并由业务规格标准进一步细化专用格式；生成路径与加载入口由共享 Reference 交付负责。
---

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

Agent 在探索或编写 Element Contract 前 SHALL 根据其目标承诺判断业务规格适用性。business-specification Contract 表达目标项目的功能行为、约束与可观察验收结果，其宿主 Kind SHALL 声明相应必需 Contract 与格式；缺少既有格式声明不免除该判断，已有业务格式声明仍要求加载标准。Project Root MAY 直接承载该类 Contract；通用概念及组织性 Contract 无需强制 4+N，同一 Kind 不混用两类语义。自然语言使用 business-specification Contract，现有机器格式标识与记法保持。
