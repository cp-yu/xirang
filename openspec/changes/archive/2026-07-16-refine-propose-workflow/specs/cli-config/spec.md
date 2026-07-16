## ADDED Requirements

### Requirement: Config CLI 拒绝写入退役的 Propose routing 路径

`openspec config set` SHALL 将 `propose`、`propose.smartRouting` 与 `propose.requireExplore` 视为已移除的配置路径，不得将其写入 global config。

#### Scenario: 默认拒绝退役 Propose 路径
- **WHEN** 用户执行 `openspec config set propose.smartRouting false` 或 `openspec config set propose.requireExplore false`
- **THEN** command SHALL 报告该路径已移除或无效
- **AND** SHALL NOT 修改 config file
- **AND** SHALL 以 exit code 1 退出

#### Scenario: allow-unknown 不恢复退役路径
- **WHEN** 用户对 `propose` routing 路径使用 `--allow-unknown`
- **THEN** command SHALL 仍拒绝该已知退役路径
- **AND** SHALL NOT 将其作为普通未知字段保存
