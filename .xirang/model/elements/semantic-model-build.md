---
entity: element-declaration
identity: semantic-model-build
kind: element
parent: realization-process
title: Semantic Model Build
definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
---

## Specification

### Section: 遵守用户授权范围与依据

Semantic Model Build SHALL 在用户授权的探索范围与声明的权威依据下推进。

- **开始模型构建**

  - 用户明确范围与权威来源
  - Agent 只在授权边界内编译目标语义

### Section: 选择探索范围与 Candidate 起点

Build 启动时 SHALL 让用户选择探索范围（whole project、code and tests、documentation and current Xirang 或 custom paths and rules），并在当前 formal model 存在时显式选择 Candidate 起点（基于当前模型构建、重新构建或使用指定内容作为起点）。

- **用户选择探索范围**

  - Build 在无 active Candidate 时启动
  - 用户声明的 source-of-truth 约束被记录在 `build.md`
  - 不静默将代码、测试、文档、配置、Git history 或当前 Xirang 指定为 source of truth

- **用户选择基于当前模型构建**

  - 用户选择“基于当前 Xirang 构建”
  - Candidate 从当前 formal source 初始化，且 digest-confirmed promotion 前当前 formal source 保持不变

- **用户选择重新构建**

  - 用户选择“重新构建 Xirang”
  - 初始化 clean Candidate skeleton，当前 formal source MAY 作为选定证据但不被复制到 Candidate

- **用户指定构建起点**

  - 用户选择"使用指定内容作为起点"
  - Candidate 仅从用户批准的路径初始化
  - SHALL NOT 推断额外的 baseline 路径

### Section: 产出完整 Candidate

Semantic Model Build SHALL 产出一个完整四分区 Candidate Semantic Model。

- **Candidate 可供审查**

  - 模型编写完成
  - Candidate 联合包含 Metamodel、Elements、Relationships 与 Views

- **Candidate 按四分区编写**

  - Agent 已解决所需的 semantic decisions
  - SHALL 编写 `.xirang/candidate/{metamodel,elements,relationships,views}/`，使其共同组成一个 Candidate
  - 每个 `elements/<identity>.md` 单元 SHALL 同时承载一个 Element Declaration 与至多一个 Element Contract（正文为 `## Specification`）
  - SHALL NOT 创建 `candidate/architecture`、`candidate/contracts` 或其他平行 Contract store

- **Required element 需要 contract**

  - Agent 编写 `contract: required` 的 element kind
  - 每个 required element SHALL 在其自身 `elements/` 单元正文中携带 Contract（至少一个 Section）
  - Agent SHALL 将缺失 Contract 视为 decision gap，不得创建 catch-all owner 或独立 Spec 单元

### Section: 不通过 Change 构建模型

Semantic Model Build SHALL NOT 通过 Change 或 Semantic Delta 构建或重建 Semantic Model。

- **执行 Project Build**

  - 目标是整体构建模型
  - Agent 使用 Candidate 而不创建模型 Change

### Section: 只读校验 Candidate

CLI SHALL 对 Candidate 执行只读确定性校验。

- **Candidate 存在错误**

  - 校验发现无效语义或记法
  - CLI 返回 diagnostics 且不修改 Candidate

### Section: 返回 Review Digest

CLI SHALL 为有效 Candidate 返回绑定该精确版本的 review digest。

- **Candidate 校验通过**

  - Candidate 没有验证错误
  - CLI 返回可供确认的 digest

### Section: 由用户确认精确版本

Promotion SHALL 仅接受用户确认的 Candidate 精确版本。

- **Candidate 在确认后改变**

  - 当前内容与用户确认的 digest 不一致
  - CLI 拒绝 promotion

### Section: 原子提升并保留 History

用户确认后，CLI SHALL 将 Candidate 原子提升为 Semantic Model 并保留必要 history。

- **Promotion 成功**

  - 当前 Candidate 匹配已确认 digest
  - 正式模型整体进入新状态且历史保留

### Section: 整体替换正式模型

Promotion SHALL 以 Candidate 的四个分区整体替换 `.xirang/model/`；Candidate 中不存在的正式模型单元 SHALL NOT 被保留。

- **Candidate 删除旧单元**

  - 已确认 Candidate 不包含旧模型中的实体
  - promotion 后该实体不再属于正式模型

### Section: 隔离临时构建依据

