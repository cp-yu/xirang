## ADDED Requirements

### Requirement: init SHALL 生成 LikeC4 架构目录

`openspec init` SHALL 创建 `openspec/architecture/` 目录结构，而非 OPSX YAML 文件。

#### Scenario: 初始化 LikeC4 架构结构

- **WHEN** 运行 `openspec init`
- **THEN** SHALL 创建 `openspec/architecture/` 目录
- **AND** SHALL 创建 `openspec/architecture/specification.c4` 模板
- **AND** SHALL 创建 `openspec/architecture/domains/` 目录
- **AND** SHALL 创建 `openspec/architecture/views.c4` 模板
- **AND** MUST NOT 创建 `openspec/project.opsx.yaml`
- **AND** MUST NOT 创建 `openspec/project.opsx.relations.yaml`

#### Scenario: specification.c4 模板内容

- **WHEN** init 生成 `specification.c4`
- **THEN** SHALL 包含 `specification { }`
- **AND** SHALL 定义 `element domain`
- **AND** SHALL 定义 `element capability`
- **AND** SHALL 定义所有 6 种 relationship kinds（invokes, consumes, precedes, constrains, validates）
- **AND** MUST NOT 定义 `relationship belongs_to`

#### Scenario: views.c4 模板内容

- **WHEN** init 生成 `views.c4`
- **THEN** SHALL 包含基础 `view index` 定义
- **AND** SHALL 包含 `include *` 和 `autoLayout TopBottom`

#### Scenario: 跨平台路径处理

- **WHEN** 创建目录和文件
- **THEN** 所有路径 SHALL 使用 `path.join('openspec', 'architecture', ...)`
- **AND** MUST NOT 硬编码斜杠
