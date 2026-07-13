## MODIFIED Requirements

### Requirement: MODIFIED section 执行 shallow merge

`applyOpsxDelta` SHALL 对 MODIFIED nodes 执行 shallow merge，仅更新显式字段并保留其余字段。Relation ADDED/MODIFIED/REMOVED SHALL 使用 OPSX v2 canonical relation schema，merge 后 SHALL 执行 Registry-driven semantic validation 与 referential integrity validation。Delta merge MUST NOT 读取、更新或校验 code-map。

#### Scenario: [ADDED] MODIFIED capability 仅更新显式字段
- **GIVEN** formal OPSX 中存在完整 capability
- **WHEN** MODIFIED 仅声明 `{id, intent}`
- **THEN** apply 后仅 `intent` 改变
- **AND** 其他未声明字段保持不变

#### Scenario: [ADDED] Delta relation 违反 endpoint contract
- **GIVEN** delta ADDED 包含 `belongs_to` 的 domain→capability relation
- **WHEN** dry-run merge 执行
- **THEN** merge validation SHALL 失败并指出 relation path 与 endpoint kinds

#### Scenario: [ADDED] Removed node 留下 relation
- **GIVEN** delta REMOVED 删除一个 node 但未使其关联 relations 从结果中消失
- **WHEN** dry-run merge 执行
- **THEN** semantic validation SHALL 失败并指出 dangling relations

#### Scenario: [ADDED] Merge 不处理 code-map
- **WHEN** v2 delta 被应用
- **THEN** result SHALL 只包含 project nodes 与 relations
- **AND** MUST NOT 产生 `code_map` 或 code-map file write

#### Scenario: [REMOVED] MODIFIED capability 仅含 id 和 intent

- **GIVEN** 主 OPSX 中存在 `cap.cli.init` 节点，其 `type: capability`, `intent: "原始描述"`, `status: active`, `domain: dom.cli`
- **WHEN** delta MODIFIED section 声明 `{id: cap.cli.init, intent: "修改后的描述"}`（不含 type/status/domain）
- **THEN** apply 后 `cap.cli.init.intent` 变为 `"修改后的描述"`
- **AND** `cap.cli.init.type` 保持 `"capability"`
- **AND** `cap.cli.init.status` 保持 `"active"`
- **AND** `cap.cli.init.domain` 保持 `"dom.cli"`

#### Scenario: [REMOVED] MODIFIED domain 仅含 id 和 boundary

- **GIVEN** 主 OPSX 中存在 domain 节点
- **WHEN** delta MODIFIED 仅声明 `{id, boundary}`
- **THEN** 仅 boundary 字段被更新
- **AND** type/intent/status 保持不变

#### Scenario: [REMOVED] MODIFIED 显式设置字段为可选的空值

- **GIVEN** 主 OPSX 节点有 `domain: "dom.cli"`
- **WHEN** delta MODIFIED 声明 `{id: cap.xxx, domain: undefined}` 或 `{id: cap.xxx}`（不写 domain）
- **THEN** domain 字段保持原值不变（不删除）

#### Scenario: [REMOVED] validateOpsxDelta 提前检测 MODIFIED 引用不存在

- **GIVEN** delta MODIFIED 声明 `{id: cap.nonexistent}`
- **AND** `cap.nonexistent` 在主 OPSX 中不存在
- **WHEN** `Validator.validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 ERROR 级别 issue，消息包含 `OPSX dry-run merge failed`
- **AND** 不会等到 sync 阶段才发现错误