`build.md` 等临时 scaffolding SHALL NOT 成为提升后 Semantic Model 的组成。 已确认设计来源快照同样 SHALL 只进入 Build history，不提升为正式模型分区。

- **提升 Candidate**

  - promotion 成功
  - `.xirang/model/` 仅包含四个规范分区

### Section: 先初始化再记录构建依据

Semantic Model Build SHALL 在确定 Candidate baseline 并执行 `candidate init` 后，才将授权范围、权威顺序和当前要求写入 `.xirang/candidate/build.md`。 独立的 CLI-managed 已确认设计记录 MAY 在 Candidate 初始化前建立，但不得提前写入尚不存在的 Candidate build.md；它不能绕过后续范围、依据与精确版本确认。

- **开始新的 Build**

  - 用户已选择 Candidate baseline
  - Agent 先初始化 Candidate workspace，再写入 build.md

### Section: 显式处理 Active Candidate

进入 Build 时已存在 active Candidate，Semantic Model Build SHALL 向用户呈现其 baseline、inventory 与 status，并要求用户明确选择继续或授权丢弃后重新初始化。

- **检测到 Active Candidate**

  - Candidate status 报告 active
  - Build 不静默继续或替换该 Candidate

### Section: 在编写前通过 Modeling Decision Gate

Semantic Model Build SHALL 在探索授权证据后、首次编写 Candidate 前解决所有会改变目标模型的未决选择，并按权威冲突、Element identity 与边界、hierarchy、Metamodel、Contracts、Relationships、Authored Views 的依赖顺序推进。

- **多个目标模型符合现有依据**

  - 一个未决选择会改变稳定 identity、层级、契约、Kind、Relationship 或 View
  - Agent 提供受限选项并一次请求一个用户裁决

### Section: 仅记录例外 Provenance

`build.md` SHALL 仅在全局权威顺序之外记录用户裁决、权威冲突解决、非显然证据选择和明确排除的实现事实，并 SHALL 标识决策、依据及影响范围。

- **语义直接来自全局权威**

  - 目标语义可从已记录权威唯一确定
  - Build 不为该语义重复创建逐条来源记录

### Section: 按 BFS 语义层编写 Candidate

Semantic Model Build SHALL 依次编写 Metamodel、Element Declarations 与 hierarchy、Element Contracts、Relationships、Authored Views；每个 Declaration SHALL 在对应 Contract 之前完成完整 Definition，并在每层完成后执行针对该层的 Agent 检查。

- **中间层尚不完整**

  - required Contracts 尚未在 Declaration 层之后写入
  - Build 不对故意不完整的中间状态要求完整 candidate validate

### Section: 按独立演进边界编写 Sections

Semantic Model Build SHALL 以规范承诺能否独立新增、修改或移除判断 Section 边界，SHALL NOT 按句子、分句、`SHALL` 数量或目标条数机械拆分。

- **动作与结果不可分**

  - 条件、动作、结果与保证共同构成同一不可独立演进的承诺
  - Build 将它们保留在一个 Section 中

### Section: 保留独立整体约束

Element Contract 中只复述 Declaration Definition 或 sibling Sections 语义并集且不增加规范承诺的条目 SHALL NOT 成为 Section；独立的不变量、顺序、原子性、一致性或完成条件 SHALL 保留为 Section。

- **父级定义跨子能力顺序**

  - 整体 Element 需要约束多个子行为的顺序
  - Build 保留该整体 Section

### Section: 确定性校验后执行独立语义审查

完整 Candidate 通过 `candidate validate` 后，Semantic Model Build SHALL 启动一个新的 read-only clean-context 通用 subagent，要求其自行读取 `build.md`、四分区、权威来源、必要证据与 validation 结果并审查授权完整性和语义正确性。

- **Candidate 结构有效**

  - deterministic validation 没有 ERROR
  - Build 在向用户呈现 digest 前执行独立 semantic review

- **可选 subagent 加速探索**

  - 并行探索有助于 Agent 理解用户批准的项目范围
  - Agent MAY 使用 task-specific prompts 调用 subagents
  - Candidate validation 与 promotion SHALL NOT 依赖 subagent availability 或固定 subagent role

### Section: 只以阻塞语义问题拒绝审查

