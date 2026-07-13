## MODIFIED Requirements

### Requirement: Validator 支持 OPSX dry-run merge 校验

`Validator` SHALL 对 `opsx-delta.yaml` 执行 v2 dry-run：读取两文件 formal OPSX、解析 `OpsxDeltaSchema`、调用 `applyOpsxDelta()`、执行 referential integrity 与 Registry-driven relation semantic validation。Formal OPSX 或 delta 缺失时保持现有跳过行为。Validator MUST NOT 调用 code-map validation。

#### Scenario: [ADDED] 有效 v2 delta 通过校验
- **GIVEN** formal OPSX v2 与 delta 均合法
- **WHEN** `validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 `valid: true` 且 `issues` 为空

#### Scenario: [ADDED] 非法 relation endpoint 被拒绝
- **GIVEN** delta relation 使用存在但类型不合法的 endpoints
- **WHEN** dry-run validation 执行
- **THEN** 返回 ERROR issue
- **AND** issue SHALL 包含 relation type、from/to 与允许的 endpoint kinds

#### Scenario: [ADDED] 旧 relation token 被拒绝
- **GIVEN** delta 使用 `contains`、`depends_on` 或其他 v1 relation
- **WHEN** schema parsing 执行
- **THEN** validation SHALL 失败并列出 canonical v2 tokens

#### Scenario: [ADDED] Code-map 缺失不影响校验
- **GIVEN** formal v2 两文件存在且没有 `project.opsx.code-map.yaml`
- **WHEN** dry-run validation 执行
- **THEN** validator SHALL 正常完成
- **AND** MUST NOT 产生 Code-map integrity issue

#### Scenario: [REMOVED] 有效的 opsx-delta 通过校验

- **GIVEN** `project.opsx.yaml` 存在且合法
- **AND** `opsx-delta.yaml` 内容合法，ADDED/MODIFIED/REMOVED 节点 ID 有效
- **WHEN** `validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 `valid: true`
- **AND** `issues` 为空数组

#### Scenario: [REMOVED] project.opsx.yaml 不存在时跳过

- **GIVEN** `openspec/project.opsx.yaml` 不存在
- **WHEN** `validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 `valid: true`
- **AND** `issues` 为空数组
- **AND** SHALL NOT 抛出异常

#### Scenario: [REMOVED] opsx-delta.yaml 不存在时跳过

- **GIVEN** `openspec/project.opsx.yaml` 存在
- **AND** change 目录下 `opsx-delta.yaml` 不存在
- **WHEN** `validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 `valid: true`
- **AND** `issues` 为空数组

#### Scenario: [REMOVED] MODIFIED 引用不存在的节点时报错

- **GIVEN** `opsx-delta.yaml` 的 MODIFIED section 包含 `{id: cap.nonexistent, intent: "..."}`
- **AND** `cap.nonexistent` 在 `project.opsx.yaml` 中不存在
- **WHEN** `validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 `valid: false`
- **AND** `issues` 中包含 ERROR 级别条目，消息包含 `OPSX dry-run merge failed`
- **AND** 消息 SHALL 指明失败原因（节点未找到）

#### Scenario: [REMOVED] 引用完整性失败时报错

- **GIVEN** `opsx-delta.yaml` 的 ADDED relations 包含 `{from: cap.xxx, type: contains, to: dom.nonexistent}`
- **AND** `dom.nonexistent` 既不在 delta 的 ADDED 中也不在 project.opsx.yaml 中
- **WHEN** `validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 `valid: false`
- **AND** `issues` 中包含 ERROR 级别条目，消息包含 `Referential integrity`

#### Scenario: [REMOVED] code-map 完整性失败时报错

- **GIVEN** 合并后的 bundle 的 code_map 条目引用不存在的节点 ID
- **WHEN** `validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 `valid: false`
- **AND** `issues` 中包含 ERROR 级别条目，消息包含 `Code-map integrity`
