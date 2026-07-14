## ADDED Requirements

### Requirement: Schema-backed file definition help

`openspec help authoring [file]` SHALL 从内置 Schema 的结构化 file definitions 构建文件用途、compilation role、content boundary、write policy 与 validation commands，MUST NOT 为同一文件维护独立手写语义。Relation file help SHALL 在该 definition 上组合 `RelationDefinitionRegistry` projection。

#### Scenario: OPSX help 与 Schema definition 一致
- **WHEN** 用户执行 `openspec help authoring project.opsx.yaml --json`、`project.opsx.relations.yaml --json` 或 `opsx-delta.yaml --json`
- **THEN** definition 字段 SHALL 与对应内置 Schema file definition 一致
- **AND** JSON SHALL 保持稳定且可供 Agent 消费

#### Scenario: Relation details 保持 Registry 单一来源
- **WHEN** 用户请求 `project.opsx.relations.yaml` 或 `opsx-delta.yaml` help
- **THEN** `relations` SHALL 继续包含全部 Registry-derived fields
- **AND** file definition MUST NOT 复制或重新定义 relation taxonomy

#### Scenario: Canonical topic 使用显式 lookup
- **WHEN** authoring help 解析 file topic
- **THEN** 系统 SHALL 通过显式 canonical topic list 查找 definition
- **AND** MUST NOT 使用路径模式、大小写启发式或正则猜测 file kind
