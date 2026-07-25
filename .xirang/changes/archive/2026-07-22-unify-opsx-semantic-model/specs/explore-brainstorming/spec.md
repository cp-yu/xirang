---
element: ai_integration.explore_brainstorming
---
## MODIFIED Requirements

### Requirement: Explore 捕获边界保持 specs 为可观察行为

Explore 在已有 change 上发现 insight 时 SHALL 以 OPSX Semantic Model 分类 future capture target。Element Contract 变化进入 owner Spec，graph facts 进入 `architecture-delta.c4`，implementation decisions 进入 scaffolding；Explore 本身保持只读。Spec 的 typed schema MAY 表达 behavior、parent guarantees、data schema 或其他 element-kind contract，不再仅限 capability behavior。

#### Scenario: [ADDED] Contract decision 进入 owner Specs
- **WHEN** Explore 发现 element 的可验证 intent、guarantee、constraint、requirement 或 scenario 变化
- **THEN** SHALL 将 future capture target 分类为该 element 对应的 `specs/<spec-id>/spec.md`
- **AND** SHALL 在 Design Summary 中记录 stable `elementId` 与 contract scope

#### Scenario: [ADDED] Graph decision 进入 architecture delta
- **WHEN** Explore 发现 Metamodel、element identity、summary、containment、relationship 或 view 变化
- **THEN** SHALL 分类到 `architecture-delta.c4`
- **AND** SHALL 使用 abstraction/refinement 与 semantic relationship terminology

#### Scenario: [ADDED] Scaffolding decision 保持分离
- **WHEN** insight 是 motivation、scope、lowering decision、task 或 verification work
- **THEN** SHALL 分别路由到 proposal、design 或 tasks
- **AND** MUST NOT 将其写成 Element Contract

#### Scenario: [ADDED] Explore 不写入模型
- **WHEN** future capture target 已确定
- **THEN** SHALL 只写入 conversation-only Design Summary
- **AND** SHALL 由 propose 或其他非 Explore workflow 生成 artifacts

#### Scenario: [MODIFIED] 可观察行为进入 specs
- **WHEN** Explore 发现 observable behavior contract 变化
- **THEN** SHALL 路由到 owner element 的 Spec
- **AND** SHALL 记录 stable elementId

#### Scenario: [MODIFIED] 重构和实现决策进入 design
- **WHEN** Explore 形成 refactor rationale、rejected path 或 implementation strategy
- **THEN** SHALL 路由到 `design.md`
- **AND** MUST NOT 写入 Element Contract

#### Scenario: [MODIFIED] 其他 insight 路由到对应制品
- **WHEN** Explore 发现 scope、work、verification 或 graph intent change
- **THEN** SHALL 分别路由到 proposal、tasks 或 `architecture-delta.c4`
- **AND** Explore SHALL 保持只读

#### Scenario: [MODIFIED] 过时测试的 future capture target
- **WHEN** architecture 或 contract change 使 existing tests 过时
- **THEN** concrete updates/removals SHALL 路由到 tasks
- **AND** rationale SHALL 路由到 design

### Requirement: Design Summary 生成

Explore SHALL 在设计确认后生成 conversation-only Design Summary，复杂语义模型变更 SHALL 明确记录 Project Root、Metamodel、elements、refinement、contracts、relationships、views、migration、testing 与 risks 中适用的 decisions。

#### Scenario: [ADDED] Semantic Model Design Summary
- **WHEN** 讨论涉及 OPSX Semantic Model structure
- **THEN** summary SHALL 使用 stable canonical terminology
- **AND** SHALL 区分 authored semantic content、derived views 与 implementation evidence
- **AND** MUST NOT 发明独立持久化 IR

#### Scenario: [MODIFIED] 复杂变更的 Design Summary 格式
- **WHEN** complex change 的适用设计段落已确认
- **THEN** summary SHALL 包含 architecture、components、data flow、technology、testing 与 risks 中适用部分

#### Scenario: [MODIFIED] 窄修改的 Design Summary 格式
- **WHEN** narrow change 不需要独立 components、data flow 或 technology decisions
- **THEN** SHALL 至少汇总 problem、impact scope、approach 与 verification method

#### Scenario: [MODIFIED] Design Summary 输出语言
- **WHEN** 用户主要使用非 English language
- **THEN** natural-language prose SHALL 跟随用户语言
- **AND** canonical tokens、paths 与 commands SHALL 保持 canonical

#### Scenario: [MODIFIED] Design Summary 存储
- **WHEN** summary 完成
- **THEN** SHALL 保留在 conversation
- **AND** SHALL 由用户显式触发 propose

#### Scenario: [MODIFIED] Test Maintenance 子节格式
- **WHEN** architecture 或 API change 影响 existing tests
- **THEN** Testing Strategy SHALL 列出待更新、删除与新增 tests 及原因
- **AND** SHALL 标注 authoritative suite 与 one-time verification
