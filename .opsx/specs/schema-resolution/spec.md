# schema-resolution Specification

## Purpose
Define project-local schema resolution behavior, including precedence order (project-local, then user override, then package built-in) and backward-compatible fallback when `projectRoot` is not provided.
## Requirements
### Requirement: Built-in Schema resolution

系统 SHALL 仅从 package 内置 Schema directory 解析固定 `spec-driven` 与 `bootstrap` Schema。Project-local `opsx/schemas/` 与 user data Schema directory MUST NOT 参与 lookup、listing、template resolution 或 shadowing。

#### Scenario: 内置 Schema 解析
- **WHEN** 系统解析 `spec-driven` 或 `bootstrap`
- **THEN** SHALL 返回对应 package Schema directory
- **AND** SHALL 加载其 `schema.yaml` 与 templates

#### Scenario: Project 与 user override 被忽略
- **GIVEN** project-local 或 user data directory 存在同名或其他 Schema
- **WHEN** 系统列出或解析 Schema
- **THEN** 结果 SHALL 只包含 package 内置 `spec-driven` 与 `bootstrap`
- **AND** SHALL NOT 报告 shadowing

#### Scenario: 未知 Schema 明确失败
- **WHEN** 系统解析其他 Schema ID
- **THEN** SHALL 报告 Schema 不存在
- **AND** SHALL 列出固定合法 ID

### Requirement: Built-in Schema binding

New change、project config、change metadata 与 workflow CLI SHALL 保留 Schema binding，但合法值 SHALL 限于 `spec-driven` 与 `bootstrap`。Resolution precedence SHALL 保持 explicit CLI option → change metadata → project config → `spec-driven` default。

#### Scenario: Change 持久化内置 binding
- **WHEN** 创建 change 时选择一个内置 Schema
- **THEN** `.opsx.yaml` SHALL 持久化该 Schema ID
- **AND** 后续 status、instructions 与 apply SHALL 使用该 binding

#### Scenario: 非内置 binding 不静默迁移
- **WHEN** config 或 change metadata 引用非内置 Schema
- **THEN** 读取 workflow context SHALL fail fast 并提供内置 ID remediation
- **AND** MUST NOT 静默改写磁盘文件或回退到 `spec-driven`
