# likec4-semantic-validator Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: 语义验证器 SHALL 检查 ownership cardinality

验证器 SHALL 确保每个 capability 恰好嵌套在一个 domain 内。

#### Scenario: 检测缺失 ownership

- **GIVEN** LikeC4 模型中一个 capability 没有嵌套在任何 domain
- **WHEN** 运行语义验证
- **THEN** SHALL 返回错误 "Capability <id> has no domain (missing nesting)"

#### Scenario: 检测多重 ownership

- **GIVEN** 一个 capability 同时嵌套在两个 domains
- **WHEN** 运行语义验证
- **THEN** SHALL 返回错误 "Capability <id> belongs to multiple domains"

#### Scenario: 正确的 ownership 通过验证

- **GIVEN** 所有 capabilities 恰好嵌套在一个 domain
- **WHEN** 运行语义验证
- **THEN** ownership 检查 SHALL 通过

### Requirement: 验证器 SHALL 检测 precedes cycle

验证器 SHALL 确保 precedes relations 形成有向无环图（DAG）。

#### Scenario: 检测简单 cycle

- **GIVEN** precedes relations: A → B, B → C, C → A
- **WHEN** 运行语义验证
- **THEN** SHALL 检测到 cycle
- **AND** SHALL 返回错误 "Precedes cycle detected: A → B → C → A"

#### Scenario: 检测自环

- **GIVEN** precedes relation: A → A
- **WHEN** 运行语义验证
- **THEN** SHALL 检测到自环
- **AND** SHALL 返回错误 "Precedes self-loop detected: A → A"

#### Scenario: DAG 通过验证

- **GIVEN** precedes relations 形成 DAG
- **WHEN** 运行语义验证
- **THEN** precedes cycle 检查 SHALL 通过

### Requirement: 验证器 SHALL 检查 metadata 完整性

验证器 SHALL 检查 capability metadata 包含必需字段。

#### Scenario: 检查 capabilityId 字段

- **GIVEN** 一个 capability 的 metadata 缺少 `capabilityId`
- **WHEN** 运行语义验证
- **THEN** SHALL 返回警告 "Capability <element-id> missing capabilityId in metadata"

#### Scenario: 检查 specs 路径存在性

- **GIVEN** capability metadata 包含 `specs ['openspec/specs/nonexistent.md']`
- **AND** 该文件不存在
- **WHEN** 运行语义验证
- **THEN** SHALL 返回警告 "Spec file not found: openspec/specs/nonexistent.md"
- **AND** 路径检查 SHALL 使用 `path.join()` 和 `fs.existsSync()`

### Requirement: 验证器 SHALL 提供结构化错误输出

验证结果 SHALL 区分 errors 和 warnings，并提供清晰的消息。

#### Scenario: 结构化验证结果

- **WHEN** 运行语义验证
- **THEN** SHALL 返回对象：
  ```typescript
  {
    success: boolean,
    errors: Array<{ code: string, message: string, element?: string }>,
    warnings: Array<{ code: string, message: string, element?: string }>
  }
  ```
- **AND** errors 阻止验证通过
- **AND** warnings 不阻止验证通过

#### Scenario: 验证通过时无 errors

- **GIVEN** 所有语义检查通过
- **WHEN** 运行语义验证
- **THEN** SHALL 返回 `{ success: true, errors: [], warnings: [] }`
