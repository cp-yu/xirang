---
entity: element-declaration
identity: semantic-model-build
kind: element
parent: realization-process
title: Semantic Model Build
definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
---

## MODIFIED Requirements

### Requirement: 产出完整 Candidate

Semantic Model Build SHALL 产出一个完整四分区 Candidate Semantic Model。Authored Views 不是完成条件：`views/` 分区 SHALL 作为真实目录存在，SHALL NOT 要求包含任何 Authored View 单元。

#### Scenario: Candidate 可供审查

- **WHEN** 模型编写完成
- **THEN** Candidate 联合包含 Metamodel、Elements 与 Relationships
- **AND** `views/` 分区作为真实目录存在
- **AND** SHALL NOT 因缺少 Authored View 单元而拒绝审查

#### Scenario: Candidate 按四分区编写

- **WHEN** Agent 已解决所需的 semantic decisions
- **THEN** SHALL 编写 `.xirang/candidate/{metamodel,elements,relationships,views}/`，使其共同组成一个 Candidate
- **AND** `views/` MAY 不含任何 Authored View 单元
- **AND** 每个 `elements/<identity>.md` 单元 SHALL 同时承载一个 Element Declaration 与至多一个 Element Contract（正文 Requirements）
- **AND** SHALL NOT 创建 `candidate/architecture`、`candidate/contracts` 或其他平行 Contract store

#### Scenario: Required element 需要 contract

- **WHEN** Agent 编写 `contract: required` 的 element kind
- **THEN** 每个 required element SHALL 在其自身 `elements/` 单元正文中携带 Contract（至少一个 Requirement）
- **AND** Agent SHALL 将缺失 Contract 视为 decision gap，不得创建 catch-all owner 或独立 Spec 单元

### Requirement: 在编写前通过 Modeling Decision Gate

Semantic Model Build SHALL 在探索授权证据后、首次编写 Candidate 前解决所有会改变规范性目标模型的未决选择，并按权威冲突、Element identity 与边界、hierarchy、Metamodel、Contracts、Relationships 的依赖顺序推进。未决 Authored View 选择 SHALL NOT 阻塞 Candidate 编写。

#### Scenario: 多个目标模型符合现有依据

- **WHEN** 一个未决选择会改变稳定 identity、层级、契约、Kind 或 Relationship
- **THEN** Agent 提供受限选项并一次请求一个用户裁决

#### Scenario: 未决 View 选择不阻塞编写

- **WHEN** 一个未决选择只会改变 Authored View
- **THEN** Build 不因该选择停止编写 Metamodel、Elements 或 Relationships

### Requirement: 按 BFS 语义层编写 Candidate

Semantic Model Build SHALL 依次编写 Metamodel、Element Declarations 与 hierarchy、Element Contracts、Relationships；每个 Declaration SHALL 在对应 Contract 之前完成完整 Definition，并在每层完成后执行针对该层的 Agent 检查。Authored Views SHALL NOT 作为必写完成层。

#### Scenario: 中间层尚不完整

- **WHEN** required Contracts 尚未在 Declaration 层之后写入
- **THEN** Build 不对故意不完整的中间状态要求完整 candidate validate

#### Scenario: 跳过 Authored Views

- **WHEN** Metamodel、Elements、Contracts 与 Relationships 已编写且 `candidate validate` 无 ERROR
- **THEN** Build MAY 进入审查与 promotion
- **AND** SHALL NOT 因未编写 Authored Views 而要求继续编写

### Requirement: 确定性校验后执行独立语义审查

完整 Candidate 通过 `candidate validate` 后，Semantic Model Build SHALL 启动一个新的 read-only clean-context 通用 subagent，要求其自行读取 `build.md`、四分区、权威来源、必要证据与 validation 结果并审查授权完整性和语义正确性。审查 SHALL NOT 将缺少 Authored View 单元或未保留正式 Authored View 视为完整性失败。

#### Scenario: Candidate 结构有效

- **WHEN** deterministic validation 没有 ERROR
- **THEN** Build 在向用户呈现 digest 前执行独立 semantic review

#### Scenario: 可选 subagent 加速探索

- **WHEN** 并行探索有助于 Agent 理解用户批准的项目范围
- **THEN** Agent MAY 使用 task-specific prompts 调用 subagents
- **AND** Candidate validation 与 promotion SHALL NOT 依赖 subagent availability 或固定 subagent role

#### Scenario: 无 Authored View 不构成审查失败

- **WHEN** Candidate `views/` 为空或与正式模型 views 不同
- **THEN** semantic review SHALL NOT 仅因此返回 FAIL

### Requirement: 只以阻塞语义问题拒绝审查

Candidate semantic review SHALL 只以 `BLOCKER` 或 `HIGH` findings 判定 FAIL，SHALL NOT 将措辞偏好或非阻塞样式意见送入修正循环，SHALL NOT 将缺少 Authored View 单元或未保留正式 Authored View 单独判为 `BLOCKER` 或 `HIGH`。

#### Scenario: Review 只有样式意见

- **WHEN** Subagent 未发现授权、完整性或语义正确性问题
- **THEN** Semantic review 返回 PASS

#### Scenario: 正式 view 未保留

- **WHEN** Subagent 发现正式 Authored View 未出现在 Candidate
- **THEN** 该发现 SHALL NOT 单独构成 BLOCKER 或 HIGH