Candidate semantic review SHALL 只以 `BLOCKER` 或 `HIGH` findings 判定 FAIL，SHALL NOT 将措辞偏好或非阻塞样式意见送入修正循环。

- **Review 只有样式意见**

  - Subagent 未发现授权、完整性或语义正确性问题
  - Semantic review 返回 PASS

### Section: Candidate 修改后重新审查

任何 Candidate 修改 SHALL 使先前 semantic review 结论失效；Build SHALL 重新运行 deterministic validation，并启动另一个新的 clean-context subagent。

- **修正 Review Finding**

  - Agent 修改 Candidate source
  - Build 不恢复或复用原 subagent 上下文

### Section: 缺少 Clean Context 时 Fail Closed

当前工具无法提供 clean-context subagent 时，Semantic Model Build SHALL 暂停并报告缺失能力，SHALL NOT 退化为 authoring Agent 自审。

- **工具不支持隔离委托**

  - Build 到达 semantic review gate
  - Build 不向用户声明 Candidate 已通过完整审查

### Section: Promotion 后验证 Build 后置条件

Promotion 成功后，Semantic Model Build SHALL 依次确认 Candidate inactive、`.xirang/model/` 四个分区均为真实目录且 `arch validate --json` success，才报告 Build 完成。

- **Post-promotion Validation 有 Warning**

  - Formal validation success 且包含 warnings
  - Build 报告 warnings 但仍可完成

### Section: 后置条件失败时不自动重试

任一 promotion 后置条件失败时，Semantic Model Build SHALL 报告 promotion 是否成功、失败条件及当前 Formal/Candidate 状态，SHALL NOT 自动再次 promotion。

- **Promotion 成功但 Candidate 仍 Active**

  - post-promotion status 不满足生命周期条件
  - Build 停止完成声明并报告异常

### Section: 编写完整 Element Definition

Semantic Model Build SHALL 结合 Element 的 parent、children 与 siblings 编写完整 Definition，使 Agent 可仅从 Declaration 与相邻层级上下文识别该 Element 的概念身份、独立理由和范围边界。

- **Definition 只是标题换写**

  - Candidate Declaration 未完整表达 Element 的概念身份或边界
  - Build 在进入 Contract 层前修正该 Definition

### Section: 独立审查 Definition 质量

Candidate semantic review SHALL 检查每个 Definition 是否完整、是否混入 Contract 或实现语义，以及是否与 parent、children 或 siblings 重复、冲突或发生边界漂移。

- **Clean-context Review 发现概念边界冲突**

  - 两个 Elements 的 Definitions 无法区分各自独立概念范围
  - review 返回阻塞 finding，Build 修正 Candidate 或返回 Modeling Decision Gate

### Section: Element Kind 是语义标签不约束层级

Semantic Model Build 编写 Element Declaration 时 SHALL 将 Element Kind 视为项目定义的语义标签，而非层级约束：优先选择最能准确表达该 Element 语义的最具体既有 Kind；当无合适 Kind 时，通过 Metamodel 新增或细化 Kind，而不是削弱 Element 的语义仅因能通过验证就使用泛化 Kind。任何 Kind 可出现在任意深度，父 Element 的 Kind 不限制子 Element 的 Kind。层级只表达抽象→细化。`parent` 字段必需，children 由 parents 推导获得。

- **跨 kind 层级**

  - Agent 编写一个 element 其为任意 Kind
  - Build SHALL 接受该层级结构
  - SHALL NOT 因 kind 不匹配白名单而拒绝

- **无合适 Kind 时通过 Metamodel 新增**

  - 项目当前没有 Kind 能准确表达 Element 的语义
  - Build SHALL 在 Metamodel 中新增或细化一个 Kind
  - SHALL NOT 使用一个虽然可验证但语义不匹配的泛化 Kind

### Section: 从 legacy 文档恢复语义需 agent 选择归属

Semantic Model Build 从 legacy 文档或正式模型恢复仍适用的行为时，SHALL 由 Agent 确定每段内容归属于哪个 Element、哪个层级、哪个 Contract Section。内容归属是语义选择，需要 model 理解能力，不得由文件名称、标题匹配或程序化映射自动决定。

- **纯复制可直接做**

  - 恢复内容可直接复制且无需改写
  - Agent MAY 直接复制

