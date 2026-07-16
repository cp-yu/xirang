## ADDED Requirements

### Requirement: Global config 静默过滤退役的 Propose routing 配置

Global config loader SHALL 从返回配置和默认配置中移除 `propose.smartRouting`、`propose.requireExplore` 与顶层 `propose` routing 节点。已有磁盘配置中的该节点 SHALL 被静默忽略，不得产生 warning；其他未知字段仍 SHALL 按既有 forward compatibility 合同保留。

#### Scenario: 旧 global Propose 节点静默忽略
- **WHEN** global `config.json` 包含 `propose.smartRouting` 或 `propose.requireExplore`
- **THEN** `getGlobalConfig()` SHALL NOT 返回 `propose`
- **AND** SHALL NOT 输出 warning
- **AND** SHALL 保留其他合法和未知字段

#### Scenario: 默认配置不再包含 Propose routing
- **WHEN** global config 不存在或执行 config reset
- **THEN** default global config SHALL NOT 包含 `propose`
