## Context

Semantic Model Build 当前把范围确认、Candidate 编写、确定性校验和 digest 授权串成单一流程，但缺少编写前的语义决策门禁、稳定的 Contract 粒度规则和独立语义审查。Candidate validator 已具备目录、canonical text、基础 hierarchy 与 endpoint 校验，却没有完整执行 Requirement/Scenario 唯一性、Kind/View 引用闭包和错分区 warning。Candidate validation 还始终返回空 `ChangeDiff`，无法区分 Formal 缺失与无语义变化。

本变更以 `opt-build.md` 中逐项确认的决策为实现输入，并同步已经更新的 `xirang-definition.md` 与正式 Semantic Model。`opt-build.md` 作为项目级设计证据保留，但不构成规范语义来源；规范目标仍只由 Semantic Delta 定义。

## Goals / Non-Goals

**Goals:**

- 让 Build 在首次写 Candidate 前消除会改变目标模型的未决语义。
- 以共享 fragment 向 Build、Propose 与 Snack 投影统一的 Element Contract、Requirement 与 Scenario 语义。
- 以 BFS 语义层编写 Candidate，并在确定性校验后强制执行通用 clean-context subagent 语义审查。
- 完成 Semantic Model 的名称、Scenario、Kind、View 和组织诊断门禁。
- 在 Formal 存在时产生真实 promotion diff，在 Formal 缺失时显式声明 comparison unavailable。
- 通过 Semantic Delta 将新定义、`responsible-for` 和正式模型 Contracts 同步到目标状态。

**Non-Goals:**

- 不定义 Requirement rename 语义。
- 不新增 Xirang 专用 model reviewer 或复用 Change Implementation Reviewer。
- 不将父 Contract 表达成相对 children 的差量。
- 不要求 `parents` 与 `children` 机械对称。
- 不保证 promotion 保持 Git status 或 index 不变。
- 不持久化 Derived Views。

## Decisions

### 共享语义投影保持单一源码

在 `src/core/templates/fragments/xirang-fragments.ts` 新增 `ELEMENT_CONTRACT_SEMANTICS`。Build、Propose 与 Snack templates 直接插入该常量；`SEMANTIC_MODEL_UNIT_NOTATION` 继续只承载存储记法。这样生成后的 Skill 自包含语义定义，同时避免三个模板维护不同副本。

不采用把完整 `xirang-definition.md` 安装到每个项目 references 的方案，因为完整 Definition 会引入与具体 workflow 无关的上下文。也不在三个模板中分别复制定义，避免漂移。

### Build 使用条件式决策门禁和 BFS 编译

Build 先处理 active Candidate 与 baseline，再写 `build.md`，完成授权范围探索后执行 Modeling Decision Gate。只有存在会改变 identity、hierarchy、Contract、Kind、Relationship 或 View 的多个合理目标时才询问用户。用户裁决和非显然依据以例外 provenance 写入 `build.md`。

Candidate 按 Metamodel、Declarations/hierarchy、Contracts、Relationships、Authored Views 的 BFS 层次编写。中间层只做 Agent 检查；完整五层形成后才运行 `candidate validate`，避免 required Contract 尚未写入时产生预期错误。

### 独立语义审查使用通用 Subagent

确定性校验通过后，Build 启动新的 read-only clean-context subagent，提供 project root、Candidate root、`build.md`、digest、授权范围、权威顺序和审查输出结构。Subagent 自行读取四分区与证据，只报告 `BLOCKER`/`HIGH`。Candidate 任何修改都会使旧结论失效并要求新上下文复审；无法提供 clean context 时 fail closed。

不新增固定 reviewer artifact，因为审查需要的是上下文隔离和完整输入，而不是新的持久协作身份。

### Validator 在统一 Model 层补齐确定性门禁

Requirement/Scenario 重名、Requirement 缺少 Scenario、未声明 Element/Relationship Kind、Kind constraint 引用和 View 引用均在 `validateSemanticModel` 及 parser diagnostics 层实现，使 Candidate、Formal 和 Expected Model 共用结果。

`ModelIndex.organizationWarnings()` 转换为 `ENTITY_PARTITION_MISMATCH` warning。错分区仍按显式 `entity` 解析，因此 warning 不阻止 digest 或 promotion。引用检查使用现有 identity maps 与显式字段列表，不以路径模式推断；路径诊断继续使用 Node `path` API 和规范化输出，兼容 Windows。

### Candidate comparison 使用显式可用性联合类型

`CandidateValidationResult` 新增 `comparison`。Formal 有效时读取当前模型并调用现有 `createSemanticDiff`；Formal 不存在时返回 `{baseline: "absent", diff: "unavailable", reason: "formal-model-absent"}`，同时省略 `diff`。初始化来源仍只保存在 `candidate.yaml.baseline`。Candidate 与 Change compilation 复用 `semanticModelFingerprint`，避免 Formal fingerprint 算法分叉。

不把 Formal 缺失解释成空模型，因为不存在的正式状态不是可比较的规范 baseline。Comparison availability 不进入 review digest。

### Promotion 后检查保持工作流级后置条件

Build 在 promotion 返回成功后依次检查 Candidate inactive、四个 Formal 目录均为真实目录、`arch validate` success。Warnings 只报告。任一后置条件失败时报告已发生的 promotion 和当前状态，不自动重试。

### Realization 以关系显式连接两个描述维度

推进过程和协作结构分别完整描述 Activity/Stage 与 Participant/Role，允许跨维度语义覆盖。新增 `responsible-for` 从工作身份指向承担的 Activity/Stage，不表示独占执行。八条关系采用显式 identity 列表，不从名称自动生成。

## Risks / Trade-offs

- [Build template 变长] → 把通用语义放入一个 fragment，Build 专属规则只保留在 Build template。
- [严格语义审查依赖 subagent 能力] → 明确 fail closed，避免退化成作者自审并产生虚假通过。
- [新增 Validator 门禁暴露既有无效 fixture] → 先增加 targeted RED tests，再逐个修正仅受新规范影响的 fixtures。
- [Candidate result JSON 变化影响调用方] → 使用显式 discriminated comparison，并同步 CLI、types、tests 与 promotion consumers。
- [错分区 warning 在多个入口重复] → 在 parser/model diagnostic 边界统一生成，由现有 dedupe 与报告层消费。
- [跨平台路径诊断不一致] → 使用 `path.join`、`path.resolve` 和现有 POSIX-normalization helper，增加 Windows CI 覆盖。
