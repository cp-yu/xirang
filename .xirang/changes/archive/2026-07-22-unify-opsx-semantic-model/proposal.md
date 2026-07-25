## Why

OPSX 当前把 Specs 与 LikeC4 描述为两套并列语义源，并将 `project / domain / capability`、ownership、`capabilityId` 与双向 Spec 索引写死在模型和工具链中，无法表达任意深度、可细化且可由 Agent 直接消费的统一 human intent。现在需要建立单一 OPSX Semantic Model，使 graph source 与 element-owned Specs 形成一个可验证、可视化、可演进的权威模型。

## What Changes

- **BREAKING**：将 OPSX 的权威语义统一定义为 OPSX Semantic Model；LikeC4 graph modules 与 Markdown contract modules 是同一模型的持久化组成，不再使用 `durable semantic source` 或 Specs/Architecture 双源术语。
- **BREAKING**：引入唯一 Project Root Element、稳定 `elementId`、任意深度 single-parent containment，以及 abstraction/refinement 语义；`project / domain / capability` 不再构成固定三层 taxonomy。
- **BREAKING**：Spec frontmatter 改为 singular `element` binding；一个 element 可拥有多个 Specs，一个 Spec 恰好属于一个 element；移除 `metadata.specs` 与 `capabilities: []` 双向手工映射。
- 由 Metamodel 声明 element kinds、可选 nesting constraints、typed contract schema、`contractPolicy` 与 relationship endpoint roles；默认开放 nesting，按需约束。
- 保留独立 semantic relationships，并增加 `produces`；具有实现语义的 data、event、artifact 与 contract 作为 first-class elements。
- 将 LikeC4 保持为当前 canonical graph syntax，并通过显式 language version 支持受控 OPSX dialect 演进。
- 保持 `Explore → Propose → Apply → Verify → Sync → Archive` 工作流不变，仅统一各阶段操作的模型术语、验证和 delta 语义。
- 提供旧模型到新 language version 的确定性迁移能力，但不在本 change 中猜测或迁移当前仓库全部 formal elements 与 Specs；self-model 迁移由后续独立 change 完成。

## Source Impact

### Behavior Source

#### New Specs

- `opsx-semantic-model`: 定义统一模型、Project Root、通用 elements、稳定 identity、containment refinement、typed contracts、views 与 language version 行为。
- `semantic-model-migration`: 定义旧 LikeC4 profile 到新版 OPSX Semantic Model 的显式、确定性和可验证迁移行为。

#### Modified Specs

- `compilation-philosophy-fragment`: 统一 OPSX Semantic Model 与 Agent 编译类比的项目哲学术语。
- `opsx-conventions`: 更新项目结构、Spec 边界与 change-local Semantic Delta 约定。
- `likec4-semantic-validator`: 从 domain/capability ownership 校验改为通用 element、root、identity、containment、metamodel 与 contract completeness 校验。
- `arch-query-command`: 按稳定 `elementId` 查询任意 kind、父子 refinement、Specs 与 semantic relationships。
- `architecture-delta-artifact`: 将 graph delta 定义为统一 Semantic Delta 的 LikeC4 module，并支持通用 element 与 versioned metamodel 变更。
- `spec-frontmatter`: 将 `capabilities` 数组替换为 singular `element` binding。
- `spec-registry`: 将 capability↔Spec 多对多 registry 替换为 element→Specs 与 Spec→单一 element 的派生索引。
- `spec-content-browser`: 通过派生 registry 展示 element-owned Specs，不再信任 `metadata.specs`。
- `opsx-semantic-relations`: 移除显式 ownership relation，采用 Metamodel 驱动的 endpoint roles，并加入 `produces`。
- `init-project-structure`: 初始化带 Project Root、language version 与开放 Metamodel 的 OPSX Semantic Model 骨架。
- `opsx-bootstrap-architecture`: bootstrap 任意深度 abstraction/refinement 模型和 singular Spec bindings。
- `propose-workflow`: 将 Behavior/Architecture 双源影响统一为同一 Semantic Model 的 contract/graph modules，同时保留现有 artifacts 与 workflow stage。
- `cli-list`: Spec 列表输出 singular element binding，不再输出 capabilities 数组。
- `validate-spec-section-type-cross-check`: 校验 element 存在性、唯一 binding 与 contractPolicy completeness。
- `cli-sync`: 联合验证并原子合并 graph 与 contract modules，形成新的 formal OPSX Semantic Model。
- `archive-sync-workflow`: 将归档前 gate 表述为 Semantic Delta 已完整 sync，不改变既有阶段顺序。
- `opsx-apply-architecture-context`: Apply 读取 Target Semantic Model 的 element hierarchy、contracts 与 relationships。
- `opsx-shared-context`: 共享加载协议改为从 Project Root 按 refinement hierarchy 下钻。
- `opsx-impact-sweeper-architecture`: sweeper 使用通用 elementId、containment 与 semantic relationships 判断影响。
- `explore-brainstorming`: Explore 将统一模型决策路由到 graph/contract modules，而非两套 source。
- `snack-skill`: code-first reconciliation 面向一个 OPSX Semantic Model 与一个 Semantic Delta。

