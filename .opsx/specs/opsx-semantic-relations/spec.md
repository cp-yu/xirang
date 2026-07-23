---
element: cap.opsx.semantic-relations
---

# opsx-semantic-relations Specification

## Purpose
Define the reviewed Versioned Semantic Model contract for OPSX v1 文件模型; RelationDefinitionRegistry 单一权威; 精确 relation vocabulary; and 2 additional reviewed Requirements.

## Requirements
### Requirement: OPSX v1 文件模型

OPSX Semantic Model graph SHALL 使用 `.opsx/architecture/**/*.c4` 的 versioned OPSX LikeC4 profile，并与 `.opsx/specs/**/*.md` contract modules 共同形成 formal model。系统 MUST NOT 读取 legacy YAML graph 作为新版 model 的 runtime fallback。

#### Scenario: 读取新版模型
- **WHEN** graph source 声明受支持 language version
- **THEN** reader SHALL 返回通用 elements、containment、semantic relationships、Metamodel 与 views
- **AND** contract registry SHALL 从 formal Specs 构建

#### Scenario: Legacy profile 显式读取
- **WHEN** graph source 缺失 language version
- **THEN** SHALL 作为 legacy LikeC4 profile 读取
- **AND** MUST NOT 静默写成新版 model

### Requirement: RelationDefinitionRegistry 单一权威

系统 SHALL 从 versioned Metamodel 派生 relationship token、direction、含义、可选 endpoint constraints、description policy 与合法 examples。Runtime validation、bootstrap、authoring guidance、query 与 view MUST 使用同一投影。

#### Scenario: Metamodel projection 保持一致
- **WHEN** 系统渲染 relation authoring surface
- **THEN** surface SHALL 包含 model 声明的 relationship kinds
- **AND** endpoint rules SHALL 与 runtime validator 一致

#### Scenario: 生成制品漂移被拒绝
- **WHEN** checked-in generated reference 与 Metamodel projection 不同
- **THEN** consistency check SHALL 失败
- **AND** SHALL 指明显式生成文件

### Requirement: 精确 relation vocabulary

默认 OPSX profile SHALL 提供 `invokes`、`produces`、`consumes`、`precedes`、`constrains` 与 `validates`。Containment SHALL 派生 `belongs_to`、`refines` 与 `abstracts` 查询语义，MUST NOT 将它们持久化为 relationship edges。

#### Scenario: 默认 semantic relationships 通过
- **WHEN** relation 使用默认 token 且满足可选 endpoint constraints
- **THEN** parsing 与 semantic validation SHALL 通过

#### Scenario: Persisted containment relation 被拒绝
- **WHEN**新版 graph 显式声明 `belongs_to`、`refines` 或 `abstracts` edge
- **THEN** validation SHALL 返回重复语义 ERROR

### Requirement: Relation endpoint 与 note 合同

Relationship endpoints SHALL 引用可解析 elements，并遵守 Metamodel 可选 `sourceKinds` 与 `targetKinds`。未声明 endpoint constraint 时默认开放。Relationship MAY 包含受长度限制的 description；containment 不使用 relation note。

#### Scenario: Produces 和 consumes 表达 information flow
- **GIVEN** information element kind 满足 Metamodel target constraint
- **WHEN** producer `produces` information 且 consumer `consumes` information
- **THEN** 两条 relations SHALL 通过
- **AND** information element MAY 拥有自己的 Specs

#### Scenario: Endpoint constraint 违规
- **WHEN** relation endpoint kind 不满足显式 Metamodel constraint
- **THEN** validation SHALL 返回包含 relation 与 endpoint kinds 的 ERROR

### Requirement: Relation 全图语义验证

系统 SHALL 对 formal model、change-local Target Semantic Model、migration candidate 与 sync result 执行同一 relation validator。Validator SHALL 检查 endpoint existence、optional kind constraints、self-loop、duplicate、dangling relation 与 cycle；`precedes` cycle MUST 为 ERROR。

#### Scenario: Precedes cycle 被拒绝
- **WHEN** `precedes` relations 形成 cycle
- **THEN** SHALL 返回使用 canonical elementIds 的 cycle path

#### Scenario: 不同机制连接同一 pair
- **WHEN** A `invokes` B 且 A `consumes` B
- **THEN** SHALL 接受两条不同 kind relations
- **AND** 重复 `{source,kind,target}` SHALL 被拒绝
