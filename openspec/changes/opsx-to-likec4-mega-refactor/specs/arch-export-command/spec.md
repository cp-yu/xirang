## ADDED Requirements

### Requirement: arch export 命令 SHALL 导出架构图

`openspec arch export` SHALL 将 LikeC4 架构图导出为图片文件。

#### Scenario: 导出 PNG 格式

- **WHEN** 运行 `openspec arch export --format png --output docs/architecture/`
- **THEN** SHALL 调用 `npx likec4 export png -o docs/architecture/`
- **AND** SHALL 在 `docs/architecture/` 目录生成 PNG 文件
- **AND** 输出路径 SHALL 使用 `path.join()` 构建

#### Scenario: 支持多种格式

- **WHEN** 运行 `openspec arch export --format svg --output docs/`
- **THEN** SHALL 支持 `--format` 选项值：png, svg, pdf
- **AND** SHALL 传递给 likec4 export 命令

### Requirement: arch export SHALL 创建输出目录

如果输出目录不存在，SHALL 自动创建。

#### Scenario: 创建不存在的目录

- **GIVEN** `docs/architecture/` 不存在
- **WHEN** 运行 `openspec arch export --output docs/architecture/`
- **THEN** SHALL 创建目录
- **AND** SHALL 导出图片到该目录
