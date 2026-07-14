## MODIFIED Requirements

### Requirement: OPSX Skeleton Generation on Init

`openspec init` SHALL 在首次初始化（非 extend 模式）时仅在目标不存在时创建两个 OPSX v2 骨架：`openspec/project.opsx.yaml` 与 `openspec/project.opsx.relations.yaml`。两个文件 SHALL 包含 `schema_version: 2`；系统 MUST NOT 创建 `project.opsx.code-map.yaml`。

`project.opsx.yaml` 中的 `project.id` 和 `project.name` SHALL 优先使用 `package.json.name`，否则使用项目根目录 basename，并转换为合法 ID。

#### Scenario: [ADDED] First-time init generates two OPSX v2 skeletons
- **GIVEN** 项目中 `openspec/` 目录不存在
- **WHEN** 运行 `openspec init`
- **THEN** 系统 SHALL 生成 `project.opsx.yaml` 与 `project.opsx.relations.yaml`
- **AND** project 文件 SHALL 包含空 `domains` 与 `capabilities`
- **AND** relations 文件 SHALL 包含空 `relations`
- **AND** MUST NOT 生成 `project.opsx.code-map.yaml`

#### Scenario: [ADDED] Extend mode preserves existing OPSX files
- **GIVEN** `openspec/` 已存在且包含用户编辑的 OPSX 文件
- **WHEN** 运行 `openspec init`
- **THEN** 系统 SHALL NOT 覆盖或修改已有 OPSX 文件
- **AND** SHALL NOT 补写 code-map

#### Scenario: [MODIFIED] Skeleton files use safe cross-platform paths
- **WHEN** 生成 OPSX 骨架
- **THEN** 文件路径 SHALL 使用 Node.js `path` API 与显式文件名常量构造
- **AND** MUST NOT 依赖特定操作系统路径分隔符

#### Scenario: [REMOVED] First-time init generates OPSX skeletons

- **GIVEN** 项目中 `openspec/` 目录不存在
- **WHEN** 运行 `openspec init`
- **THEN** 系统 SHALL 在 AI 工具配置前，生成 `openspec/project.opsx.yaml`、`openspec/project.opsx.relations.yaml`、`openspec/project.opsx.code-map.yaml` 三个骨架文件
- **AND** `project.opsx.yaml` SHALL 包含空的 `domains` 和 `capabilities` 数组
- **AND** `project.opsx.relations.yaml` SHALL 包含空的 `relations` 数组
- **AND** `project.opsx.code-map.yaml` SHALL 包含空的 `nodes` 数组

#### Scenario: [REMOVED] Extend mode does NOT overwrite existing OPSX files

- **GIVEN** `openspec/` 目录已存在，且包含用户已编辑的 `project.opsx.yaml`
- **WHEN** 运行 `openspec init`（extend 模式）
- **THEN** 系统 SHALL NOT 覆盖或修改已有的 `project.opsx.yaml`、`project.opsx.relations.yaml`、`project.opsx.code-map.yaml`
