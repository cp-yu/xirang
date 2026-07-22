---
element: ai_integration.workflow_templates
---
## MODIFIED Requirements

### Requirement: Bootstrap SHALL 输出 LikeC4 候选模型

Bootstrap SHALL 从 repository evidence 与已有 Specs 生成 versioned OPSX Semantic Model candidate，而非固定 domain/capability 两层或 legacy YAML。Candidate SHALL 包含 Project Root、Metamodel、任意深度 elements、containment、semantic relationships、views 与 singular Spec bindings。

#### Scenario: [ADDED] 生成 versioned candidate files
- **WHEN** Agent 执行 bootstrap
- **THEN** SHALL 在 bootstrap candidate workspace 生成 LikeC4 `.c4` graph modules 与 candidate Specs
- **AND** SHALL 使用受支持 language version
- **AND** MUST NOT 生成 legacy YAML graph

#### Scenario: [ADDED] 候选模型表达 refinement
- **WHEN** evidence 支持多层 abstraction
- **THEN** child elements SHALL 嵌套在唯一 parent 下
- **AND** nesting SHALL 表达 abstraction/refinement
- **AND** MUST NOT 生成显式 `belongs_to`、`refines` 或 `abstracts` relations

#### Scenario: [ADDED] Spec binding 必须唯一
- **WHEN** candidate Spec 能唯一映射到一个 element
- **THEN** frontmatter SHALL 使用 singular `element`
- **WHEN** mapping 不唯一
- **THEN** bootstrap SHALL 记录 review gap 并阻止 promotion

#### Scenario: [ADDED] Project Root 提供整体入口
- **WHEN** candidate model 完成
- **THEN** SHALL 恰有一个 Project Root
- **AND** root summary 与 Project Contract SHALL 提供 Agent 的最高层 intent context

#### Scenario: [REMOVED] 生成 LikeC4 候选文件

- **WHEN** Agent 执行 bootstrap
- **THEN** SHALL 生成 `.opsx/architecture/candidates/` 目录
- **AND** SHALL 为每个发现的 domain 生成 `.c4` 文件
- **AND** SHALL 使用 LikeC4 DSL 语法
- **AND** MUST NOT 生成 YAML 文件

#### Scenario: [REMOVED] 候选模型使用嵌套表达 ownership

- **WHEN** 生成候选 capability
- **THEN** SHALL 嵌套在对应 domain 内
- **AND** MUST NOT 生成显式 `belongs_to` relationship
