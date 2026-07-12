## ADDED Requirements

### Requirement: Verify status output semantics

系统 SHALL 提供 `openspec verify status <change-name>` 命令，并在 JSON 与文本输出中区分 freshness 判定、阻塞检查和非阻塞 informational 诊断。

#### Scenario: JSON status exposes HEAD information separately

- **WHEN** agent 执行 `openspec verify status <change-name> --json`
- **AND** verification context 中记录的 Git HEAD 与当前 HEAD 不一致
- **AND** 其他 freshness 硬条件均通过
- **THEN** 输出 SHALL 将 `freshness.status` 设为 `FRESH`
- **AND** `freshness.checks` SHALL NOT 包含 `gitHeadCommit`
- **AND** `freshness.details` SHALL NOT 包含 Git HEAD failure 或 warning 条目
- **AND** 输出 SHALL 在 `freshness.information.gitHeadCommit` 中包含 `matches: false`
- **AND** 两个 HEAD 值均可用时 SHALL 包含 `recorded` 与 `current`

#### Scenario: Text status labels HEAD drift as information

- **WHEN** `openspec verify status <change-name>` 返回 FRESH 且 Git HEAD 信息不匹配
- **THEN** 文本输出 SHALL 包含 `Verify gate passed.`
- **AND** SHALL 使用 `Information:` 展示 HEAD 差异
- **AND** SHALL NOT 使用 `Warnings:` 表示该 HEAD 差异

#### Scenario: Freshness status remains the decision signal

- **WHEN** agent 消费 `verify status --json` 输出决定是否重新执行 full verify
- **THEN** agent SHALL 仅依据 `freshness.status` 判断 freshness
- **AND** SHALL NOT 从 `freshness.checks`、`freshness.details` 或 `freshness.information` 推导 STALE
