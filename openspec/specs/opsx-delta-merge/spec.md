# opsx-delta-merge Specification

## Purpose
此规约记录变更 fix-delta-schema-validation-defects 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: MODIFIED section 执行 shallow merge

`applyOpsxDelta` SHALL 对 MODIFIED nodes 执行 shallow merge，仅更新显式字段并保留其余字段。Relation ADDED/MODIFIED/REMOVED SHALL 使用 OPSX v2 canonical relation schema，merge 后 SHALL 执行 Registry-driven semantic validation 与 referential integrity validation。Delta merge MUST NOT 读取、更新或校验 code-map。

#### Scenario: MODIFIED capability 仅更新显式字段
- **GIVEN** formal OPSX 中存在完整 capability
- **WHEN** MODIFIED 仅声明 `{id, intent}`
- **THEN** apply 后仅 `intent` 改变
- **AND** 其他未声明字段保持不变

#### Scenario: Delta relation 违反 endpoint contract
- **GIVEN** delta ADDED 包含 `belongs_to` 的 domain→capability relation
- **WHEN** dry-run merge 执行
- **THEN** merge validation SHALL 失败并指出 relation path 与 endpoint kinds

#### Scenario: Removed node 留下 relation
- **GIVEN** delta REMOVED 删除一个 node 但未使其关联 relations 从结果中消失
- **WHEN** dry-run merge 执行
- **THEN** semantic validation SHALL 失败并指出 dangling relations

#### Scenario: Merge 不处理 code-map
- **WHEN** v2 delta 被应用
- **THEN** result SHALL 只包含 project nodes 与 relations
- **AND** MUST NOT 产生 `code_map` 或 code-map file write

### Requirement: MODIFIED delta Schema 仅校验 id 和可变字段

Delta 的 MODIFIED section schema SHALL 仅要求 `id` 字段为必填，`intent` 和 `status` 为可选字段。`type`、`domain`、`boundary` 等标识性字段 SHALL NOT 被要求。

#### Scenario: MODIFIED 不写 type 字段通过校验

- **GIVEN** opsx-delta.yaml 的 MODIFIED section 中 capability 仅声明 `{id: cap.xxx, intent: "..."}` 不含 `type`
- **WHEN** `OpsxDeltaSchema.safeParse()` 执行
- **THEN** 校验通过（success: true）

#### Scenario: MODIFIED 不写 id 字段校验失败

- **GIVEN** opsx-delta.yaml 的 MODIFIED section 中 capability 声明不含 `id`
- **WHEN** `OpsxDeltaSchema.safeParse()` 执行
- **THEN** 校验失败，错误信息明确指出 `id` 字段缺失

### Requirement: REMOVED delta Schema 仅校验 id 字段

Delta 的 REMOVED section schema SHALL 仅要求 `id` 字段为必填。

#### Scenario: REMOVED 仅需 id 字段

- **GIVEN** opsx-delta.yaml 的 REMOVED section 中 capability 仅声明 `{id: cap.xxx}`
- **WHEN** `OpsxDeltaSchema.safeParse()` 执行
- **THEN** 校验通过
- **AND** 无需提供 type/intent/status/domain 等任何其他字段

### Requirement: ADDED section Schema 行为不变

Delta 的 ADDED section SHALL 保持现有的完整 node schema 校验要求。

#### Scenario: ADDED 缺少 type 字段校验失败

- **GIVEN** opsx-delta.yaml 的 ADDED section 中 capability 声明不含 `type`
- **WHEN** `OpsxDeltaSchema.safeParse()` 执行
- **THEN** 校验失败，错误信息明确指示所需字段

### Requirement: Zod 错误信息对缺失字段具有可诊断性

当 ADDED section 的 `type: z.literal(...)` 字段缺失时，错误信息 SHALL 明确指示字段缺失，而非产生 `expected "capability"` 的误导性输出。

#### Scenario: ADDED 缺失 type 时错误信息可诊断

- **GIVEN** opsx-delta.yaml 的 ADDED section 中 node 不含 `type` 字段
- **WHEN** `OpsxDeltaSchema.safeParse()` 执行失败
- **THEN** 错误信息 SHALL 包含"缺失"或"缺少"语义
- **AND** SHALL NOT 仅输出 `expected "capability"` 或 `expected "domain"` 的误导信息

### Requirement: Sync 命令的 Zod 校验错误以易读格式展示

`openspec sync` 在 delta 校验失败时 SHALL 以逐条、带路径的可读格式展示错误，而非输出完整 JSON dump。

#### Scenario: 校验失败时错误易读

- **GIVEN** opsx-delta.yaml 校验失败
- **WHEN** `openspec sync <change>` 执行
- **THEN** 错误输出 SHALL 包含人类可读的消息
- **AND** SHALL 指示出错的 section（ADDED/MODIFIED/REMOVED）和字段路径
- **AND** SHALL NOT 输出原始 JSON 字符串

