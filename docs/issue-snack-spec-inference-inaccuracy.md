# Historical Issue: snack spec 推断不准确导致归档验证失败

> Historical record for OpenSpec v1.2.0-cpyu.9. The original diagnosis depended on the removed OPSX v1 persisted path mapping. Current snack behavior uses OPSX v2 capability intents and semantic relations, `openspec list --specs --json`, and live code evidence from optional CodeGraph or ACE/`rg`/`read`.

## 问题

snack 曾将“已有 capability”误等同于“已有 requirement”，导致新增行为被生成为 `## MODIFIED Requirements`。它也会从代码变化重新推断 spec 目录，而不是复用 capability 已覆盖的 main spec 目录。

结果是 change validation 报告：

```text
MODIFIED requirement references a non-existent main requirement.
```

## 正确判定

生成 delta spec 前应：

1. 从代码变更、capability intent、semantic relation 与 spec coverage 确定候选 capability。
2. 运行 `openspec list --specs --json` 获取 capability 到 main spec 的映射。
3. 读取目标 main spec 并按 requirement 标题判断操作：
   - main spec 或 requirement 不存在：`ADDED`
   - requirement 已存在且行为变化：`MODIFIED`
   - 外部行为未变化：不生成 delta requirement
4. 无法唯一映射 capability 或 requirement 时标记 `[REVIEW NEEDED]`，不得静默创建确定性结论。

## 当前证据边界

OPSX v2 不持久化实现路径。CodeGraph 可在已安装且已索引时提供 symbol/call/import evidence；否则 snack 使用 ACE、`rg` 与 `read`。这些代码事实用于辅助 capability 映射，不能替代 capability intent、semantic relations 或 main spec contracts。

## 回归场景

- main spec 不存在时使用 `ADDED`
- main spec 存在但 requirement 标题不存在时使用 `ADDED`
- requirement 标题存在时使用 `MODIFIED`
- 已覆盖 capability 复用现有 main spec 目录
- 模糊映射输出 `[REVIEW NEEDED]`
- 纯内部重构不生成行为 delta
