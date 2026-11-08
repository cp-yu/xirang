## Why

用户可能只表达意图、只提出路线，或将两者混合表达。Explore 与 Propose 需要主动补足理解、审视关键假设，避免把方案采纳当作可行性证据，或把方案失败误判为意图对齐失败。

## What Changes

- 在现有 Explore 设计循环中明确主动理解、针对性提问、双方方案的证据判断、按需实验及失败归因。
- 在 Propose 独立入口和完整机制自查中延续这些判断，复用已确认设计与现有缺口处理规则。
- 按已逐段确认的精简英文原文落实提示词，并同步对应语义承诺与受管工作面。
- 本轮聚焦 Formation；复用 Experimenter，不新增流程阶段、固定问卷或每次必做的实验，不重设计 Apply、Review 流程。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `explore`：主动理解局部输入、比较方案、按不确定性选择验证并正确使用实验结果。
- `design-exploration`：澄清目标与约束、基于依据确认方案并在反证出现时正确修订。
- `explore-brainstorming`：将充分理解、提问、方案审视及按需实验融入适用的设计循环，保持提示词精简。
- `explore-role`：承担主动理解、独立判断及消费可行性证据的责任。
- `propose`：直接进入时补足理解，成文时检查方案依据并正确处理失败。
- `propose-workflow`：通过项目证据和针对性提问判断就绪，复用有效 Summary。
- `post-propose-validation`：检验关键假设和实施路径，区分方案失败与意图理解问题。
- `propose-role`：组织成文时维护充分理解及有依据的方案判断。

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

- 提示词来源：`src/core/templates/workflows/explore.ts`、`src/core/templates/workflows/propose.ts`，以及现有生成机制产出的 Explore reference 和 Propose 工作面。
- 语义影响限于上述 Elements 的 Contracts；不改变 Declaration、Kind、Relationship、View 或持久化格式。
- 复用现有模板集成与生成一致性测试，并以小规模多轮对话对比取得一次性行为证据；不新增依赖、API 或强制评测服务。
