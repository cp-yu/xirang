## ADDED Requirements

### Requirement: arch query 命令 SHALL 查询 LikeC4 element 详情

`openspec arch query <element-id>` SHALL 读取 LikeC4 架构模型并输出指定 element 的详细信息。

#### Scenario: 查询 capability element

- **GIVEN** LikeC4 模型包含 `ai_integration.skill_generation` capability
- **WHEN** 运行 `openspec arch query cap.ai.skill-generation`
- **THEN** SHALL 输出 "Element: cap.ai.skill-generation"
- **AND** SHALL 输出 "Type: capability"
- **AND** SHALL 输出 description
- **AND** SHALL 输出关联的 specs 路径列表

### Requirement: arch query SHALL 支持 --relations 选项

添加 `--relations` 选项 SHALL 包含该 element 的所有 directed relations。

#### Scenario: 查询 element 及其 relations

- **GIVEN** `skill_generation` 有 3 个 outgoing relations
- **WHEN** 运行 `openspec arch query cap.ai.skill-generation --relations`
- **THEN** SHALL 输出 "Relations:"
- **AND** SHALL 列出所有 relations：`cap.ai.skill-generation --<type>--> <target>`
- **AND** SHALL 包含 relationship description

### Requirement: arch query SHALL 支持 --depth 选项

`--depth N` 选项 SHALL 递归查询关联 elements 到指定深度。

#### Scenario: 深度 2 查询

- **WHEN** 运行 `openspec arch query cap.ai.skill-generation --relations --depth 2`
- **THEN** SHALL 包含直接关联的 elements（depth 1）
- **AND** SHALL 包含间接关联的 elements（depth 2）
- **AND** SHALL 标注每个 element 的深度级别

### Requirement: arch query SHALL 支持 --json 输出

添加 `--json` 选项 SHALL 输出 JSON 格式的查询结果。

#### Scenario: JSON 格式输出

- **WHEN** 运行 `openspec arch query cap.ai.skill-generation --relations --json`
- **THEN** SHALL 输出有效的 JSON
- **AND** JSON SHALL 包含 `element` 对象
- **AND** JSON SHALL 包含 `relations` 数组（如果 --relations）

### Requirement: arch query SHALL 处理不存在的 element

查询不存在的 element SHALL 抛出清晰的错误。

#### Scenario: Element 不存在

- **WHEN** 运行 `openspec arch query cap.nonexistent.feature`
- **THEN** SHALL 退出码为非零
- **AND** SHALL 输出 "Element not found: cap.nonexistent.feature"
