## Context

当前默认拆分以 C4 为起点，而 Definition Framing 将记录限定为 Change 的完整结构目标。两者共同造成两个问题：非软件架构项目被过早套入固定结构；形成阶段已确认的行为条件、数值、例外和时序可能在 Summary、Contract 与 Tasks 之间丢失。制品之间即使相互一致，也不能证明覆盖了用户意图。

本 Change 联合解决这两个形成问题，不拆成相互依赖、各自无法验证端到端效果的 Changes。它保留现有 Semantic Model / Semantic Delta 的规范性地位，并把中间确认记录作为形成依据而非第二套目标模型。当前项目显式配置的 `decomposition.skill: xirang-project-decomposition` 保持不变。

## Goals / Non-Goals

**Goals:**
- 提供真正随框架交付的通用语义精化默认方法，同时保留显式选择的方法或 skill。
- 以统一 Definition Framing 方法与记录模型支持 Build 和 Explore/Propose；分离各次形成上下文的记录实例。
- 通过逐次授权、冲突裁决、重载与 Summary 门禁保留已确认内容；通过两段覆盖检查避免下游遗漏。
- 让 Tasks 形成可独立验收的端到端行为闭环，并把提示词来源、共享协议、生成面与行为验证放入相应闭环。

**Non-Goals:**
- 不实现任何示例项目或 goFate!，不调整本仓库已明确选择的 hierarchy，不重写历史 Change。
- 不迁移旧 Framing 记录，不提供隐式兼容副本或第二存储通道；不新增工作流。
- 不改变 Review / Optimization / Checkpoint 协议，不以机器字符串匹配替代语义判断。
- 本次 Propose 不修改实现，不刷新生成面，不执行 Sync、Archive 或正式模型提升。

## Decisions

### 1. 缺省方法改为框架交付的 semantic-refinement

在缺少 `decomposition` 时物化 `method: semantic-refinement`；配置继续使用 `{method}` / `{skill}` 的互斥非空联合，名称保持不透明，不新增允许名单。任何显式有效值（包括 `c4`）均原样保留；非法显式值仍报错，不能借默认值掩盖错误。

新增框架拥有的 `.xirang/references/xirang-semantic-refinement.md`，通过现有共享结构指导与 reference projection 发布。默认方法的消费者必须能定位并读取该完整指导；仅把默认字符串改名不算交付。保持现有六个工作流，Snack 若使用共享结构指导也应继承正确的配置路由，但本 Change 不重设 Snack 的形成流程。

默认种类为 `project`、`element`、`perspective`。它们表达语义类别而非层级：从领域概念、能力或用户目标逐层精化，没有固定层数或必须经过的 C4 层。每组 siblings 只沿一个维度拆分，在用户确认范围内检查 MECE，并按 BFS 确认后展开下一层。Perspective 仅用于需要下级精化的真实语义视角；纯呈现组织使用 View。同一概念保持一个稳定 identity，跨视角联系使用 Relationships。具有真实共享语义时允许扩展 Kind。没有更深节点时，行为细节仍必须写入相应 Contract。

Setup 与 clean Candidate 共用默认种类 skeleton；只补 Kind 声明和已要求的 Project Root，不凭空生成业务 Elements 或 Contracts。既有显式配置和项目专用指导不被替换。

### 2. 统一方法、记录模型与 CLI，隔离记录实例

保留 `Definition Framing` 方法名和 `xirang framing` CLI 域，移除它必须发生在 Design Exploration 之前的线性前置关系。Build 与 Explore 均可按需使用；有记录时执行统一协议，无记录时正常自审，不要求先制造空记录。Build 继续使用 Candidate review / digest / promotion，不新增 Design Summary 阶段。

新记录存于 `.xirang/framing/`，使用稳定记录身份和独立条目身份，包含标题/slug、形成上下文、当前已确认条目以及用于比较上下文的基准信息。条目主体为精简确认内容，可包含结构片段和行为细节；不要求填满四类结构数组，也不把记录解释为完整 Semantic Delta。采用受控文档格式并显式版本化，避免以内容猜测版本。记录更新表达当前确认结果，不保留相互冲突的累积对话。

