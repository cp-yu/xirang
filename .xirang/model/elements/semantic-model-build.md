---
entity: element-declaration
identity: semantic-model-build
kind: element
parent: realization-process
title: Semantic Model Build
definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
---

## Requirements

### Requirement: 遵守用户授权范围与依据

Semantic Model Build SHALL 在用户授权的探索范围与声明的权威依据下推进。

#### Scenario: 开始模型构建

- **WHEN** 用户明确范围与权威来源
- **THEN** Agent 只在授权边界内编译目标语义

### Requirement: 选择探索范围与 Candidate 起点

Build 启动时 SHALL 让用户选择探索范围（whole project、code and tests、documentation and current Xirang 或 custom paths and rules），并在当前 formal model 存在时显式选择 Candidate 起点（基于当前模型构建、重新构建或使用指定内容作为起点）。

#### Scenario: 用户选择探索范围

- **WHEN** Build 在无 active Candidate 时启动
- **THEN** 用户声明的 source-of-truth 约束被记录在 `build.md`
- **AND** 不静默将代码、测试、文档、配置、Git history 或当前 Xirang 指定为 source of truth

#### Scenario: 用户选择基于当前模型构建

- **WHEN** 用户选择“基于当前 Xirang 构建”
- **THEN** Candidate 从当前 formal source 初始化，且 digest-confirmed promotion 前当前 formal source 保持不变

#### Scenario: 用户选择重新构建

- **WHEN** 用户选择“重新构建 Xirang”
- **THEN** 初始化 clean Candidate skeleton，当前 formal source MAY 作为选定证据但不被复制到 Candidate

#### Scenario: 用户指定构建起点

- **WHEN** 用户选择"使用指定内容作为起点"
- **THEN** Candidate 仅从用户批准的路径初始化
- **AND** SHALL NOT 推断额外的 baseline 路径

### Requirement: 产出完整 Candidate

Semantic Model Build SHALL 产出一个完整四分区 Candidate Semantic Model。

#### Scenario: Candidate 可供审查

- **WHEN** 模型编写完成
- **THEN** Candidate 联合包含 Metamodel、Elements、Relationships 与 Views

#### Scenario: Candidate 按四分区编写

- **WHEN** Agent 已解决所需的 semantic decisions
- **THEN** SHALL 编写 `.xirang/candidate/{metamodel,elements,relationships,views}/`，使其共同组成一个 Candidate
- **AND** 每个 `elements/<identity>.md` 单元 SHALL 同时承载一个 Element Declaration 与至多一个 Element Contract（正文 Requirements）
- **AND** SHALL NOT 创建 `candidate/architecture`、`candidate/contracts` 或其他平行 Contract store

#### Scenario: Required element 需要 contract

- **WHEN** Agent 编写 `contract: required` 的 element kind
- **THEN** 每个 required element SHALL 在其自身 `elements/` 单元正文中携带 Contract（至少一个 Requirement）
- **AND** Agent SHALL 将缺失 Contract 视为 decision gap，不得创建 catch-all owner 或独立 Spec 单元

### Requirement: 不通过 Change 构建模型

Semantic Model Build SHALL NOT 通过 Change 或 Semantic Delta 构建或重建 Semantic Model。

#### Scenario: 执行 Project Build

- **WHEN** 目标是整体构建模型
- **THEN** Agent 使用 Candidate 而不创建模型 Change

### Requirement: 只读校验 Candidate

CLI SHALL 对 Candidate 执行只读确定性校验。

#### Scenario: Candidate 存在错误

- **WHEN** 校验发现无效语义或记法
- **THEN** CLI 返回 diagnostics 且不修改 Candidate

### Requirement: 返回 Review Digest

CLI SHALL 为有效 Candidate 返回绑定该精确版本的 review digest。

#### Scenario: Candidate 校验通过

- **WHEN** Candidate 没有验证错误
- **THEN** CLI 返回可供确认的 digest

### Requirement: 由用户确认精确版本

Promotion SHALL 仅接受用户确认的 Candidate 精确版本。

#### Scenario: Candidate 在确认后改变

- **WHEN** 当前内容与用户确认的 digest 不一致
- **THEN** CLI 拒绝 promotion

### Requirement: 原子提升并保留 History

用户确认后，CLI SHALL 将 Candidate 原子提升为 Semantic Model 并保留必要 history。

#### Scenario: Promotion 成功

- **WHEN** 当前 Candidate 匹配已确认 digest
- **THEN** 正式模型整体进入新状态且历史保留

### Requirement: 整体替换正式模型

Promotion SHALL 以 Candidate 的四个分区整体替换 `.xirang/model/`；Candidate 中不存在的正式模型单元 SHALL NOT 被保留。

#### Scenario: Candidate 删除旧单元

- **WHEN** 已确认 Candidate 不包含旧模型中的实体
- **THEN** promotion 后该实体不再属于正式模型

