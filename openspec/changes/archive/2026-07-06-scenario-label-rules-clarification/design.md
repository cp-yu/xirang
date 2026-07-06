## Context

Scenario operation labels (`[ADDED]`/`[MODIFIED]`/`[REMOVED]`) 是两层标签系统：section 级（`## ADDED/MODIFIED/REMOVED Requirements`）和 scenario 级。之前 validator 接受无标签 scenario，prompts 只说"可以用"而不说"什么时候该用"，导致 agent 不主动添加标签，设计形同虚设。

## Goals / Non-Goals

- **Goals**: 明确标签交互规则，MODIFIED 下强制执行标签，ADDED 下明确不加，错误信息加语义解释
- **Non-Goals**: 不改 parser 结构，不改 sync 逻辑，不改 REMOVED section 的行为

## Decisions

1. **MODIFIED 强制标签**: 每个 scenario 必须带标签，validator 拒绝无标签。这是唯一需要场景级标签的 section。
2. **ADDED 不要求标签**: 隐式全部新增，`[ADDED]` 冗余但不报错，`[MODIFIED]`/`[REMOVED]` 报错并建议改用 MODIFIED section。
3. **错误信息加 why**: 每条标签约束错误解释语义原因 + 给出正确用法建议。
4. **提示词精简**: 一段话替代表格，减少 agent 认知负担。

## Risks / Trade-offs

- [Risk] 已有 change 中 MODIFIED 下无标签的 delta spec → validate 报错。Mitigation: 当前活跃 change 均有标签，无已知 break。
- [Risk] Agent 短期不习惯强约束 → 频繁被 block。Mitigation: 错误信息包含正确做法，降低 try-and-error 成本。
