## ADDED Requirements

### Requirement: Built-in Schema resolution

系统 SHALL 仅从 package 内置 Schema directory 解析固定 `spec-driven` 与 `bootstrap` Schema。Project-local `openspec/schemas/` 与 user data Schema directory MUST NOT 参与 lookup、listing、template resolution 或 shadowing。

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
- **THEN** `.openspec.yaml` SHALL 持久化该 Schema ID
- **AND** 后续 status、instructions 与 apply SHALL 使用该 binding

#### Scenario: 非内置 binding 不静默迁移
- **WHEN** config 或 change metadata 引用非内置 Schema
- **THEN** 读取 workflow context SHALL fail fast 并提供内置 ID remediation
- **AND** MUST NOT 静默改写磁盘文件或回退到 `spec-driven`

## REMOVED Requirements

### Requirement: Project-local schema resolution
**Reason**: Schema resolution 已收敛为固定内置集合。
**Migration**: 使用 package 内置 `spec-driven` 或 `bootstrap`。

### Requirement: Project schemas directory helper
**Reason**: Runtime 不再拥有 project-local Schema directory。
**Migration**: 使用 package Schema directory helper。

### Requirement: List schemas includes project-local
**Reason**: Schema listing 仅暴露固定内置集合。
**Migration**: 无。

### Requirement: Schema info includes project source
**Reason**: Schema source 恒为 package，不再存在 project/user source。
**Migration**: 消费方按 built-in Schema info 处理。

### Requirement: Schemas command shows source
**Reason**: 多来源和 shadowing 已删除。
**Migration**: `schemas` 输出固定内置集合。

### Requirement: Use config schema as default for new changes
**Reason**: 旧 Requirement 允许任意 custom Schema；该能力由 `Built-in Schema binding` 取代。
**Migration**: `config.schema` 仅使用内置 ID。

### Requirement: Resolve schema with updated precedence order
**Reason**: 旧 Requirement 的 precedence 包含 custom resolution 语义；由 `Built-in Schema binding` 取代。
**Migration**: 保留 precedence，但限制值域。

### Requirement: Support project-local schema names in config
**Reason**: Project-local Schema 已删除。
**Migration**: 配置 `spec-driven` 或 `bootstrap`。

### Requirement: Provide helpful error message for invalid schema
**Reason**: 旧错误合同区分 built-in 与 project-local；由固定内置错误合同取代。
**Migration**: 错误只列出两个内置 ID。

### Requirement: Maintain backwards compatibility for existing changes
**Reason**: 非内置 Schema binding 不再受支持，静默兼容会导致错误 workflow 编译。
**Migration**: 明确迁移 change metadata 后再继续。
