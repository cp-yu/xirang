## Why

当前 Explore 与 Propose 经常重复读取完整 record、完整模型发现结果和大段源码，导致上下文成本增长，却没有改善已知语义的确定性。需要让 CLI 输出按职责提供最小默认投影，并让工作流只在需要时逐层补读完整语义。

## What Changes

为 `record` 与 `arch` 命令建立职责明确的轻量默认输出和显式完整展开路径；保留 `arch query --contract` 与 `arch snapshot` 的完整语义读取能力。同步更新 Explore、Propose 及共享 workflow instructions，使它们复用有效上下文、按 identity 局部读取，并在上下文丢失或版本漂移时恢复完整依据。**BREAKING**：record 与 arch 发现命令的默认 JSON 投影将收敛，依赖旧默认字段的调用方需改用显式读取。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `deterministic-operations`: 调整查询、搜索、影响分析与记录回执的默认投影，使发现输出轻量且完整语义只能通过显式 identity 查询获得。
- `design-record-operations`: 调整 `record list/create/rename/show/status/validate/update` 的默认回执与 baseline 隔离，同时保留完整读取和 `--entry` 选择读取。
- `arch-search`: 默认结果仅提供候选 identity、匹配字段、有限证据和计数。
- `arch-outline`: 默认提供层级导航，Definitions、Relationships 与 Metamodel 通过明确选项展开。
- `arch-impact`: 默认提供 identity、refinement 与必要关系摘要，canonical paths 通过明确选项展开。
- `explore`: 阶段入口、局部补读、sourceVersion 复用、恢复条件和渐进式模型读取规则发生变化。
- `explore-role`: Explore Agent 工作身份增加按阶段门禁读取、局部补读和完整语义恢复的责任。
- `propose`: 记录门禁与模型读取规则改为复用有效上下文，仍在入口、恢复和收尾执行完整门禁。
- `propose-role`: Propose Agent 工作身份增加复用有效上下文、按条目读取与漂移恢复的责任。
- `workflow-templates`: 共享 workflow instructions 增加职责投影、渐进读取、复用和截断保护规则。

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

- `src/commands/record.ts` 与 `src/core/record/**` 的 JSON 回执、baseline 投影和版本检查。
- `src/commands/arch/**` 及其投影/formatter 逻辑。
- `src/core/templates/workflows/**`、共享 fragments、受管 generated skills 与 references。
- 现有 record、arch、workflow 模板测试，以及 CLI 输出体积的一次性验证。
