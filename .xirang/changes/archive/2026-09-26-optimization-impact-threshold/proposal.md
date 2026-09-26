## Why

优化循环只有 `enabled`、`directionLimit`、`directionRetries` 三个旋钮，没有任何收益门槛：Optimizer 只要找到「有证据的收益」就会报方向，哪怕收益只是消掉一个临时变量。而每个方向一轮的代价是一次 clean-context reviewer 调用加一次可能的回滚，收益与成本完全不成比例。缺少门槛时「不值得做的事」无法表达，Optimizer 只能报出方向、消耗额度、再被实现和评审，等于用最贵的路径完成一次无意义的改动。

## What Changes

新增 `optimization.minImpactLevel` 配置，声明「值得选取的最低 impactLevel」。低于门槛的方向不属于本项目范围，Optimizer 不得报告、不得虚报其 `impactLevel`、也不得为凑门槛而标为 deferred；当全部待选方向都低于门槛时，该轮以 `NO_ACTIONABLE` 收口（映射为 `NOT_NEEDED`），使「没有值得做的事」成为正当结论而非失败。

门槛同时落在两处：CLI 选择器做确定性过滤（低于门槛的方向永不被选中），Optimizer 的 admission gate 做报告前的自我约束（避免为注定不被选中的方向浪费一次评审）。默认值 `low` 使默认行为与改动前完全一致。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `optimization`: 「只选择有价值且可验证的事项」补入门槛作为选取条件；「无需继续优化时完成」补入「全部方向低于门槛」这一收口路径。
- `optimization-execution`: 「重试预算控制」的配置语义段补上门槛与「低于门槛的方向不消耗方向额度」的约定。
- `apply-quality-integration`: 「配置驱动优化控制」同步门槛语义，与 `optimization-execution` 的并行表述保持一致。
- `optimizer-findings`: 「优化循环终止」补入门槛触发的收口条件与 `NO_ACTIONABLE` 终态。
- `project-config-loading`: 「Materialize functional project config defaults」的物化枚举补上 `optimization.minImpactLevel: low`，使默认值清单完整。
- `quality-cli-gate`: 「收口终态由 stopReason 推导」与「Optimization 记录入口」反映门槛在 CLI 选择器中的确定性过滤。

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

- `src/core/project-config.ts`：功能性默认值新增 `minImpactLevel: 'low'`，两处手写 zod schema、非法值提示与 missing-path 迁移清单同步。
- `src/core/config-projection.ts`、`src/core/config-prompts.ts`：归一化输出与配置注释含新字段。
- `src/core/quality/validators.ts`：`selectEligibleDirection` 接受门槛并按等级排名过滤。
- `src/core/quality/protocol.ts`、`src/commands/quality.ts`：状态规则、状态渲染与台账摘要反映门槛。
- `src/core/templates/workflows/{optimizer,apply-change}.ts`：Benefit Threshold 段、admission gate、输出协议与 self-read protocol 表述门槛与 `low` 默认值。
- 受管生成面：`.pi/skills/xirang-apply/SKILL.md`、`.xirang/references/{xirang-decision-rules,xirang-output-protocol,xirang-self-read-protocol,xirang-apply-step-4-optimization}.md` 重刷。
- 测试：`test/core/quality/validators.test.ts` 新增门槛选择行为用例；`test/core/project-config.test.ts`、`test/commands/config.test.ts` 的全等断言补上新字段。
