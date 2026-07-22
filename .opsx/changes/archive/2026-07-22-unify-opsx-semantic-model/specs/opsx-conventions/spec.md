---
element: ai_integration.workflow_templates
---
## MODIFIED Requirements

### Requirement: Behavior-First Specification Boundary

OPSX Specs SHALL 作为其 owner element 的 typed Element Contract modules，表达该 element 在对应 abstraction level 的可验证 intent、guarantees、constraints、requirements 与 scenarios。Spec SHALL 避免实现、refactor 与 process detail；parent Spec MUST NOT 复制 child contracts，跨 element collaboration SHALL 由 Semantic Relationships 表达。

#### Scenario: [ADDED] Capability-like contract 表达行为
- **WHEN** element kind 的 contract schema 定义 observable behavior
- **THEN** requirements SHALL 聚焦 externally observable behavior、interfaces、error handling 与 constraints
- **AND** scenarios SHALL 可测试或显式可验证

#### Scenario: [ADDED] Parent contract 表达本层 guarantees
- **WHEN** Spec 属于包含 child elements 的 parent
- **THEN** SHALL 表达 parent 本层 aggregate intent、guarantees、cross-child invariants 或 decomposition rationale
- **AND** MUST NOT 逐条复制 child Specs

#### Scenario: [ADDED] 非 contract 内容路由
- **WHEN**内容涉及具体 library、class/function structure、执行机制、call path、refactor rationale、rejected approach 或 exploration notes
- **THEN** SHALL 路由到 `design.md` 或 `tasks.md`
- **AND** MUST NOT 作为 Element Contract 写入 Spec

#### Scenario: [ADDED] Requirement 使用稳态名称
- **WHEN** 为 Spec 撰写 requirement
- **THEN** 标题 SHALL 使用持久、可验证的 contract 名称
- **AND** SHALL NOT 使用缺口、恢复、迁移等一次性 change action 命名

#### Scenario: [MODIFIED] Writing behavior requirements
- **WHEN** element kind 的 contract schema 管理 observable behavior
- **THEN** requirements SHALL 聚焦 behavior、interfaces、errors 与 constraints
- **AND** scenarios SHALL 可测试或显式可验证

#### Scenario: [MODIFIED] Avoiding implementation leakage
- **WHEN** details 涉及 library、class/function structure、execution mechanics 或 call paths
- **THEN** SHALL 写入 `design.md` 或 `tasks.md`
- **AND** MUST NOT 写入 Element Contract

#### Scenario: [MODIFIED] Routing non-behavior content
- **WHEN** statement 解释 implementation choice、rejected path 或 code organization
- **THEN** SHALL 路由到 `design.md`

#### Scenario: [MODIFIED] 以能力命名 Requirement
- **WHEN** contract schema 表达持久 capability
- **THEN** Requirement title SHALL 使用该 capability 的稳态名称
- **AND** SHALL NOT 使用一次性 change action 命名

#### Scenario: [MODIFIED] 单一 Requirement 不打包多个能力
- **WHEN** candidate Requirement 覆盖多个互不相关 guarantees 或 behaviors
- **THEN** SHALL 拆分为独立 Requirements

#### Scenario: [MODIFIED] 行为定义不引用变更上下文
- **WHEN** Requirement 依赖“原有”“本次”等 change narration 才能理解
- **THEN** SHALL 改写为 target steady state

### Requirement: Project Structure

OPSX 项目 SHALL 使用一致目录保存同一个 OPSX Semantic Model 的 graph modules、contract modules 与 change-local Semantic Delta。

#### Scenario: [MODIFIED] 初始化项目结构
- **WHEN** 初始化 OPSX 项目
- **THEN** SHALL 创建：
```text
.opsx/
├── architecture/          # LikeC4 graph modules: metamodel, elements, relations, views
├── specs/                 # Element-owned contract modules
│   └── <spec-id>/spec.md
├── changes/
│   ├── <change-name>/
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   ├── architecture-delta.c4
│   │   └── specs/<spec-id>/spec.md
│   └── archive/
├── references/
└── config.yaml
```
- **AND** graph 与 contract directories SHALL 被解释为一个 OPSX Semantic Model

### Requirement: Structured Format for Behavioral Specs

Element Contract Specs SHALL 使用一致、可解析的 section headers 与 normative keywords；每份 Spec SHALL 通过 frontmatter singular `element` 绑定唯一 owner element。

#### Scenario: [MODIFIED] Writing requirement sections
- **WHEN** documenting a requirement in an Element Contract
- **THEN** use a level-3 heading with format `### Requirement: [Name]`
- **AND** immediately follow with a SHALL or MUST statement describing target behavior or guarantee

#### Scenario: [MODIFIED] Documenting scenarios
- **WHEN** documenting a verifiable case
- **THEN** use `#### Scenario: [Description]`
- **AND** use bold `GIVEN`、`WHEN`、`THEN` 与 `AND` keywords

#### Scenario: [ADDED] Binding a Spec
- **WHEN** authoring a formal or change-local Spec for the new language version
- **THEN** frontmatter SHALL contain exactly one `element: <elementId>` field
- **AND** MUST NOT contain a `capabilities` ownership array

#### Scenario: [MODIFIED] Adding implementation details
- **WHEN** a scenario step needs additional observable detail
- **THEN** MAY use concise nested bullets
- **AND** MUST NOT use them承载 implementation design

### Requirement: Change Storage Convention

Change proposals SHALL store only target-state graph and contract deltas，不保存完整未来模型。`architecture-delta.c4` 与 `specs/**/*.md` SHALL 共同构成一个 Semantic Delta，并在 validation 与 sync 中联合处理。

#### Scenario: [ADDED] Graph 与 contract modules 同属一个 delta
- **WHEN** change 同时修改 element graph 与 Element Contracts
- **THEN** graph operations SHALL 写入 `architecture-delta.c4`
- **AND** requirement operations SHALL 写入对应 change-local Specs
- **AND** 系统 SHALL 将两者作为一个 Target Semantic Model 验证

#### Scenario: [ADDED] Delta operation 保持现有格式
- **WHEN** change-local Spec 增加、修改、删除或重命名 requirement
- **THEN** SHALL 继续使用 `ADDED`、`MODIFIED`、`REMOVED` 与 `RENAMED` sections
- **AND**正文 SHALL 描述 target steady state

#### Scenario: [MODIFIED] Creating change proposals with additions
- **WHEN** change 增加 Requirement
- **THEN** SHALL 在 `## ADDED Requirements` 包含完整 target Requirement

#### Scenario: [MODIFIED] Creating change proposals with modifications
- **WHEN** change 修改 Requirement
- **THEN** SHALL 在 `## MODIFIED Requirements` 使用 exact existing title 和完整 target content

#### Scenario: [MODIFIED] Creating change proposals with removals
- **WHEN** change 删除 Requirement
- **THEN** SHALL 在 `## REMOVED Requirements` 声明 exact title、Reason 与 Migration

#### Scenario: [MODIFIED] Using standard output symbols
- **WHEN** CLI 显示 delta operations
- **THEN** SHALL 继续使用 `+`、`~`、`-` 与 `→` 表示 ADDED、MODIFIED、REMOVED 与 RENAMED