- **非复制改写必须通过 subagent**

  - 恢复内容需要改写或词汇迁移（如 `spec` → `contract`、`architecture-delta.c4` → 四分区 Semantic Delta、`.opsx` → `.xirang`）
  - Agent SHALL 通过 subagent 完成（有 subagent 时）
  - SHALL 使用初始阶段用户选择的模型

- **已覆盖内容不重复添加**

  - Candidate 已有内容覆盖 legacy 文档的同义行为
  - Agent SHALL 跳过该内容

- **退役行为不复活**

  - legacy 文档包含已明确排除的退役行为（如 architecture-delta.c4 持久化、Spec store/registry/frontmatter、`xirang change/spec/diff` 命令组、archive-time sync 或 `--no-sync`、impact-sweeper、operation label 接受）
  - Agent SHALL NOT 将该行为写入 Candidate
  - SHALL 在 `build.md` 中记录 covered、added 与 retired 的 sources

### Section: 按项目配置形成 Candidate hierarchy

Semantic Model Build SHALL 在 Modeling Decision Gate 与首次 Candidate hierarchy 写入前消费 normalized `decomposition`：完整读取解析路径指向的指导文件，并按其形成 Candidate hierarchy；文件缺失或不可读时 fail closed。CLI 解析是机械的名称到路径映射，SHALL NOT 解释方法论内容。拆分指导只决定 Element abstraction/refinement 使用的分解坐标系，SHALL NOT 覆盖用户授权、证据权威、Element Contract 或 Relationship 语义。

- **读取解析后的指导文件**

  - 有效配置的 `decomposition` 解析出指导文件路径
  - Build 在结构决策前完整读取该文件并遵循其拆分指导
  - 对每个 sibling set 执行单维度、MECE 与 BFS 检查

- **指导文件不可用时停止结构形成**

  - 解析路径的指导文件缺失或不可读
  - Build fail closed 并报告该解析路径
  - 不以任何默认方法继续写入 Candidate hierarchy

- **独立语义审查检查拆分一致性**

  - Candidate 进入 clean-context semantic review
  - review 检查 hierarchy 是否一致应用已选择的拆分指导
  - 检查同一 sibling set 未混合不相容的职责、生命周期、部署或实现维度

### Section: 复用确认记录形成 Candidate

Semantic Model Build SHALL 使用统一中间设计记录格式及共享写作、确认权和覆盖规则，实例与 Change 记录隔离。用户确认即授权记录，只报告局部变更；记录容纳当前设计及显式决策状态，不将旧格式或 pending 当作确认。

存在记录时重载、调和冲突，仅将已采纳且适用的规范内容编写为 Candidate；拆出条件、数值、例外、时序与原样正反例的原子细节，给出 Candidate 中的位置与摘录，经 xirang record coverage --candidate 记录。影响目标的 pending 问题先解决，不适用项说明理由；excluded 与 informative 保留必要依据，不强造义务。结构部分与 Candidate 逐字段比对。用户例子写为具体验收内容，不能泛化。

无记录时 build.md 的授权范围须声明用户豁免或本次无 normative 内容，未声明阻塞 promotion readiness，不创建空记录。沿用 Candidate review、digest、promotion 与 history，不增加 Design Summary 门禁；覆盖及结构门禁通过后才允许来源交接。

### Section: 交接记录后确认精确 Candidate

Build SHALL 在覆盖结果经 CLI 记录有效、结构比对一致与适用校验通过后经 `xirang record consume --candidate` 向 active Candidate 交接精确记录来源，再验证带来源的最终 Candidate 并执行既有独立审查与用户 digest 确认。源或目标变化使受影响覆盖与确认失效。豁免或无记录时 SHALL 跳过 consumption 并在 promotion readiness 前核对已声明的记录决策，SHALL NOT 跳过确定性校验或独立语义审查本身。来源快照与覆盖结果 SHALL 进入 history 而不进入正式模型。

- **确认最终带来源版本**

  - 覆盖复核与校验通过且来源可消费
  - 交接精确来源，验证带来源的最终 Candidate 并以其 digest 完成确认

- **来源交接失败**

  - `xirang record consume` 返回失败
  - 保留来源与既有目标，阻塞 promotion readiness

- **豁免时跳过消费但不跳过校验**

  - 来源已声明豁免或无记录
  - 跳过 consumption 并在 promotion readiness 前核对 `build.md` 上的记录决策
  - 确定性校验与独立语义审查仍照常执行