### Requirement: 隔离临时构建依据

`build.md` 等临时 scaffolding SHALL NOT 成为提升后 Semantic Model 的组成。

#### Scenario: 提升 Candidate

- **WHEN** promotion 成功
- **THEN** `.xirang/model/` 仅包含四个规范分区

### Requirement: 先初始化再记录构建依据

Semantic Model Build SHALL 在确定 Candidate baseline 并执行 `candidate init` 后，才将授权范围、权威顺序和当前要求写入 `.xirang/candidate/build.md`。

#### Scenario: 开始新的 Build

- **WHEN** 用户已选择 Candidate baseline
- **THEN** Agent 先初始化 Candidate workspace，再写入 build.md

### Requirement: 显式处理 Active Candidate

进入 Build 时已存在 active Candidate，Semantic Model Build SHALL 向用户呈现其 baseline、inventory 与 status，并要求用户明确选择继续或授权丢弃后重新初始化。

#### Scenario: 检测到 Active Candidate

- **WHEN** Candidate status 报告 active
- **THEN** Build 不静默继续或替换该 Candidate

### Requirement: 在编写前通过 Modeling Decision Gate

Semantic Model Build SHALL 在探索授权证据后、首次编写 Candidate 前解决所有会改变目标模型的未决选择，并按权威冲突、Element identity 与边界、hierarchy、Metamodel、Contracts、Relationships、Authored Views 的依赖顺序推进。

#### Scenario: 多个目标模型符合现有依据

- **WHEN** 一个未决选择会改变稳定 identity、层级、契约、Kind、Relationship 或 View
- **THEN** Agent 提供受限选项并一次请求一个用户裁决

### Requirement: 仅记录例外 Provenance

`build.md` SHALL 仅在全局权威顺序之外记录用户裁决、权威冲突解决、非显然证据选择和明确排除的实现事实，并 SHALL 标识决策、依据及影响范围。

#### Scenario: Requirement 直接来自全局权威

- **WHEN** 目标语义可从已记录权威唯一确定
- **THEN** Build 不为该 Requirement 重复创建逐条来源记录

### Requirement: 按 BFS 语义层编写 Candidate

Semantic Model Build SHALL 依次编写 Metamodel、Element Declarations 与 hierarchy、Element Contracts、Relationships、Authored Views；每个 Declaration SHALL 在对应 Contract 之前完成完整 Definition，并在每层完成后执行针对该层的 Agent 检查。

#### Scenario: 中间层尚不完整

- **WHEN** required Contracts 尚未在 Declaration 层之后写入
- **THEN** Build 不对故意不完整的中间状态要求完整 candidate validate

### Requirement: 按独立演进边界编写 Requirements

Semantic Model Build SHALL 以规范承诺能否独立新增、修改或移除判断 Requirement 边界，SHALL NOT 按句子、分句、`SHALL` 数量或目标条数机械拆分。

#### Scenario: 动作与结果不可分

- **WHEN** 条件、动作、结果与保证共同构成同一不可独立演进的承诺
- **THEN** Build 将它们保留在一个 Requirement 中

### Requirement: 保留独立整体约束

Element Contract 中只复述 Declaration Definition 或 sibling Requirements 语义并集且不增加规范承诺的条目 SHALL NOT 成为 Requirement；独立的不变量、顺序、原子性、一致性或完成条件 SHALL 保留为 Requirement。

#### Scenario: 父级定义跨子能力顺序

- **WHEN** 整体 Element 需要约束多个子行为的顺序
- **THEN** Build 保留该整体 Requirement

### Requirement: 确定性校验后执行独立语义审查

完整 Candidate 通过 `candidate validate` 后，Semantic Model Build SHALL 启动一个新的 read-only clean-context 通用 subagent，要求其自行读取 `build.md`、四分区、权威来源、必要证据与 validation 结果并审查授权完整性和语义正确性。

#### Scenario: Candidate 结构有效

- **WHEN** deterministic validation 没有 ERROR
- **THEN** Build 在向用户呈现 digest 前执行独立 semantic review

#### Scenario: 可选 subagent 加速探索

- **WHEN** 并行探索有助于 Agent 理解用户批准的项目范围
- **THEN** Agent MAY 使用 task-specific prompts 调用 subagents
- **AND** Candidate validation 与 promotion SHALL NOT 依赖 subagent availability 或固定 subagent role

### Requirement: 只以阻塞语义问题拒绝审查

Candidate semantic review SHALL 只以 `BLOCKER` 或 `HIGH` findings 判定 FAIL，SHALL NOT 将措辞偏好或非阻塞样式意见送入修正循环。

#### Scenario: Review 只有样式意见

- **WHEN** Subagent 未发现授权、完整性或语义正确性问题
- **THEN** Semantic review 返回 PASS

