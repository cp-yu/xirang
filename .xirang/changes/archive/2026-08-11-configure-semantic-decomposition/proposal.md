## Why

Semantic Model 的结构形成目前只有单维度、MECE 与 BFS 等一致性检查，缺少项目级拆分方法，导致 Agent 可能混用职责、生命周期、部署和实现组件等维度，生成形式有效但难以理解的层级。项目需要显式选择由 Agent 已知的方法或用户自有 skill 指导结构拆分，并让该选择在所有结构形成 workflow 中保持一致。

## What Changes

- 在项目配置中增加互斥的 `decomposition.method` 与 `decomposition.skill`，默认方法名为 `c4`。
- 将结构拆分配置原样投影给 Agent；CLI 不登记、解释、展开或校验具体方法论。
- 让 Build、Explore Definition Framing、Propose 与 Snack 在形成结构时共享同一份拆分指导，并在未知方法或缺失 skill 时停止结构形成。
- 为本仓库配置项目自有拆分 skill，保留现有多 Perspective 模型方法，而不套用默认 C4。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `project-config-loading`: 加载、校验并默认化结构拆分配置。
- `config-projection`: 原样投影方法名或 skill 名，不解释其内容。
- `workspace-init`: 新工作区物化默认 C4 配置。
- `workspace-update`: 以 missing-only 方式迁移结构拆分默认值。
- `semantic-model-build`: 在 Candidate hierarchy 形成与语义审查中应用配置的拆分指导。
- `definition-framing`: 在确认 Change 结构目标时应用配置的拆分指导。
- `explore-brainstorming`: 仅在结构设计发生时加载并遵循拆分指导。
- `propose-workflow`: 仅在没有已确认结构定义且需要形成结构 Delta 时应用拆分指导。
- `snack-workflow`: 仅对证据要求的新增或重组结构应用拆分指导。
- `skill-generation`: 从单一共享片段向四个结构形成 workflow 投影一致指引。

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

- 项目配置 schema、读取、标准化投影、setup/update 默认值迁移及 config command 输出。
- Build、Explore、Propose、Snack 的 canonical skill 模板、生成 parity 与长度约束测试。
- 本仓库 `.xirang/config.yaml` 与用户自有 `.pi/skills/xirang-project-decomposition/SKILL.md`。
- 不影响 Apply、Verify、Semantic Model 的 Element Declarations、Relationships、Metamodel 或 Authored Views。
