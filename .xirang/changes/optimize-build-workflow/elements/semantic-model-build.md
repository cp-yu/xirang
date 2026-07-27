---
entity: element-declaration
identity: semantic-model-build
kind: capability
parent: realization
title: "Semantic Model Build"
summary: "在授权范围和依据下构建或重建完整 Candidate Semantic Model 的过程。"
---

## ADDED Requirements

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
Semantic Model Build SHALL 依次编写 Metamodel、Element Declarations 与 hierarchy、Element Contracts、Relationships、Authored Views，并在每层完成后执行针对该层的 Agent 检查。

#### Scenario: 中间层尚不完整
- **WHEN** required Contracts 尚未在 Declaration 层之后写入
- **THEN** Build 不对故意不完整的中间状态要求完整 candidate validate

### Requirement: 按独立演进边界编写 Requirements
Semantic Model Build SHALL 以规范承诺能否独立新增、修改或移除判断 Requirement 边界，SHALL NOT 按句子、分句、`SHALL` 数量或目标条数机械拆分。

#### Scenario: 动作与结果不可分
- **WHEN** 条件、动作、结果与保证共同构成同一不可独立演进的承诺
- **THEN** Build 将它们保留在一个 Requirement 中

### Requirement: 保留独立整体约束
Element Contract 中只复述 Declaration summary 或 sibling Requirements 语义并集且不增加规范承诺的条目 SHALL NOT 成为 Requirement；独立的不变量、顺序、原子性、一致性或完成条件 SHALL 保留为 Requirement。

#### Scenario: 父级定义跨子能力顺序
- **WHEN** 整体 Element 需要约束多个子行为的顺序
- **THEN** Build 保留该整体 Requirement

### Requirement: 确定性校验后执行独立语义审查
完整 Candidate 通过 `candidate validate` 后，Semantic Model Build SHALL 启动一个新的 read-only clean-context 通用 subagent，要求其自行读取 `build.md`、四分区、权威来源、必要证据与 validation 结果并审查授权完整性和语义正确性。

#### Scenario: Candidate 结构有效
- **WHEN** deterministic validation 没有 ERROR
- **THEN** Build 在向用户呈现 digest 前执行独立 semantic review

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
