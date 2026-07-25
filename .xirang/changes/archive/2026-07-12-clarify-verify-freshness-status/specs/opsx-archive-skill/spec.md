## ADDED Requirements

### Requirement: Archive verify freshness routing

`/opsx:archive` skill SHALL 根据 `openspec verify status <change-name> --json` 返回的 `freshness.status` 路由 verify 执行。

#### Scenario: FRESH 结果包含 informational HEAD 差异

- **WHEN** `freshness.status` 为 `FRESH`
- **AND** `archiveCompatibility.compatible` 为 `true`
- **AND** `freshness.information.gitHeadCommit.matches` 为 `false`
- **THEN** skill SHALL 复用已有 verify result
- **AND** SHALL NOT 从 `checks`、`details` 或 `information` 推断 stale
- **AND** SHALL NOT 仅因 Git HEAD 信息差异重新执行 reviewer

#### Scenario: MISSING 或 STALE 结果

- **WHEN** `freshness.status` 为 `MISSING` 或 `STALE`
- **THEN** skill SHALL 在继续 archive 前执行 full verify contract
- **AND** SHALL 在 full verify 完成后重新执行 status gate

#### Scenario: Informational 字段不覆盖 compatibility

- **WHEN** `freshness.status` 为 `FRESH`
- **AND** `archiveCompatibility.compatible` 为 `false`
- **THEN** skill SHALL 独立处理不兼容的 optimization 状态
- **AND** SHALL NOT 将 informational Git HEAD 字段视为 freshness stale 证据
