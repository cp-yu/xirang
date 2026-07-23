## MODIFIED Requirements

### Requirement: Prerequisites
Update command SHALL 要求现有 `.opsx/` workspace，才能刷新 managed surfaces。

#### Scenario: Workspace 缺失
- **WHEN** `.opsx/` 不存在
- **THEN** update SHALL 失败，并指引运行 `opsx setup`
- **AND** SHALL NOT 创建 partial workspace

### Requirement: Update detects new tool directories
Update command SHALL 报告新检测到的 AI tool directories，并指引用户运行 `opsx setup` 进行配置。

#### Scenario: 检测到新工具
- **WHEN** supported tool directory 存在，但没有 managed OPSX skills
- **THEN** update SHALL 报告该工具
- **AND** SHALL NOT 静默配置该工具
- **AND** SHALL 指引用户运行 `opsx setup`

### Requirement: Update requires an OPSX project
`opsx update` SHALL 只在包含 `.opsx/` 的项目内运行。

#### Scenario: 在 OPSX 项目外运行
- **WHEN** `.opsx/` directory 不存在
- **THEN** update SHALL 报告 OPSX project 缺失，并提供 `opsx setup` remediation
- **AND** SHALL 以非零状态退出

### Requirement: Extra workflows synchronized to the fixed workflow set
Update SHALL 使用显式 managed-name list 删除不属于 `propose`、`explore`、`apply`、`archive`、`build`、`snack` 的 managed skill artifacts。

#### Scenario: Retired Build skill
- **WHEN** managed `opsx-bootstrap-arch` skill 存在
- **THEN** update SHALL 删除该 skill
- **AND** SHALL 生成或刷新 `opsx-build`
- **AND** SHALL NOT 删除 user-authored skills

### Requirement: 固定工作流更新
`opsx update` SHALL 刷新全部六个 fixed workflow skills，并 SHALL NOT 读取 retired workflow-selection settings。

#### Scenario: Fixed workflow refresh
- **WHEN** update 在 configured project 中运行
- **THEN** SHALL 收敛到 `opsx-propose`、`opsx-explore`、`opsx-apply-change`、`opsx-archive-change`、`opsx-build`、`opsx-snack`
- **AND** SHALL NOT 创建 bootstrap slash commands

## ADDED Requirements

### Requirement: Update SHALL 归档退役的 OPSX workspace
当 update 或 setup 发现 `.opsx/bootstrap/`、`.opsx/bootstrap-history/` 或 `.opsx/migration-candidate/` 时，SHALL 在用户确认后将其移动到显式 `.opsx/history/legacy-<timestamp>/` entry。

#### Scenario: Retired workspace cleanup
- **WHEN** 检测到 retired workspace 且用户确认 cleanup
- **THEN** SHALL 完整移动该 directory，并用 manifest 记录原始 relative path
- **AND** OPSX runtime SHALL 不再读取旧 active path

#### Scenario: 用户拒绝 cleanup
- **WHEN** 用户拒绝 cleanup
- **THEN** setup/update SHALL 失败
- **AND** SHALL NOT 删除或部分移动 retired workspace
