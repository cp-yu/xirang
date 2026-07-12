## Context

[INFERRED FROM CODE] `checkFreshness()` 已经不把 `gitHeadCommit` 纳入 FRESH/STALE 的硬判定，但返回结构仍将 HEAD 差异放入 `checks` 和 `details`。`verify status` 的 JSON 消费者与 archive skill 因此可能把诊断字段当作失败证据。

## Goals / Non-Goals

**Goals:**

- 让 `freshness.status` 成为唯一的 freshness 重验证信号。
- 用独立 informational 字段表达 recorded/current Git HEAD 和是否匹配。
- 让成功文本输出明确区分信息与阻塞诊断。
- 保护 seal 后 checkpoint 推进 HEAD 时的 archive 复用行为。

**Non-Goals:**

- 不改变 evidence fingerprint、contractVersion、result status 的 freshness 硬条件。
- 不改变 `archiveCompatibility` 的终局状态规则。
- 不增加新的 CLI 命令、依赖、持久化 seal 标记或 OPSX 节点。

## Decisions

- `FreshnessResult.checks` 只保留决定 freshness 的检查项；`gitHeadCommit` 迁移到可选的 `information.gitHeadCommit`，包含 `matches` 以及可用时的 `recorded`、`current`。
- `checkFreshness()` 继续采样当前 HEAD，但不再把 HEAD 差异追加到 `details`；阻塞 formatter 不再解析或渲染 HEAD failure detail。
- `verify status` 成功文本将 HEAD 差异显示在 `Information` 段落；JSON 消费者直接读取 `freshness.status`，不从 `checks`、`details` 或 `information` 推导 stale。
- archive workflow 仅在 `MISSING` 或 `STALE` 时进入 full verify；`FRESH` 与 compatibility 分开处理。该决策保持现有代码中的硬判定，并把 agent 指引与 runtime 语义对齐。
- 使用现有 TypeScript、Commander.js、Vitest 和 artifact sync pipeline，不引入新的依赖或独立生成路径。

## Risks / Trade-offs

- [Risk] `checks.gitHeadCommit` 从 JSON 结构移除可能影响未更新的外部消费者 → [Mitigation] 将新字段命名为显式 `information.gitHeadCommit`，并在 CLI 与 archive skill 回归测试中固定迁移后的合约。
- [Risk] 诊断信息不再出现在失败 formatter 中可能降低 stale 排查时的 HEAD 可见性 → [Mitigation] 仅在成功状态的 `Information` 段落展示非阻塞 HEAD 差异，真正阻塞原因继续保留在 `details`。
- [Risk] archive skill 文案与 runtime gate 发生漂移 → [Mitigation] 保留模板来源测试、生成 skill 内容测试和 parity hash 测试。