### Requirement: Candidate 修改后重新审查

任何 Candidate 修改 SHALL 使先前 semantic review 结论失效；Build SHALL 重新运行 deterministic validation，并启动另一个新的 clean-context subagent。

#### Scenario: 修正 Review Finding

- **WHEN** Agent 修改 Candidate source
- **THEN** Build 不恢复或复用原 subagent 上下文

### Requirement: 缺少 Clean Context 时 Fail Closed

当前工具无法提供 clean-context subagent 时，Semantic Model Build SHALL 暂停并报告缺失能力，SHALL NOT 退化为 authoring Agent 自审。

#### Scenario: 工具不支持隔离委托

- **WHEN** Build 到达 semantic review gate
- **THEN** Build 不向用户声明 Candidate 已通过完整审查

### Requirement: Promotion 后验证 Build 后置条件

Promotion 成功后，Semantic Model Build SHALL 依次确认 Candidate inactive、`.xirang/model/` 四个分区均为真实目录且 `arch validate --json` success，才报告 Build 完成。

#### Scenario: Post-promotion Validation 有 Warning

- **WHEN** Formal validation success 且包含 warnings
- **THEN** Build 报告 warnings 但仍可完成

### Requirement: 后置条件失败时不自动重试

任一 promotion 后置条件失败时，Semantic Model Build SHALL 报告 promotion 是否成功、失败条件及当前 Formal/Candidate 状态，SHALL NOT 自动再次 promotion。

#### Scenario: Promotion 成功但 Candidate 仍 Active

- **WHEN** post-promotion status 不满足生命周期条件
- **THEN** Build 停止完成声明并报告异常

### Requirement: 编写完整 Element Definition

Semantic Model Build SHALL 结合 Element 的 parent、children 与 siblings 编写完整 Definition，使 Agent 可仅从 Declaration 与相邻层级上下文识别该 Element 的概念身份、独立理由和范围边界。

#### Scenario: Definition 只是标题换写

- **WHEN** Candidate Declaration 未完整表达 Element 的概念身份或边界
- **THEN** Build 在进入 Contract 层前修正该 Definition

### Requirement: 独立审查 Definition 质量

Candidate semantic review SHALL 检查每个 Definition 是否完整、是否混入 Contract 或实现语义，以及是否与 parent、children 或 siblings 重复、冲突或发生边界漂移。

#### Scenario: Clean-context Review 发现概念边界冲突

- **WHEN** 两个 Elements 的 Definitions 无法区分各自独立概念范围
- **THEN** review 返回阻塞 finding，Build 修正 Candidate 或返回 Modeling Decision Gate

### Requirement: Element Kind 是语义标签不约束层级

Semantic Model Build 编写 Element Declaration 时 SHALL 将 Element Kind 视为语义标签，而非层级约束。任何 Kind 可出现在任意深度，父 Element 的 Kind 不限制子 Element 的 Kind。层级只表达抽象→细化。`parent` 字段必需，children 由 parents 推导获得。

#### Scenario: 跨 kind 层级

- **WHEN** Agent 编写一个 element 其 parent 是 perspective、自身是 element kind
- **THEN** Build SHALL 接受该层级结构
- **AND** SHALL NOT 因 kind 不匹配白名单而拒绝

### Requirement: 从 legacy 文档恢复语义需 agent 选择归属

Semantic Model Build 从 legacy 文档或正式模型恢复仍适用的行为时，SHALL 由 Agent 确定每段内容归属于哪个 Element、哪个层级、哪个 Contract Requirement 或 Scenario。内容归属是语义选择，需要 model 理解能力，不得由文件名称、标题匹配或程序化映射自动决定。

#### Scenario: 纯复制可直接做

- **WHEN** 恢复内容可直接复制且无需改写
- **THEN** Agent MAY 直接复制

#### Scenario: 非复制改写必须通过 subagent

- **WHEN** 恢复内容需要改写或词汇迁移（如 `spec` → `contract`、`architecture-delta.c4` → 四分区 Semantic Delta、`.opsx` → `.xirang`）
- **THEN** Agent SHALL 通过 subagent 完成（有 subagent 时）
- **AND** SHALL 使用初始阶段用户选择的模型

#### Scenario: 已覆盖内容不重复添加

- **WHEN** Candidate 已有内容覆盖 legacy 文档的同义行为
- **THEN** Agent SHALL 跳过该内容

#### Scenario: 退役行为不复活

- **WHEN** legacy 文档包含已明确排除的退役行为（如 architecture-delta.c4 持久化、Spec store/registry/frontmatter、`xirang change/spec/diff` 命令组、archive-time sync 或 `--no-sync`、impact-sweeper、scenario operation-label 接受）
- **THEN** Agent SHALL NOT 将该行为写入 Candidate
- **AND** SHALL 在 `build.md` 中记录 covered、added 与 retired 的 sources
