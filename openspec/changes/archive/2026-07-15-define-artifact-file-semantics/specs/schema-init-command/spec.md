## REMOVED Requirements

### Requirement: Schema init command creates project-local schema
**Reason**: OpenSpec 仅支持内置 `spec-driven` 与 `bootstrap`，不再创建 project-local Schema。
**Migration**: 选择现有内置 Schema。

### Requirement: Schema init supports interactive mode
**Reason**: `schema init` 命令整体删除。
**Migration**: 无。

### Requirement: Schema init supports setting project default
**Reason**: 不再通过创建 custom Schema 设置 default。
**Migration**: 在 `openspec/config.yaml` 中选择合法内置 `schema`。

### Requirement: Schema init outputs JSON format
**Reason**: `schema init` 命令整体删除。
**Migration**: 无。