### Architecture Source

#### Added LikeC4 Elements

- `architecture.metamodel`: 拥有 element kind、contract policy、nesting constraint、relationship endpoint role 与 language version 语义。
- `migration.semantic_model_migrator`: 拥有 versioned OPSX Semantic Model 的显式迁移与验证责任。

#### Modified LikeC4 Elements

- `architecture.likec4_reader`: 从 domain/capability 专用读取改为通用 OPSX Semantic Model graph 读取。
- `architecture.semantic_validator`: 验证 Project Root、稳定 elementId、single-parent refinement、Metamodel constraints 与 contract completeness。
- `architecture.delta_merger`: 合并 versioned graph module，并与 contract module 形成原子 Semantic Delta。
- `validation.frontmatter`: 解析 singular `element` binding。
- `validation.registry`: 构建 element→Specs 与 Spec→element 派生索引。
- `presentation.likec4_engine`: 呈现任意深度 elements、refinement overview、semantic relationships 与 typed contracts。
- `presentation.spec_content_gateway`: 依据派生 binding registry 授权 Spec 读取。
- `presentation.spec_content_panel`: 呈现一个 element 的 0..n Specs。
- `cli.arch_query`: 查询稳定 `elementId`、FQN、parent/children、contracts 与 relations。
- `cli.arch_validate`: 验证完整 OPSX Semantic Model 或 change-local Semantic Delta。
- `cli.init`: 创建新版 Semantic Model 骨架。
- `cli.list`: 投影 singular element binding。
- `cli.sync`: 原子提升 graph 与 contract modules。
- `change_workflow.specs_sync`: 将 graph delta 与 Spec deltas 作为一个 Semantic Delta 协同 reconcile。
- `schema.architecture_delta_artifact`: 承载通用、versioned graph delta 结构。
- `ai_integration.workflow_templates`: 统一所有 Agent workflow 的 OPSX Semantic Model 术语和导航协议。
- `ai_integration.explore_brainstorming`: 澄清并确认统一模型的 semantic decisions。
- `ai_integration.impact_sweeper`: 使用通用 hierarchy、contracts 与 relations 扫描影响。
- `ai_integration.snack_skill`: 面向统一模型执行 code-first reconciliation。
- `migration.opsx_to_likec4_converter`: 保留 legacy 输入职责，并将输出路由到 versioned semantic model migration。
- `migration.likec4_file_generator`: 生成 Project Root、Metamodel 与通用 element graph modules。
- `migration.spec_path_inference`: 从 singular element binding 迁移并验证 Spec ownership。
- `migration.agent_verification_workflow`: 在 promotion 前验证迁移结果无需猜测 element/Spec 对应。

#### Removed LikeC4 Elements

- None

#### Architecture Relations

- Architecture reader、semantic validator 与 Spec registry 消费统一 Metamodel 定义。
- Semantic model migrator 调用 reader 与 validator，并仅在无 unresolved bindings 时产生可 promotion 的目标模型。
- Presentation 与 workflow surfaces 继续消费 reader/registry，但不再消费 element 内嵌 Spec path index。

## Impact

- 影响 LikeC4 parser/reader/writer、semantic validator、architecture delta validator/merger、Spec frontmatter/registry、list/query/init/sync CLI、bootstrap/migration、内置 Web browser 与全部生成 workflow guidance。
- 需要更新 root 与 vendored `opsx-likec4` 的 contract lookup 和可视化 projection，但不新增外部 runtime dependency。
- 需要跨平台验证 `.opsx/architecture/` 与 `.opsx/specs/` 的扫描、路径解析、迁移和原子 sync。
- 现有 self-model 保持旧 language version 可读；其完整 element hierarchy 与 123 个 formal Specs 的 singular binding 迁移不属于本 change。
