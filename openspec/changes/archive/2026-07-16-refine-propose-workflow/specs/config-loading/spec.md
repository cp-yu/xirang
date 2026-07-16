## ADDED Requirements

### Requirement: Project config 静默忽略退役的 Propose routing 配置

Project config loader SHALL 将顶层 `propose` routing 节点视为退役配置。它 MUST NOT 将 `propose.smartRouting`、`propose.requireExplore` 或整个 `propose` 节点暴露到 `ProjectConfig`、normalized config 或 config projection，且 MUST NOT 因这些退役字段输出 warning 或改写用户配置文件。

#### Scenario: 旧 Propose routing 节点静默忽略
- **WHEN** `openspec/config.yaml` 包含 `propose.smartRouting` 或 `propose.requireExplore`
- **THEN** loader SHALL 继续解析其他有效字段
- **AND** 返回的 ProjectConfig SHALL NOT 包含 `propose`
- **AND** SHALL NOT 输出退役或非法字段 warning
- **AND** SHALL NOT 修改 `openspec/config.yaml`

#### Scenario: 退役节点不进入 projection
- **WHEN** project config 包含旧 `propose` 节点
- **THEN** `NormalizedProjectConfig` 与 artifact instructions 的 `configProjection.normalized` SHALL NOT 包含 `propose`
- **AND** Propose workflow behavior SHALL NOT 受该节点影响
