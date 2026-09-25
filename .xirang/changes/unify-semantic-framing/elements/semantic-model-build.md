---
entity: "element-declaration"
identity: "semantic-model-build"
kind: "element"
parent: "realization-process"
title: "Semantic Model Build"
definition: "Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 按项目配置形成 Candidate hierarchy
Semantic Model Build SHALL 在 Modeling Decision Gate 与首次 Candidate hierarchy 写入前消费 normalized `decomposition`。当选择 `method` 时，Agent SHALL 对默认 semantic-refinement 读取框架随附的完整指导，对其他显式方法使用已明确理解的方法知识；CLI 配置解析仍不解释 opaque 方法名；当选择 `skill` 时，Agent SHALL 调用该逻辑 skill。拆分指导只决定 Element abstraction/refinement 使用的分解坐标系，SHALL NOT 覆盖用户授权、证据权威、Element Contract 或 Relationship 语义。

#### Scenario: 使用 Agent 已知方法
- **WHEN** `decomposition.method` 为当前 Agent 明确理解的 `c4`
- **THEN** Build 使用 Agent 已有的 C4 知识形成 Candidate hierarchy
- **AND** 不从 CLI 请求或编造 C4 方法论 payload

#### Scenario: 方法名无法明确理解
- **WHEN** 当前 Agent 不能明确理解配置的方法名或该方法对当前项目存在多个结构解释
- **THEN** Build 在相关 hierarchy 写入前一次询问用户
- **AND** MUST NOT 猜测相近方法或静默改用 C4

#### Scenario: 调用项目自有拆分 skill
- **WHEN** `decomposition.skill` 配置为一个当前工具可调用的逻辑名称
- **THEN** Build 在结构决策前调用该 skill 并遵循其拆分指导
- **AND** 继续对每个 sibling set 执行单维度、MECE 与 BFS 检查

#### Scenario: skill 不可用时停止结构形成
- **WHEN** 配置的 skill 找不到、调用失败或未返回足以形成结构的指导
- **THEN** Build fail closed 并报告该逻辑名称
- **AND** 不以默认方法继续写入 Candidate hierarchy

#### Scenario: 独立语义审查检查拆分一致性
- **WHEN** Candidate 进入 clean-context semantic review
- **THEN** review 检查 hierarchy 是否一致应用已选择的拆分指导
- **AND** 检查同一 sibling set 未混合不相容的职责、生命周期、部署或实现维度

#### Scenario: 默认方法有可用指导
- **WHEN** 有效配置选择框架默认 semantic-refinement
- **THEN** Build 在形成 hierarchy 前读取已投影的共享指导，以领域语义、单维度、MECE 与 BFS 形成任意深度结构，不猜测未交付的方法内容。

### Requirement: 先初始化再记录构建依据
Semantic Model Build SHALL 在确定 Candidate baseline 并执行 `candidate init` 后，才将授权范围、权威顺序和当前要求写入 `.xirang/candidate/build.md`。 独立的 CLI-managed 已确认设计记录 MAY 在 Candidate 初始化前建立，但不得提前写入尚不存在的 Candidate build.md；它不能绕过后续范围、依据与精确版本确认。

#### Scenario: 开始新的 Build
- **WHEN** 用户已选择 Candidate baseline
- **THEN** Agent 先初始化 Candidate workspace，再写入 build.md

### Requirement: 隔离临时构建依据
`build.md` 等临时 scaffolding SHALL NOT 成为提升后 Semantic Model 的组成。 已确认设计来源快照同样 SHALL 只进入 Build history，不提升为正式模型分区。

#### Scenario: 提升 Candidate
- **WHEN** promotion 成功
- **THEN** `.xirang/model/` 仅包含四个规范分区

## ADDED Requirements

### Requirement: 复用确认记录形成 Candidate
Semantic Model Build MAY 使用统一 Definition Framing 持续澄清与保存已确认设计，每次保存单独授权，实例与 Change 形成记录隔离。存在记录时 SHALL 重载、调和冲突并核对记录到 Candidate 的覆盖，条件、数值、例外、时序必须进入适当 Contract；说明材料进入构建依据或 provenance。无记录时不强制建立记录；本流程 SHALL 保持 Candidate review / digest / promotion，不增加 Design Summary 门禁。

#### Scenario: 记录驱动完整 Candidate
- **WHEN** Build 已有精简记录但还没有完整目标模型
- **THEN** 保持确认条目不被擅自改写，补足完整 Candidate 并逐项核对规范内容的语义去向；记录中没有结构全量草稿不构成阻塞。

#### Scenario: 无记录沿用 Build 门禁
- **WHEN** Build 没有确认记录
- **THEN** 继续原有授权、Candidate 编写、独立审查、用户 digest 确认与提升流程，不生成占位记录或 Design Summary。

#### Scenario: 规范细节遗漏阻止确认
- **WHEN** Candidate 遗漏记录中确认的例外或时序
- **THEN** 补足宿主 Contract 后重新验证与审查，不能以格式校验通过或 build.md 留有说明替代规范覆盖。

### Requirement: 交接记录后确认精确 Candidate
Build SHALL 在来源覆盖复核与适用校验通过后经 framing consume 向 active Candidate 交接精确记录来源，再验证带来源的最终 Candidate 并执行既有独立审查与用户 digest 确认。源或目标变化使受影响覆盖与确认失效；来源快照 SHALL 进入 history 而不进入正式模型。

#### Scenario: 确认最终带来源版本
- **WHEN** 记录已交接至 Candidate
- **THEN** 以含来源快照的最终 digest 执行审查与用户确认，不复用交接前 digest。

#### Scenario: 来源交接失败
- **WHEN** 记录版本漂移、快照冲突或 Candidate 校验失败
- **THEN** 保留源与目标，不继续宣称 Build 可提升。
