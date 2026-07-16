# opsx-delta-artifact Specification

## Purpose

定义 `opsx-delta.yaml` 作为 change-local architecture source delta 的结构、生成、no-op、验证与 reconciliation 合同。

## Requirements

### Requirement: opsx-delta 是正式 Schema artifact

`opsx-delta` SHALL 注册在 `schemas/spec-driven/schema.yaml`，包含 `id`、`generates`、`template`、`instruction`、`requires` 与 file definition。该 artifact SHALL 依赖 `specs`，但 SHALL NOT 进入 `apply.requires`。

#### Scenario: Artifact instructions 可用
- **WHEN** 执行 `openspec instructions opsx-delta --change "<name>" --json`
- **THEN** JSON SHALL 包含 `definition`、`instruction`、`template` 与 `outputPath`
- **AND** dependencies SHALL 包含 `specs`

#### Scenario: 缺少 artifact 不阻塞 apply
- **WHEN** change 缺少 `opsx-delta.yaml`
- **THEN** artifact status SHALL NOT 为 done
- **AND** `applyRequires` 仍只要求 `tasks`

### Requirement: OPSX delta 使用分层 source 与 evidence

Agent SHALL 以 proposal `Architecture Source` 为 scope，以 completed change-local Specs 为 target behavior context，以 `design.md` 为具体 architecture/lowering decisions，以 formal OPSX bundle 为当前 durable architecture state，并以当前代码为 implementation evidence。Proposal Behavior Source 的 Spec ID MUST NOT 被解释为 OPSX capability ID。

#### Scenario: Proposal 只声明 scope
- **WHEN** proposal 声明受影响的 OPSX nodes、ownership、boundaries 或 relation impact
- **THEN** entries SHALL 只定义 architecture impact scope
- **AND** exact target-state node operations 与 canonical relations SHALL 只定义在 `opsx-delta.yaml`

#### Scenario: 代码不覆盖目标 source
- **WHEN** 当前代码与 declared target source 冲突
- **THEN** Agent SHALL 将代码作为当前实现证据
- **AND** MUST NOT 让代码静默覆盖目标 behavior 或 architecture source

### Requirement: Canonical no-op OPSX delta

当 Architecture Source 经确认无变化时，`opsx-delta.yaml` SHALL 只包含 `schema_version: 2`。未解决的 architecture impact MUST NOT 表示为 no-op。

#### Scenario: 无架构变化生成 canonical no-op
- **WHEN** change 不改变 project intent、capability responsibility、domain boundary、ownership 或 semantic relation
- **THEN** delta SHALL 解析为 `{ schema_version: 2 }`
- **AND** SHALL NOT 包含 `ADDED`、`MODIFIED` 或 `REMOVED`

#### Scenario: Behavior change 不自动产生 OPSX operations
- **WHEN** change-local Specs 改变 observable behavior
- **AND** durable architecture facts 保持不变
- **THEN** Agent SHALL 生成 canonical no-op delta
- **AND** MUST NOT 仅从 behavior change 推导 OPSX operations

#### Scenario: 未解决判断不得伪装为 no-op
- **WHEN** target architecture decision 尚未解决
- **THEN** workflow SHALL 解决该 decision 或标记 `[REVIEW NEEDED]`
- **AND** MUST NOT 通过 canonical no-op 宣称 reconciliation 完成

### Requirement: Operation sections 必须非空

`ADDED`、`MODIFIED` 或 `REMOVED` 只要出现，就 SHALL 至少包含一个非空 collection。`domains`、`capabilities` 或 `relations` 只要出现，就 SHALL 至少包含一项。Parser MUST reject legacy empty mappings and arrays，且 MUST NOT 将其转换为 canonical no-op。

#### Scenario: 拒绝空 section
- **WHEN** delta 包含 `ADDED: {}`
- **THEN** `OpsxDeltaSchema` SHALL 拒绝该文件

#### Scenario: 拒绝空 collection
- **WHEN** delta 包含 `MODIFIED.capabilities: []`
- **THEN** `OpsxDeltaSchema` SHALL 拒绝该文件

#### Scenario: 拒绝空修改
- **WHEN** `MODIFIED` node 只包含 `id` 而没有 mutable target-state field
- **THEN** `OpsxDeltaSchema` SHALL 拒绝该 node

#### Scenario: 拒绝实际 operation 旁的空 collection
- **WHEN** `ADDED.capabilities` 包含合法 node
- **AND** 同一 section 包含 `relations: []`
- **THEN** `OpsxDeltaSchema` SHALL 拒绝该文件

### Requirement: OPSX delta 表达目标架构稳态

Real delta SHALL 使用最小 `ADDED`、`MODIFIED`、`REMOVED` reconciliation operations，使其与 formal OPSX bundle 合并后得到目标架构稳态。Node intent、status 与 relations SHALL 使用 durable target-state language，MUST NOT 叙述 change history、源码路径或机械 code evidence。

#### Scenario: MODIFIED intent 是完整目标定义
- **WHEN** change 修改 existing node intent
- **THEN** `MODIFIED` intent SHALL 定义修改后的稳定职责
- **AND** SHALL NOT 使用“本次修改”或“以前/现在”等 change-log prose

#### Scenario: Relation 表达持续架构事实
- **WHEN** delta 增加或修改 relation
- **THEN** relation SHALL 使用 `RelationDefinitionRegistry` 的 canonical token、direction 与 endpoints
- **AND** MUST NOT 仅依据 import/call evidence 机械生成

#### Scenario: 删除 node 保持 graph 完整
- **WHEN** delta 删除被 relations 引用的 node
- **THEN** delta SHALL reconcile 对应 relations，避免 dangling endpoints
- **AND** dry-run semantic validation SHALL 在遗漏时失败

#### Scenario: Delta 不包含 implementation locations
- **WHEN** Agent 编写 real delta
- **THEN** nodes 与 relations SHALL 排除 code paths、symbols、imports、calls、`code_refs` 与 `spec_refs`
- **AND** 无法精确分类的 interaction SHALL 留作 review gap

### Requirement: Template 展示 strict real-delta 结构

`schemas/spec-driven/templates/opsx-delta.yaml` SHALL 由 Registry renderer 确定性生成，作为单个合法 YAML document 展示 real delta 结构与六种 canonical relations。Template SHALL 说明 canonical no-op、禁止空 section/collection，并说明示例不要求所有 operation sections 同时存在。

#### Scenario: Template 与 renderer 一致
- **WHEN** consistency check 重新渲染 template
- **THEN** checked-in template SHALL 与 renderer 输出字节一致

#### Scenario: No-op 不复制 real-delta 示例
- **WHEN** Architecture Source 为 `None`
- **THEN** Agent SHALL 仅写 `schema_version: 2`
- **AND** SHALL NOT 复制 template 中的 operation examples
