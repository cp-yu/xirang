---
entity: element-declaration
identity: snack-workflow
kind: element
parent: snack
title: Snack Workflow
definition: Snack Workflow 定义 snack 从已写代码反向 reconcile proposal、delta Contracts、design 与 Semantic Delta 的 code-first workflow：条件式 artifact reconcile、多源代码证据、独立判断 Behavior/Architecture Source impact、definition-first authoring、不生成 `tasks.md` 与自检流程。
---

## MODIFIED Requirements

### Requirement: Snack 条件式 reconcile artifacts

Snack SHALL 默认创建新的 Change，并 SHALL 仅在用户明确要求修改当前或已有 Change 时更新已有 Change。Snack SHALL 将 `proposal.md`、`design.md`、delta Contracts 与 Semantic Delta 分类为 missing、stale、inconsistent 或 current，仅修改 missing、stale 或 inconsistent 内容。

#### Scenario: 默认创建新 Change

- **WHEN** 用户调用 Snack 且未明确要求修改当前或已有 Change
- **THEN** Snack SHALL 从 implementation evidence 拟定新的 kebab-case Change ID
- **AND** SHALL 使用 `xirang list --json` 确认该 ID 未被占用
- **AND** SHALL 执行 `xirang new change "<name>"`
- **AND** SHALL 只创建 evidence 需要的 artifacts

#### Scenario: Implementation evidence 无法形成清晰 ID

- **WHEN** 用户未提供 Change ID 且 implementation evidence 无法形成清晰的新 ID
- **THEN** Snack SHALL 询问用户提供 Change ID
- **AND** SHALL NOT 猜测 Change ID

#### Scenario: 明确更新已有 Change

- **WHEN** 用户明确要求修改指定的已有 Change
- **THEN** Snack SHALL 使用该 Change ID 进入更新模式
- **AND** SHALL 先读取已有 artifacts
- **AND** SHALL 保留 unrelated human-authored content

#### Scenario: 明确更新当前 Change 但未命名

- **WHEN** 用户明确要求修改当前 Change 但未提供 Change ID
- **THEN** Snack SHALL 使用 `xirang list --json` 解析唯一 active Change
- **AND** active Change 为多个或不存在时 SHALL 询问目标 Change

#### Scenario: 新建 Change ID 已存在

- **WHEN** 默认新建模式拟定或接收的 Change ID 已存在且用户未明确要求更新
- **THEN** Snack SHALL 停止并要求不同的 Change ID
- **AND** SHALL NOT 将已存在的 Change ID 本身解释为更新意图
- **AND** SHALL NOT 更新该已有 Change
- **AND** SHALL NOT 自动生成替代 ID
