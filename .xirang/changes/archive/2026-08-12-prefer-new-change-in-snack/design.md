## Context

Snack 的 Change 选择由 Agent skill 指令决定。现有默认路径在 `<change-name>` 缺失时复用唯一 active Change，导致独立实现可能被调和进无关 Change。

## Goals / Non-Goals

**Goals:**
- 将默认选择改为创建独立 Change。
- 保留用户明确要求修改当前或指定已有 Change 的能力。
- 让名称冲突保持 fail-closed，不把新建意图静默改为更新。

**Non-Goals:**
- 不改变 `xirang new change`、`xirang list` 或 Change 存储格式。
- 不自动归并、重命名或关闭已有 Change。
- 不修改 Snack 的证据收集和 artifact reconciliation 规则。

## Decisions

- 在 canonical Snack skill 模板中表达模式选择，因为该行为属于 Agent workflow 编排，不需要新增 CLI 状态或命令参数。
- 默认新建模式从 implementation evidence 派生 kebab-case ID，并用 `xirang list --json` 检查是否未占用。
- 更新模式必须由用户明确触发；仅在用户明确说“当前 Change”但未给名称时，才从 active Change 列表解析目标。
- 新建 ID 已存在时要求用户提供不同 ID，不自动生成替代名称，也不转为更新。
- 受管 `.pi` skill 通过现有同步引擎从 canonical 模板重新生成。

## Risks / Trade-offs

- [Risk] evidence 无法形成清晰名称时需要额外交互 → 要求 Agent 询问 Change 名称，不猜测目标。
- [Trade-off] 连续迭代若未声明更新会产生新 Change → 这是为避免跨意图污染而接受的默认行为，用户可明确要求修改当前 Change。
