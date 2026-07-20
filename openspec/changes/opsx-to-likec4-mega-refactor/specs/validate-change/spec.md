## ADDED Requirements

### Requirement: validate change SHALL 支持 architecture-delta.c4

change 验证 SHALL 验证 `architecture-delta.c4` 而非 `opsx-delta.yaml`。

#### Scenario: 验证 delta 文件存在

- **GIVEN** change schema 需要架构 artifact
- **WHEN** 运行 `openspec validate --change <name>`
- **THEN** SHALL 检查 `architecture-delta.c4` 存在
- **AND** MUST NOT 检查 `opsx-delta.yaml`

#### Scenario: 验证 delta 语法

- **WHEN** 验证包含 `architecture-delta.c4` 的 change
- **THEN** SHALL 运行 `npx likec4 validate` 检查语法
- **AND** 语法错误 SHALL 导致验证失败

#### Scenario: 验证 extend 目标存在

- **GIVEN** `architecture-delta.c4` 包含 `extend some_domain`
- **WHEN** 验证
- **THEN** SHALL 检查 `some_domain` 在 formal 模型中存在
- **AND** 不存在 SHALL 返回错误
