## Why

项目配置已能承载基础设置和制品要求，但 setup 后缺少明确入口，用户难以发现可配置能力，也无法一次核对配置是否合法、哪些值生效以及作用范围。配置内容缺少版本化演进机制，Agent 的通用读取与配置修改指导也需要明确分工。相关模型同时混合配置作用域、处理过程、单字段及阶段特例，造成职责重复和冲突，需要在这两棵子树内整理语义边界。

## What Changes

- 通过 setup、顶层 help、`xirang config` 与配置文件注释展示配置能力，共享字段说明与默认值。
- 增加只读 `xirang config check`，详细解释有效值、来源、作用范围和诊断，并支持 JSON。
- 以项目配置为基础设置与偏好的落点；common 直接交付使用规则并加载 context，配置修改协议通过独立 reference 按需读取。
- 统一 Semantic Delta 的制品 ID 为 `semantic-delta`，贯通 schema 依赖、状态、模板、CLI authoring help、`rules.semantic-delta` 与生成指导，保留四分区和 `.delta-noop` 语义。
- 引入框架管理的 `configVersion`，以最近 10 次迁移操作支持后续 update；配置内容和版本原子提交，陈旧内容按明确清单处理并提示。
- 局部重构配置管理与工作面投影：按配置作用域和工作面交付对象组织同级职责，合并 7 个过细或重复 Elements，迁移有效承诺并调和冲突。
- **BREAKING**：制品 ID `specs` 改为 `semantic-delta`；配置基线为 `configVersion: 1`，不兼容无版本旧配置；`elementDefinitionDepth` 改为 `definitionDepth`，outline JSON 同步改名；移除无实际消费方的 `optimization`；只有 setup 创建项目配置，update 不再重建缺失文件。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `cli`：配置入口发现、setup 必要引导、配置检查结果与统一 Semantic Delta 制品身份。
- `artifact-graph`：semantic-model 制品身份、依赖及四分区/空差量完成条件。
- `artifact-workflow-commands`：状态、模板及制品查询采用 semantic-delta。
- `instruction-loader`：静态 Semantic Delta 指导、authoring help 与动态配置查询一致。
- `change-artifacts`：完整四分区制品语义及静态定义先行写作。
- `project-tooling-configuration`：项目配置发现、管理、按需指导和版本演进；Definition 深度字段命名。
- `project-config-management`：项目/全局配置的作用域、统一有效值、只读诊断及有界原子迁移。
- `config-command`：配置说明、检查、有效配置查询字段和作用域。
- `project-config-loading`：完整项目配置读取、归一化、消费作用域、默认值、版本及输入处理；吸收 Config Projection 和单字段默认值职责。
- `config-projection`、`apply-default-isolation`：有效职责合入项目配置，删除独立 Element。
- `global-config`：退役整个 optimization 节点，保留其他全局工具设置。
- `workspace-init-update`：setup 独占配置创建，update 仅演进既有配置。
- `workspace-init`：带说明及版本的新配置和完成提示。
- `workspace-update`：版本迁移、清理提示及文件保护。
- `arch-outline`：`definitionDepth` 配置与 JSON 名称。
- `agent`：用户授权的配置修改、重新加载与报告。
- `agent-workbench-projection`：common 内联使用规则、按需修改 reference 和旧 reference 清理。
- `skill-generation`：common context 读取和配置修改指导交付。
- `references-home`：修改 reference 的物化和旧引用清理。
- `apply-quality-integration`：删除“配置驱动优化控制”Section；可选 Opt 由现有“以委托交付推进优化”职责表达。
- `agent-prompt-guidance`：独立质量协作指导归于共享 references，合并模板中的质量协议；删除“简单变更快速路径识别”。
- `artifact-pipeline`、`skill-template-length`、`snack-workflow-manifest`：生成流程、工作流成员及验证约束合入工作面整体职责，删除独立 Elements。
- `workflow-templates`、`snack-skill-generation`：通用与 Snack 阶段指导合入 skill 交付，质量协议归于质量指导，删除独立 Elements。
- `authoring-conventions`：写作指导归于共享 references，目标状态与任务表达按现行模型对齐。
- `business-specification-standard`：验收结果的任务追溯使用目标和验证方向。
- `internal-subagent-generation`：按完整 4+N 整理角色制品交付、权限与用户模型保留。
- `archive-quality-gate`：优化处置不再依赖被删除的配置开关。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `config-command`：完整涵盖项目配置说明、查询、检查及全局工具配置命令。
- `project-config-management`：配置管理整体按项目与全局工具两类作用域组织。
- `project-config-loading`：项目配置，完整承载读取、归一化及消费契约。
- `global-config`：全局工具配置，与项目偏好分离。
- `workspace-update`：按版本演进项目配置并刷新受管工作面。
- `agent-workbench-projection`：按 skills、内部 Agent 制品和共享 references 三类交付对象细化，整体承担共享生成与同步。
- `skill-generation`：公共与阶段 Skill 交付，包含通用入口及 Snack 等具体阶段指导。
- `references-home`：共享 Reference 交付，承载专项指导内容及加载/物化边界。
- `authoring-conventions`：共享语义写作指导，parent 为 `references-home`。
- `agent-prompt-guidance`：质量协作指导，parent 为 `references-home`。

- `project-tooling-configuration`、`workspace-init-update`、`workspace-init`、`internal-subagent-generation`、`arch-outline`：职责与 identity 保持，Kind 改为 capability-specification，完整 Contract 采用 4+N。

#### Removed Elements

- `config-projection`
- `apply-default-isolation`
- `artifact-pipeline`
- `workflow-templates`
- `skill-template-length`
- `snack-skill-generation`
- `snack-workflow-manifest`

#### Metamodel

- ADDED `capability-specification`：`contract: required`、`contractFormat: business-specification`，明确具体能力的完整 4+N 结构。
- 采用该 Kind 的 Elements：`project-tooling-configuration`、`project-config-management`、`project-config-loading`、`global-config`、`config-command`、`workspace-init-update`、`workspace-init`、`workspace-update`、`agent-workbench-projection`、`skill-generation`、`internal-subagent-generation`、`references-home`、`arch-outline`。
- 通用概念、工作身份与规范指导继续使用各自适用 Kind，不自动纳入业务规格格式。

#### Architecture Relations

None

## Impact

影响 semantic-model 制品图、状态与模板查询、authoring help、静态制品指导、项目配置解析、schema、默认值、投影、序列化、config/help/setup/update 命令、outline 结果字段，以及 common、配置修改 reference、阶段模板和受管文件同步。已有配置及依赖旧 outline JSON 字段的调用方需要适配；本次不自动迁移无版本配置。

不增加外部依赖；局部重构以上两棵子树，不修改 Views 或 Relationships，不实现组合仓库继承、跨项目个人偏好、通用提示词系统、自动学习或文件监听。历史归档保持原样。
