# arch-validate-command Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: arch validate 命令 SHALL 验证 LikeC4 语法

`openspec arch validate` SHALL 运行 LikeC4 原生验证检查语法。

#### Scenario: 验证语法正确的模型

- **GIVEN** LikeC4 模型语法正确
- **WHEN** 运行 `openspec arch validate`
- **THEN** SHALL 调用 `npx likec4 validate openspec/architecture/`
- **AND** 退出码 SHALL 为 0
- **AND** SHALL 输出 "✓ LikeC4 syntax validation passed"

#### Scenario: 验证失败时显示错误

- **GIVEN** LikeC4 模型语法错误
- **WHEN** 运行 `openspec arch validate`
- **THEN** SHALL 显示 likec4 错误输出
- **AND** 退出码 SHALL 为非零

### Requirement: arch validate SHALL 补充 OpenSpec 语义验证

arch validate SHALL 在 LikeC4 验证后执行 OpenSpec 特有的语义检查。

#### Scenario: 检查 ownership cardinality

- **GIVEN** 一个 capability 嵌套在多个 domains 中
- **WHEN** 运行 `openspec arch validate`
- **THEN** SHALL 检测到 ownership 违规
- **AND** SHALL 输出错误 "Capability <id> belongs to multiple domains"

#### Scenario: 检查 precedes cycle

- **GIVEN** LikeC4 模型包含 precedes cycle: A → B → C → A
- **WHEN** 运行 `openspec arch validate`
- **THEN** SHALL 检测到 cycle
- **AND** SHALL 输出错误 "Precedes cycle detected: A → B → C → A"
- **AND** precedes relations MUST 形成 DAG

#### Scenario: 检查每个 capability 恰有一个 domain

- **GIVEN** 一个 capability 没有嵌套在任何 domain 中
- **WHEN** 运行 `openspec arch validate`
- **THEN** SHALL 输出错误 "Capability <id> has no domain (missing nesting)"

### Requirement: arch validate SHALL 支持 --delta 选项

`--delta` 选项 SHALL 验证 change-local 的 architecture-delta.c4 文件。

#### Scenario: 验证 delta 文件

- **GIVEN** change 包含 `architecture-delta.c4`
- **WHEN** 运行 `openspec arch validate --delta openspec/changes/<name>/architecture-delta.c4`
- **THEN** SHALL 验证 delta 语法
- **AND** SHALL 检查引用的 elements 在 formal 模型中存在（extend 目标）
