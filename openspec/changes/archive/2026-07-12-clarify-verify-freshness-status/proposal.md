## Why

`openspec verify status --json` 当前把非阻塞的 Git HEAD 差异同时表现为失败型 check 和诊断 detail，容易让 archive agent 将 `FRESH` 误判为需要重新 reviewer。需要明确区分 freshness 判定与诊断信息，避免 Phase 2 checkpoint 或 seal 后的正常 HEAD 变化触发重复验证。

## What Changes

- 将 Git HEAD 差异从 `freshness.checks` 与 `freshness.details` 移至独立的 `freshness.information.gitHeadCommit` 字段。
- 保持 `freshness.status` 为 archive 是否重新执行 full verify 的唯一判定信号。
- 将成功文本中的 HEAD 差异标记为 `Information`，不再使用失败或 warning 语义。
- 明确 archive skill 在 `FRESH` 且 archive-compatible 时复用已 seal 的结果，不因 HEAD 信息差异重新委托 reviewer。
- 增加 seal 后无代码变化、仅 HEAD 推进时的 CLI、freshness、archive 和 skill 回归覆盖。

## Capabilities

### New Capabilities

### Modified Capabilities

- `verify-freshness-engine`: 将非阻塞 Git HEAD 诊断从 freshness failure 输出迁移至 informational 字段。
- `verify-cli-gate`: 明确 `verify status` 的 JSON/text 输出区分 freshness 状态、阻塞检查和 informational HEAD 诊断。
- `archive-verify-gate`: 明确 `freshness.status` 是 archive full verify 重跑的唯一信号。
- `opsx-archive-skill`: 明确生成的 archive skill 在 FRESH 结果下复用验证，不因 informational HEAD 差异触发 reviewer。

## Impact

影响 TypeScript verify freshness 类型与判定输出、`openspec verify status` JSON/text 输出、archive workflow 模板及受管 Pi archive skill。现有 freshness 硬条件、archive compatibility 判定、Git HEAD 采样和跨平台路径行为保持不变。