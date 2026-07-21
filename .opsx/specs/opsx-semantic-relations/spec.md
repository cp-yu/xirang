# opsx-semantic-relations Specification

## Purpose
This specification records behavior introduced by change opsx-v2-semantic-relations. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: OPSX v2 文件模型
OPSX SHALL 使用 `schema_version: 2`，正式模型 SHALL 仅由 `opsx/project.opsx.yaml` 与 `opsx/project.opsx.relations.yaml` 组成。系统 MUST NOT 要求、生成或读取 `opsx/project.opsx.code-map.yaml`。

#### Scenario: 读取合法 v2 模型
- **GIVEN** 两个正式 OPSX 文件均存在且声明 `schema_version: 2`
- **WHEN** 系统读取 OPSX model
- **THEN** SHALL 返回 project nodes 与 relations
- **AND** SHALL NOT 尝试读取 code-map

#### Scenario: v1 模型明确失败
- **GIVEN** OPSX 文件声明 `schema_version: 1`
- **WHEN** v2 reader 或 validator 处理该模型
- **THEN** SHALL 以非零结果拒绝该模型
- **AND** 错误 SHALL 指向 `opsx help authoring project.opsx.relations.yaml` 与 bootstrap/refresh 重建路径
- **AND** MUST NOT 静默转换旧 relation token

### Requirement: RelationDefinitionRegistry 单一权威
系统 SHALL 从一个声明式 `RelationDefinitionRegistry` 派生 relation token、endpoint kinds、方向、含义、选择规则、propagation hint、`note` policy 与合法示例。Runtime validation、bootstrap schema、authoring templates、canonical reference、workflow summary 和 authoring help MUST 使用该 Registry 的投影，MUST NOT 维护独立 relation taxonomy。

#### Scenario: Registry 投影保持一致
- **WHEN** 系统渲染任一 relation authoring surface
- **THEN** surface SHALL 仅包含 `belongs_to`、`invokes`、`consumes`、`precedes`、`constrains`、`validates`
- **AND** 每种 relation 的 endpoint 与选择规则 SHALL 与 runtime validator 一致

#### Scenario: 生成制品漂移被拒绝
- **WHEN** checked-in template 或 reference 与 Registry renderer 输出不同
- **THEN** consistency check SHALL 失败
- **AND** 错误 SHALL 指明发生漂移的显式生成文件

### Requirement: 精确 relation vocabulary
系统 SHALL 仅接受以下 canonical relations：`belongs_to` 表示 capability→domain 归属；`invokes` 表示 caller→callee 主动触发；`consumes` 表示 consumer→provider 消费内容或合同；`precedes` 表示 earlier→later 正确性时序；`constrains` 表示 constraint owner→constrained capability；`validates` 表示 validator→subject 有效性判定。系统 MUST 拒绝 `contains`、`depends_on`、`relates_to`、`implemented_by` 与 `verified_by`。

#### Scenario: 六种 relation 通过解析
- **WHEN** relation 使用任一 canonical token 和合法 endpoint kinds
- **THEN** schema parsing 与 semantic validation SHALL 通过

#### Scenario: 旧 relation token 被拒绝
- **WHEN** formal relation 或 opsx-delta 使用任一旧 token
- **THEN** validation SHALL 失败
- **AND** 错误 SHALL 列出允许的 canonical relation tokens

### Requirement: Relation endpoint 与 note 合同
`belongs_to` SHALL 仅允许 capability→domain，其他五种 relation SHALL 仅允许 capability→capability。每个 capability MUST 恰有一条 `belongs_to`。`belongs_to` MUST NOT 包含 `note`；其他 relation MAY 包含最长 200 字符的 `note`。

#### Scenario: Ownership 完整且唯一
- **WHEN** full graph 中每个 capability 均有且仅有一条合法 `belongs_to`
- **THEN** ownership validation SHALL 通过

#### Scenario: Ownership 缺失或重复
- **WHEN** capability 没有 `belongs_to` 或属于多个 domain
- **THEN** validation SHALL 失败并指出 capability ID

#### Scenario: Note policy 生效
- **WHEN** `belongs_to` 包含 `note`，或其他 relation 的 `note` 超过 200 字符
- **THEN** validation SHALL 失败并指出字段路径

### Requirement: Relation 全图语义验证
系统 SHALL 对 formal model、opsx-delta dry-run、bootstrap candidate、refresh candidate 与 sync 结果执行同一 relation semantic validator。Validator SHALL 检查 endpoint existence/kind、self-loop、完全重复边、dangling relation、ownership cardinality 与 cycle；`precedes` cycle MUST 为错误，其他 cycle SHALL 作为诊断报告。

#### Scenario: Precedes cycle 被拒绝
- **GIVEN** graph 包含 `cap.a precedes cap.b` 与从 `cap.b` 返回 `cap.a` 的 `precedes` path
- **WHEN** semantic validation 执行
- **THEN** SHALL 返回错误并展示 cycle path

#### Scenario: 不同机制可连接同一 endpoint pair
- **GIVEN** `cap.a invokes cap.b` 且 `cap.a consumes cap.b`
- **WHEN** semantic validation 执行
- **THEN** SHALL 接受两条 relation
- **AND** 同一 `{from,type,to}` 的重复项 SHALL 被拒绝
