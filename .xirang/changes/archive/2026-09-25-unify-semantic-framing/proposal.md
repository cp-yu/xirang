## Why

默认 C4 拆解容易把用户意图约束在固定技术层级，现有只保留结构的 Framing 又无法稳定保存已确认的行为细节；仅检查生成制品彼此一致，不能发现它们共同遗漏的用户设计。息壤需要在同一个 Change 中贯通通用语义精化、用户确认记录、完整 Contracts 与可执行任务，并把 LLM prompts 的呈现质量作为框架交付的一部分。

## What Changes

- 将默认拆解改为随框架提供指导的语义精化，默认以 `project`、`element`、`perspective` 为建模起点；保留项目显式选择，不强制固定层级。
- **BREAKING** 将仅面向 Change 的完整结构草稿升级为 Build 与 Explore 共用的精简已确认设计记录，更新 `xirang framing` 的数据模型、受管位置和交接目标，不自动迁移旧记录。
- 保留 Definition Framing 方法名；默认记录不可擅自改变的关键设计，用户指定内容优先，每次持久化均须明确确认，冲突由用户裁决。
- 在有记录时，将冲突处理设为 Design Summary 的前置门槛；Build 与 Propose 从同一记录机制生成目标语义，并分别保留原有生命周期。
- 细节完整进入 Element Contracts；Tasks 表达具体实施与验证安排并引用 Contracts，不复制规范或机械按文件、条数拆分。
- 更新 Build、Explore、Propose、任务生成及其共享 references 的 prompts：突出权限与停止条件，按阶段呈现输入、动作和出口，减少重复、歧义与无关上下文；同步源模板与受管生成面并验证实际使用流程。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `project-config-loading`：默认拆解选择与缺失字段物化，保留显式配置。
- `workspace-init`：新项目的默认指导与最小 Kind 起点。
- `workspace-update`：缺失默认值和受管工作面的同步，不改写既有用户选择。
- `single-dimension-decomposition`：通用语义精化、按需 Perspective 与细节归属。
- `definition-framing`：两条路径共享的确认、记录、裁决与修订闭环。
- `change-structural-definition`：精简的已确认设计记录、用户指定内容与来源边界。
- `definition-framing-operations`：统一记录 CLI、无正式模型起点及两类交接。
- `explore`：在探索过程中使用记录，不把它作为强制前置制品。
- `design-exploration`：恢复记录、设计一致性检查与 Summary 前置门槛。
- `semantic-model-build`：记录驱动 Candidate 形成与来源覆盖复核。
- `candidate-commands`：记录来源参与 Candidate 审查绑定和 Build 历史保留。
- `propose`：按记录和 Summary 形成完整 Delta 与 Plan，并完成来源交接。
- `post-propose-validation`：确认来源、目标语义与执行验证安排的覆盖复核。
- `tasks-document`：具体实施事项、Contract 引用与验证分工。
- `workflow-templates`：通用指导与确认协议复用、LLM prompts 的阶段化呈现和授权边界。
- `project-tooling-configuration`：共享 Framing 协议在 Build、Explore、Propose 生成面的统一投影。

- `deterministic-operations`：对齐父层 CLI 的统一记录、校验与交接承诺。
- `explore-brainstorming`：对齐只读例外、Summary 门禁与 capture target 路由。
- `explore-role`：对齐工作身份的记录授权与有效 Summary 交付。
- `propose-role`：对齐工作身份的双段覆盖与来源消费。
- `propose-workflow`：对齐部分记录下的结构指导、受控消费例外及 Tasks 闭环。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `definition-framing`：从结构前置阶段拓展为关键设计确认记录方法，供 Build 与 Explore 复用。
- `change-structural-definition`：保留稳定 identity，显示名称与完整 Definition 改为两条流程通用的已确认设计记录。
- `definition-framing-operations`：从 Change 结构草稿管理拓展为统一记录的确定性操作集合。
- `explore`：不再限定先完成结构 Framing，再进入设计探索。
- `propose`：输入范围由结构草稿拓展为已确认关键设计与用户指定内容。

- `explore-role`：完整 Definition 对齐持续确认记录与 Summary 交付边界。
- `propose-role`：完整 Definition 对齐统一记录消费与两段覆盖职责。

#### Removed Elements

None

#### Architecture Relations

- 移除 Definition Framing 必须先于 Design Exploration 的固定顺序。
- 显式表达 Semantic Model Build 对既有 Definition Framing 方法与同一记录对象的复用；不复制对象，不将层级解释为独占所有权。
- 既有 Metamodel 已包含三个默认 Kind，本 Change 不重写其共享语义，也不新增或重组 Authored Views。

## Impact

- 项目配置默认值、setup/update、模型与 clean Candidate 起点。
- `src/commands/framing.ts`、`src/core/framing/` 与 Candidate 校验、digest、history 交接。
- Build、Explore、Propose 源模板，共享 fragments/references、任务 schema/template 与受管 Agent 工作面。
- 相关 Vitest 单元、CLI 和跨边界集成测试，以及 prompt 流程的一次性演练；不增加以解释性措辞为断言的持久测试。
- 不实现游戏，不修改 goFate!、已归档 Change、既有项目的显式拆解配置或旧记录；不新增 workflow、不改造无关的 quality/reviewer/optimizer 提示词，不自动 Sync 或 Archive 本 Change。
