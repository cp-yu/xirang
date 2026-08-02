---
entity: element-declaration
identity: show-command
kind: capability
parent: deterministic-operations
title: Show Command
definition: Show Command 定义顶层 `xirang show` 的行为：无参数时以交互式列表选择活动 Change，直接展示只接受活动 Change；text 输出返回该 Change 的 `proposal.md`，JSON 输出返回编译后的 Change summary、entries 与 diagnostics。它只表达当前 active Change surface，不提供 Element 或 Contract 选择。
---

## Requirements

### Requirement: Top-level show command

CLI SHALL 提供顶层 `show` 命令，用于展示活动 Changes。

#### Scenario: Interactive show selection

- **WHEN** 执行 `xirang show` 而不带参数且 stdin 为 TTY
- **THEN** 列出活动 Changes 供用户选择，然后展示选中 Change

#### Scenario: 无活动 Changes

- **WHEN** 执行 `xirang show` 而不带参数
- **AND** 不存在活动 Change
- **THEN** 显示 "No changes found." 并以 exit code 1 退出

#### Scenario: Non-interactive environments do not prompt

- **GIVEN** stdin 不是 TTY 或提供了 `--no-interactive` 或设置了 `XIRANG_INTERACTIVE=0`
- **WHEN** 执行 `xirang show` 而不带参数
- **THEN** 不提示并打印示例提示（`xirang show <change>`）
- **AND** 以 exit code 1 退出

### Requirement: 直接展示仅接受活动 Change

`xirang show <change>` SHALL 只接受活动 Change 名称；非活动 Change 或任何其他名称 SHALL 被拒绝并给出 not-found 提示。

#### Scenario: 展示活动 Change

- **WHEN** 执行 `xirang show <change>` 且 `<change>` 是活动 Change
- **THEN** 展示该 Change

#### Scenario: 未知或非活动 Change 被拒绝

- **WHEN** `<change>` 不是活动 Change（不存在或已归档）
- **THEN** 打印 `Unknown item '<change>'` 错误
- **AND** 给出最近匹配建议（如有）
- **AND** 以 exit code 1 退出

### Requirement: 文本输出返回 proposal.md

`xirang show <change>` 的文本输出 SHALL 读取并输出该活动 Change 的 `proposal.md` 内容。

#### Scenario: 文本展示 proposal

- **WHEN** 用户不带 `--json` 执行 `xirang show <change>`
- **THEN** CLI 读取 `.xirang/changes/<change>/proposal.md` 并输出其内容

### Requirement: JSON 输出返回编译结果

`xirang show <change> --json` SHALL 编译该活动 Change 并输出包含 Change 身份、title、valid、summary、entries 与 diagnostics 的 JSON。

#### Scenario: JSON 输出

- **WHEN** 用户执行 `xirang show <change> --json`
- **THEN** CLI 编译该 Change 并输出 JSON，包含 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 与稳定 identity 表达的 concise `entries` 及 compiler `diagnostics`
