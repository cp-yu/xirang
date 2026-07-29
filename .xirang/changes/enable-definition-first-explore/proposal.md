## Why

Explore 当前只能把全部确认结果保留在不持久化的 Design Summary 中，无法在用户选择先处理结构定义时持久化已确认内容；长时间或恢复后的探索因此容易遗失 Element identity、边界、hierarchy 与 Relationship 决策，并使 Propose 被迫重新推断。

## What Changes

- 在 Explore 中引入由用户选择进入的 Definition Framing 推荐阶段，并保留可独立完成的 Design Exploration。
- 引入 Change Structural Definition，以单个受 CLI 管理的隐藏文件持久化当前已确认的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships。
- 新增 `xirang framing` lifecycle、结构校验、Semantic Model drift diagnostics、稳定 JSON contract 与受控 Propose consume。
- Change Structural Definition 已形成时，让 Propose 联合该定义与不持久化的 Design Summary 形成完整 Change；未形成时，保留直接从已确认设计形成完整 Change 的路径。
- 由 Xirang 生成源投影共享 Definition Framing reference，不依赖用户级 skill 文件。

## Source Impact

### Behavior Source

#### New Specs

- `definition-framing`: 用户选择先处理结构定义时，确认并持久化 Change 的结构定义、identity、边界与位置。
- `design-exploration`: 基于 Semantic Model、项目证据与可用的已确认结构探索方案、影响、验证与风险，并形成不持久化的 Design Summary。
- `change-structural-definition`: 保存当前已确认结构目标、Semantic Model 基准快照与 Change Formation 历史。

#### Modified Specs

- `explore`: 通过 Design Exploration 推进设计，并在用户选择时先执行 Definition Framing；结构变化后重新检查依赖设计；以新的不持久化 Design Summary Requirement 取代旧 Conversation-only Requirement，并接受后续既有 Requirements 因替换产生的确定性 position 前移。
- `explore-role`: 保持项目与正式 Change 边界，只通过 `xirang framing` 持久化用户明确确认的结构定义。
- `propose`: 在 Change Structural Definition 已形成时重算 drift、impacts 与 Delta coverage 并冻结来源；否则保留既有形成路径。
- `propose-role`: 仅在存在结构定义时编排受控 consume，消费失败时不得声明 Change Formation 完成。
- `deterministic-operations`: 提供 framing lifecycle、baseline comparison、结构校验、路径防护和 provenance consume。
- `project-tooling-configuration`: 从单一生成源投影共享 Definition Framing reference 与 Explore 工作面。

### Architecture Source

#### Added Elements

- `definition-framing`: Explore 中由用户选择进入、用于先处理结构定义的推荐阶段。
- `design-exploration`: Explore 中基于 Semantic Model、项目证据与可用结构定义确认设计的阶段。
- `change-structural-definition`: Definition Framing 在 Propose 前持久化的当前完整结构目标。

#### Modified Elements

- `explore`: 增加可选 Definition Framing 路径，并将 Design Exploration 明确为基本设计过程。
- `explore-role`: 增加受控 framing persistence 边界。
- `propose`: 增加可选结构来源的消费、编译和历史冻结职责。
- `propose-role`: 增加条件式 consume orchestration 职责。
- `deterministic-operations`: 增加 `xirang framing` 确定性操作集合。
- `project-tooling-configuration`: 增加 Definition Framing reference 的托管投影。

#### Removed Elements

None

#### Architecture Relations

- `definition-framing -[precedes]-> design-exploration`。
- `definition-framing -[produces]-> change-structural-definition`。
- `design-exploration -[consumes]-> change-structural-definition`。
- `propose -[consumes]-> change-structural-definition`。
- `propose -[invokes]-> deterministic-operations`。
- `deterministic-operations -[consumes]-> change-structural-definition`。
- `deterministic-operations -[produces]-> change-structural-definition`。

## Impact

- `xirang-definition.md`：已确认 Explore、Definition Framing、Change Structural Definition、Design Exploration、Propose、Agent roles 与 CLI 能力边界。
- `src/core/model/`：使用已落地的 Element Declaration `definition` 语法，并复用现有 semantic comparison 与 fingerprint 能力。
- `src/core/framing/`：新增 Change Structural Definition schema、parser、baseline、validator、workspace lifecycle 与 consume coverage。
- `src/commands/framing.ts`、`src/cli/index.ts`：注册 `xirang framing` command group 和统一 JSON/error contract。
- `src/utils/item-discovery.ts` 及 Change lifecycle entry points：锁定隐藏普通文件与活动 Change 目录的隔离。
- `src/core/templates/`：更新 Explore/Propose 生成源并投影 `xirang-definition-framing.md`。
- `test/`：新增 parser、drift、validation、filesystem、CLI、consume、discovery isolation、template projection 与 end-to-end coverage。
- 已完成前置 Change `replace-element-summary-with-definition`；本 Change 的 Element Declarations 只使用 `definition`。
