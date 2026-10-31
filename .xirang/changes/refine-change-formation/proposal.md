## Why

当前 Explore 的统一只读限制妨碍必要的可行性实验，确认记录也无法表达待确认设计；Propose 缺少适度交互，并容易通过大量自主补充形成冗长 Contract。需要明确两个阶段如何协作，使用户确认、实验依据和目标语义贯穿形成过程。

## What Changes

- Explore 完善中间设计并委托 Experimenter 设计、执行必要实验；Propose 组织 Change 草稿，按复杂度安排审阅，允许小范围交互调整。
- **BREAKING**：设计记录使用显式内容性质与决策状态的新格式，旧格式直接拒绝；支持按条目选择读取，沿用局部更新和记录级版本检查。
- Explore、Propose 共用记录与用户确认边界，收尾区分已采纳义务、待决问题、排除方案和说明材料。
- 保留业务规格 4+N，以局部职责、直接表达、同层去重和沿用准确文本精简 Contract。
- 本次不设计 Neovim 或 Web 的具体差异呈现方式。

## Source Impact

### Behavior Source

#### New Specs

- `experimenter`：实验设计、执行、证据交付及角色边界。

#### Modified Specs

- `explore`：探索、实验与中间设计交接。
- `design-exploration`：设计确认、实验和最新记录依据。
- `explore-brainstorming`：探索流程与受控写入边界。
- `explore-role`：实验委托与记录维护权限。
- `propose`：交互成文、适度补充与来源闭环。
- `propose-role`：用户授权记录维护与交接。
- `propose-workflow`：按复杂度审阅、路由和记录写入例外。
- `post-propose-validation`：按性质、状态和适用性检查覆盖。
- `design-record`：当前设计捕获、确认权和状态化编译。
- `confirmed-design-record`：显式决策状态及已确认结构目标。
- `design-record-operations`：新格式、选择读取与状态化覆盖门禁。
- `deterministic-operations`：记录操作的上层完整承诺。
- `semantic-model-build`：共享记录新状态的 Candidate 消费。
- `internal-agents`：按角色区分评估与实验操作能力。
- `internal-subagent-generation`：三种内部角色的显式注册及原生权限。
- `authoring-conventions`：局部职责与精简表达规则。
- `business-specification-standard`：4+N 内的职责边界及避免同层重复。

### Architecture Source

#### Added Elements

- `experimenter`：位于 internal-agents 下，与 Reviewer、Optimizer 并列承担独立实验职责。

#### Modified Elements

- `design-record`：明确 Build、Explore、Propose 共用的当前设计维护方法。
- `confirmed-design-record`：保留 identity，名称改为中间设计记录，涵盖待确认、已采纳、已排除状态。
- `design-record-operations`：完整与选择读取、状态化覆盖属于统一 CLI 操作。
- `internal-agents`：共同边界为隔离委托与结果交付，操作能力按角色定义。
- `internal-subagent-generation`：显式覆盖 Experimenter 及按角色生成权限。
- `explore-brainstorming`：概念边界包含实验委托与记录维护，消除统一只读定义。

#### Removed Elements

None

#### Architecture Relations

None；Experimenter 的层级通过 parent 表达，职责在其 Contract 与 Explore Contract 中明确，本次不新增 Relationship 或 Kind、View。

## Impact

- `src/core/record/`、`src/commands/record.ts`：记录格式、解析、部分更新、选择查询、覆盖及交接；旧活动记录需由用户重新形成，新实现不提供迁移层。
- 共享 Design Record、Explore、Propose、Build 和 Contract 写作提示词及受管工作面。
- subagent 模板、注册、各工具渲染与 init/update 安装；保留用户 model 设置。
- 现有记录命令、Build/Change 交接及 subagent 生成安装测试；无新依赖。
