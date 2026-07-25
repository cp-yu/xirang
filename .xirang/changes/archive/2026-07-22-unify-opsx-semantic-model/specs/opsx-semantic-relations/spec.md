---
element: architecture.metamodel
---
## MODIFIED Requirements

### Requirement: OPSX v2 文件模型

OPSX Semantic Model graph SHALL 使用 `.opsx/architecture/**/*.c4` 的 versioned OPSX LikeC4 profile，并与 `.opsx/specs/**/*.md` contract modules 共同形成 formal model。系统 MUST NOT 读取 legacy YAML graph 作为新版 model 的 runtime fallback。

#### Scenario: [ADDED] 读取新版模型
- **WHEN** graph source 声明受支持 language version
- **THEN** reader SHALL 返回通用 elements、containment、semantic relationships、Metamodel 与 views
- **AND** contract registry SHALL 从 formal Specs 构建

#### Scenario: [ADDED] Legacy profile 显式读取
- **WHEN** graph source 缺失 language version
- **THEN** SHALL 作为 legacy LikeC4 profile 读取
- **AND** MUST NOT 静默写成新版 model

#### Scenario: [REMOVED] 读取合法 v2 模型
- **GIVEN** 两个正式 OPSX 文件均存在且声明 `schema_version: 2`
- **WHEN** 系统读取 OPSX model
- **THEN** SHALL 返回 project nodes 与 relations
- **AND** SHALL NOT 尝试读取 code-map

#### Scenario: [REMOVED] v1 模型明确失败
- **GIVEN** OPSX 文件声明 `schema_version: 1`
- **WHEN** v2 reader 或 validator 处理该模型
- **THEN** SHALL 以非零结果拒绝该模型
- **AND** 错误 SHALL 指向 `opsx help authoring project.opsx.relations.yaml` 与 bootstrap/refresh 重建路径
- **AND** MUST NOT 静默转换旧 relation token

### Requirement: RelationDefinitionRegistry 单一权威

系统 SHALL 从 versioned Metamodel 派生 relationship token、direction、含义、可选 endpoint constraints、description policy 与合法 examples。Runtime validation、bootstrap、authoring guidance、query 与 view MUST 使用同一投影。

#### Scenario: [ADDED] Metamodel projection 保持一致
- **WHEN** 系统渲染 relation authoring surface
- **THEN** surface SHALL 包含 model 声明的 relationship kinds
- **AND** endpoint rules SHALL 与 runtime validator 一致

#### Scenario: [MODIFIED] 生成制品漂移被拒绝
- **WHEN** checked-in generated reference 与 Metamodel projection 不同
- **THEN** consistency check SHALL 失败
- **AND** SHALL 指明显式生成文件

#### Scenario: [REMOVED] Registry 投影保持一致
- **WHEN** 系统渲染任一 relation authoring surface
- **THEN** surface SHALL 仅包含 `belongs_to`、`invokes`、`consumes`、`precedes`、`constrains`、`validates`
- **AND** 每种 relation 的 endpoint 与选择规则 SHALL 与 runtime validator 一致

### Requirement: 精确 relation vocabulary

默认 OPSX profile SHALL 提供 `invokes`、`produces`、`consumes`、`precedes`、`constrains` 与 `validates`。Containment SHALL 派生 `belongs_to`、`refines` 与 `abstracts` 查询语义，MUST NOT 将它们持久化为 relationship edges。

#### Scenario: [ADDED] 默认 semantic relationships 通过
- **WHEN** relation 使用默认 token 且满足可选 endpoint constraints
- **THEN** parsing 与 semantic validation SHALL 通过

#### Scenario: [ADDED] Persisted containment relation 被拒绝
- **WHEN**新版 graph 显式声明 `belongs_to`、`refines` 或 `abstracts` edge
- **THEN** validation SHALL 返回重复语义 ERROR

#### Scenario: [REMOVED] 六种 relation 通过解析
- **WHEN** relation 使用任一 canonical token 和合法 endpoint kinds
- **THEN** schema parsing 与 semantic validation SHALL 通过

#### Scenario: [REMOVED] 旧 relation token 被拒绝
- **WHEN** formal relation 或 opsx-delta 使用任一旧 token
- **THEN** validation SHALL 失败
- **AND** 错误 SHALL 列出允许的 canonical relation tokens

### Requirement: Relation endpoint 与 note 合同

Relationship endpoints SHALL 引用可解析 elements，并遵守 Metamodel 可选 `sourceKinds` 与 `targetKinds`。未声明 endpoint constraint 时默认开放。Relationship MAY 包含受长度限制的 description；containment 不使用 relation note。

#### Scenario: [ADDED] Produces 和 consumes 表达 information flow
- **GIVEN** information element kind 满足 Metamodel target constraint
- **WHEN** producer `produces` information 且 consumer `consumes` information
- **THEN** 两条 relations SHALL 通过
- **AND** information element MAY 拥有自己的 Specs

#### Scenario: [ADDED] Endpoint constraint 违规
- **WHEN** relation endpoint kind 不满足显式 Metamodel constraint
- **THEN** validation SHALL 返回包含 relation 与 endpoint kinds 的 ERROR

#### Scenario: [REMOVED] Ownership 完整且唯一
- **WHEN** full graph 中每个 capability 均有且仅有一条合法 `belongs_to`
- **THEN** ownership validation SHALL 通过

#### Scenario: [REMOVED] Ownership 缺失或重复
- **WHEN** capability 没有 `belongs_to` 或属于多个 domain
- **THEN** validation SHALL 失败并指出 capability ID

#### Scenario: [REMOVED] Note policy 生效
- **WHEN** `belongs_to` 包含 `note`，或其他 relation 的 `note` 超过 200 字符
- **THEN** validation SHALL 失败并指出字段路径

### Requirement: Relation 全图语义验证

系统 SHALL 对 formal model、change-local Target Semantic Model、migration candidate 与 sync result 执行同一 relation validator。Validator SHALL 检查 endpoint existence、optional kind constraints、self-loop、duplicate、dangling relation 与 cycle；`precedes` cycle MUST 为 ERROR。

#### Scenario: [MODIFIED] Precedes cycle 被拒绝
- **WHEN** `precedes` relations 形成 cycle
- **THEN** SHALL 返回使用 canonical elementIds 的 cycle path

#### Scenario: [ADDED] 不同机制连接同一 pair
- **WHEN** A `invokes` B 且 A `consumes` B
- **THEN** SHALL 接受两条不同 kind relations
- **AND** 重复 `{source,kind,target}` SHALL 被拒绝

#### Scenario: [REMOVED] 不同机制可连接同一 endpoint pair
- **GIVEN** `cap.a invokes cap.b` 且 `cap.a consumes cap.b`
- **WHEN** semantic validation 执行
- **THEN** SHALL 接受两条 relation
- **AND** 同一 `{from,type,to}` 的重复项 SHALL 被拒绝