Build 上下文与 Change 形成上下文共享数据模型，但各自使用独立实例。身份不随标题重命名改变。新建、展示、列举、更新、删除/放弃、重命名及消费均由 CLI 管理受控路径；保留非法路径、符号链接与冲突写入的 fail-closed 保护。Build 尚无 formal model 是合法上下文；存在但损坏的 formal model 必须报错，不能当作首次构建。

既有结构记录不自动迁移、不自动删除；识别到旧格式时明确报告不支持及需用户处理。记录既不是 Contract，也不是候选模型或执行计划；可记录用户明确要求保存的非规范材料，但不能自动把这些材料提升为行为要求。

### 3. 人工确认与语义判断留在 Agent / 用户侧

Agent 默认记录后续生成不得擅自改变的关键已确认设计，保留条件、数字、例外、时序和结构片段。用户明确要求记录的内容优先于 Agent 的重要性筛选。一般讨论、备选方案、完整理由和实施/测试计划不自动进入记录；用户明确要求时可以保存，并保留其非规范性质。

每次持久化必须得到单独写入确认。对设计方向的“可以”不是记录写入授权。更新前读取完整当前记录，列明拟变更条目、冲突及影响；不能默认较新表述覆盖较旧确认。用户裁决后，只变更获准条目，保留无关内容，保存后查看差异并重新确认受影响结论。

CLI 验证格式、身份、路径、生命周期和上下文变化，并返回确定性差异；Agent 判断自然语言冲突与覆盖，用户裁决意图和范围。CLI 的格式合法、来源摘要相同或结构相等均不能证明意图完整。

### 4. Summary 与来源交接绑定当前版本

有记录时，Explore 在输出 Design Summary 前重新加载完整记录，检查内部冲突及记录与拟议设计的冲突，并区分已经授权的模型演进与未解决矛盾。未裁决前停止 Summary；裁决导致的记录修改仍单独授权，保存后重载并重新检查。之后记录变化使受影响的 Summary 与检查结论失效。没有记录时执行通常的设计自审。

统一 `framing consume` 显式选择 named Change 或 active Candidate 目标，避免根据当前目录猜测消费者。消费前必须以当前来源版本完成该目标适用的确定性校验和 Agent 覆盖复核；CLI 只能核对版本、校验状态及交接条件，不自行认定语义覆盖。

目标保留精确来源快照作为形成 provenance；Build 的来源快照参与 Candidate digest 和 history，但不进入正式模型分区。Change 的来源快照只解释形成过程，不参与 Expected Semantic Model 的语义计算。只有目标快照持久化并校验成功后才移除活动来源；失败保留来源和既有目标。相同快照的中断恢复可继续，冲突快照必须停止，不覆盖。交接后重新修改源/候选内容不能复用过期的确认或验证结论。

### 5. 用两段语义覆盖检查连接记录、Contract 与 Tasks

第一段检查记录中的规范性确认内容是否进入 Candidate 或 Semantic Delta 的适当 Declaration、Contract、Relationship 或 Metamodel；用户要求保留的说明性材料进入 Plan / provenance，而不是硬造规范要求。Propose 先完整读取已有记录，不把精简记录误当已穷尽全部结构决策；补足尚未确认的设计时继续遵循配置指导与用户确认。

第二段检查需要落实的目标语义是否被 Tasks 的实现安排和可观察 Checks 覆盖。缺少行为细节时回到 Contract 补足，意图无法决定时询问用户；不能在 Tasks 独立发明语义。记录内容、规范语义与执行安排不复制成三份要求文本。复核可以按条目/Requirement 建立简短对应关系，但不新增永久审计账本或 NLP 评分器。

