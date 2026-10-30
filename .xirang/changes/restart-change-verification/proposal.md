## Why

活动 Change 进入 `ABORTED_UNSAFE` 或其他优化终态后，现有指引缺少保留历史并在原 Change 内重验的完整路径；普通优化回滚还可能把匹配历史 PASS 时附带的旧台账当作当前台账，遮住最新失败计数或终态。需要让 Agent 能在明确授权和串行前提下可靠重启，并保持日常续跑的状态正确。

## What Changes

- 提供 Apply 与 Archive 共享的恢复 reference，明确重启前提、完整保存及校验、质量记录轮换、中断处理和 fresh Review 入口，沿用现有 CLI。
- 在原 Change 中保留代码、隔离环境、checkpoints 和质量历史，重启后的 Optimization 从零开始；Reviewer 与 Optimizer 读取历史作为参考。
- 修正 Review 证据匹配与当前优化台账的组合，保持普通失败回滚后的最新计数、方向状态和 unsafe 阻塞。
- 将轮换历史纳入现有回滚保护，并更新生成指引及行为验证。不增加 reset 命令、并行任务协议或新的 Element hierarchy。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `quality`：活动 Change 的显式重新验证及新旧轮次边界。
- `quality-freshness`：当前轮次内的 Review 匹配与最新台账独立取值。
- `quality-writeback`：append-only 日志的受控轮换及历史完整性。
- `apply-quality-integration`：恢复 reference 的授权、串行执行与重返验证流程。
- `optimization-execution`：失败回滚保护质量历史。
- `quality-orchestration`：回滚步骤保护当前记录与历史。
- `quality-cli-gate`：终态恢复指示与当前轮次门禁。
- `agent-prompt-guidance`：共享错误恢复指引及受控轮换例外。
- `archive-quality-gate`：Archive 使用共享恢复 reference 后重新验证。
- `quality-aware-instructions`：unsafe 状态及重启后的指令投影。
- `reviewer-protocol`：历史质量记录作为问题与导航参考。
- `optimizer-protocol`：历史判断参考与当前轮次预算分离。

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- 状态与命令：`src/core/quality/state.ts`、`src/commands/quality.ts`，以及读取 quality 状态的 Apply instructions、Sync、Archive 门禁。
- 指引来源：`src/core/quality/protocol.ts` 和 Apply、Archive、Reviewer、Optimizer 模板及其 references 投影。
- 质量数据：当前 Change 内按次保存的历史快照、日志与恢复说明；当前记录仍使用既有格式，旧文件不改写。
- 验证：扩展既有状态引擎与 CLI 回滚测试，维护受影响的旧模板断言，并执行临时 Change/Git 场景及生成结果的一次性检查。
- 无新增依赖、公开 CLI 子命令、领域对象或模型分区；正式 Semantic Model 由后续正常 Closure 更新。
