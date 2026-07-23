## MODIFIED Requirements

### Requirement: Legacy artifact detection
Setup/update SHALL 检测 legacy generated Agent surfaces 和退役的 OPSX managed workspaces，包括 `.opsx/bootstrap/`、`.opsx/bootstrap-history/` 与 `.opsx/migration-candidate/`。

#### Scenario: 检测退役 workspace
- **WHEN** setup 或 update 运行
- **THEN** SHALL 使用 project-relative path 报告每个 retired workspace
- **AND** SHALL NOT 将其视为 active semantic source

### Requirement: Legacy cleanup confirmation
系统 SHALL 在删除或移动 legacy generated artifacts 与 retired workspaces 前要求 explicit user confirmation。

#### Scenario: 用户确认 cleanup
- **WHEN** 用户确认 cleanup
- **THEN** managed legacy artifacts SHALL 被清理，retired workspaces SHALL 移动到 `.opsx/history/legacy-<timestamp>/`
- **AND** cleanup manifest SHALL 记录原始路径

#### Scenario: 用户拒绝 cleanup
- **WHEN** 用户拒绝 cleanup
- **THEN** setup/update SHALL 停止
- **AND** SHALL NOT 进行 partial deletion 或 movement

### Requirement: Cleanup reporting
Cleanup SHALL 报告已移动的 retired workspaces、已删除的 managed skill surfaces、保留的 user files 和仍需手动处理的内容。

#### Scenario: Cleanup summary
- **WHEN** cleanup 完成
- **THEN** output SHALL 列出每个显式 path action
- **AND** SHALL 说明 history entries 只是 audit evidence，不是 runtime fallback source