Tasks 按独立端到端行为闭环划分；Requirements 说明实现义务并引用 Contract，Files 明确相关源文件和测试维护，Checks 引用确切 Requirement / Scenario。文件数、组件数、Requirement 数不是机械拆任务的依据。存在有效引用只是结构条件，不表示测试真正验证了行为。依赖应指向先前已 GREEN 的闭环，不能把只有接口空壳的步骤称为独立完成。

### 6. Prompt 呈现是各行为闭环的一部分

优化 Build、Explore、Propose、任务生成及共享指导。入口按“输入与权威 → 当前阶段动作 → 停止/确认条件 → 输出与交接”组织；把禁止越界、逐次授权、冲突停止和重载条件放在实际动作附近，避免散落在长篇说明中。完整共同协议只定义在共享 reference，入口用明确的何时读取/何时重读路由引用，不要求模型在多处相似段落中自行判断优先级。

同时维护模板源、manifest/同步规则、框架管理的生成面与相关测试。只刷新本 Change 影响的已登记工作面，不能覆盖用户专用 skill，也不能顺带重做质量角色提示词。每个任务必须列出其 prompt 改动及行为验收；不设置无法独立验证的“最后润色全部 prompts”任务。

协议命令、必读路由、授权门禁、禁止操作与 fail-closed 条件保留确定性测试。对普通自然语言措辞不增加逐段 `.toContain` 镜像断言；用可复现的真实场景 walkthrough 验证模型能遵循信息结构、发现冲突并保持细节。

## Risks / Trade-offs

- **通用记录减少结构自动比对能力**：保留确定性格式/版本/上下文检查，将自然语言覆盖明确交给 Agent 与用户，不声称比旧结构匹配更自动。
- **来源与目标出现双重权威**：源记录只参与形成与 provenance；进入完整目标语义后，规范权威仍是 Semantic Model / Semantic Delta。
- **确认步骤增加交互成本**：仅记录关键确认与用户指定材料；不强制所有流程都建记录，但不能省略每次实际写入授权。
- **共享 prompt 改动影响多个入口**：沿现有 manifest 和同步测试验证引用可达性及固定工作流集合，保持显式项目指导优先。
- **跨平台路径与中断恢复风险**：保留并调整路径隔离、symlink、原子写入和恢复测试，在现有 Windows CI 上执行受影响用例。

## Test Maintenance

持久测试覆盖缺省配置与显式值保留、默认 Kind skeleton、记录 CRUD/身份/格式/安全路径/上下文、Build 与 Change 交接、digest/history 与失败恢复。复用现有 task 引用/结构验证测试，不新建重复校验器。

替换旧的“仅 Change / 完整四分区结构目标 / 结构相等即覆盖”断言；只删除因此失效的测试假设，保留有效的路径安全、失败保留、幂等恢复、必需协议标记和禁止操作检查。普通措辞断言只在约束实际行为或输出协议时保留。

## One-time Verification

- 以同一记录依次演示：用户要求记录细节 → 单独授权保存 → 新设计与既有条目冲突 → 用户裁决 → 单独授权更新 → diff / 完整重载 → Summary；确认未裁决和过期结论不能放行。
- 分别演示首次 Build（不存在 formal model）与 Change 形成；确认缺失记录不阻塞普通流程，损坏模型不被误判为缺失。
- 选取带数值、条件、例外和时序的确认条目，追踪到 Contract 与 Tasks/Checks；说明性材料保留但不被强制改写成规范语义。
- 从源模板生成受影响工作面，检查引用可达、协议只有一个完整定义、入口路由清晰；运行 build、lint、相关测试及现有跨平台 CI。

## Migration Plan

实现时更新缺省值、框架 skeleton、统一记录及消费者，再通过现有 manifest 刷新受管理 prompt 工作面。有效的显式配置不变；旧记录仅诊断，不迁移、不删除。Change 的 Schema / Contract 引用与实现任务应在 Propose 结束前通过联合校验。实施及其独立 Verify 留待用户启动 Apply；本次不改正式语义模型。
