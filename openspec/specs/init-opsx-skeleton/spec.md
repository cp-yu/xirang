# init-opsx-skeleton Specification

## Purpose
此规约记录变更 init-opsx-skeleton 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: OPSX Skeleton Generation on Init

`openspec init` SHALL 在首次初始化（非 extend 模式）时仅在目标不存在时创建两个 OPSX v2 骨架：`openspec/project.opsx.yaml` 与 `openspec/project.opsx.relations.yaml`。两个文件 SHALL 包含 `schema_version: 2`；系统 MUST NOT 创建 `project.opsx.code-map.yaml`。

`project.opsx.yaml` 中的 `project.id` 和 `project.name` SHALL 优先使用 `package.json.name`，否则使用项目根目录 basename，并转换为合法 ID。

#### Scenario: First-time init generates two OPSX v2 skeletons
- **GIVEN** 项目中 `openspec/` 目录不存在
- **WHEN** 运行 `openspec init`
- **THEN** 系统 SHALL 生成 `project.opsx.yaml` 与 `project.opsx.relations.yaml`
- **AND** project 文件 SHALL 包含空 `domains` 与 `capabilities`
- **AND** relations 文件 SHALL 包含空 `relations`
- **AND** MUST NOT 生成 `project.opsx.code-map.yaml`

#### Scenario: Extend mode preserves existing OPSX files
- **GIVEN** `openspec/` 已存在且包含用户编辑的 OPSX 文件
- **WHEN** 运行 `openspec init`
- **THEN** 系统 SHALL NOT 覆盖或修改已有 OPSX 文件
- **AND** SHALL NOT 补写 code-map

#### Scenario: Skeleton files use safe cross-platform paths
- **WHEN** 生成 OPSX 骨架
- **THEN** 文件路径 SHALL 使用 Node.js `path` API 与显式文件名常量构造
- **AND** MUST NOT 依赖特定操作系统路径分隔符

### Requirement: Bootstrap Guidance in Init Success Output

`openspec init` 成功提示 SHALL 在 getting started 区块之后、链接之前，显式引导用户运行 `/opsx:bootstrap` 完成架构映射。

#### Scenario: Bootstrap guidance shown when bootstrap is in the fixed set

- **GIVEN** `bootstrap-opsx` workflow 在固定工作流集合中
- **AND** 非 extend 模式（首次 init）
- **AND** getting started 区块已显示
- **WHEN** 输出成功提示
- **THEN** 显示引导行："Next: run /opsx:bootstrap to map your architecture"

#### Scenario: Bootstrap guidance NOT shown when bootstrap is not selected

- **GIVEN** `bootstrap-opsx` workflow 不在固定工作流集合中
- **WHEN** 输出成功提示
- **THEN** SHALL NOT 显示 `/opsx:bootstrap` 引导行

#### Scenario: Bootstrap guidance NOT shown in extend mode

- **GIVEN** 当前为 extend 模式（`openspec/` 已存在）
- **WHEN** 输出成功提示
- **THEN** SHALL NOT 显示 `/opsx:bootstrap` 引导行
