## ADDED Requirements

### Requirement: OPSX delta expresses target architecture steady state

`opsx-delta.yaml` SHALL 使用最小 `ADDED`、`MODIFIED`、`REMOVED` reconciliation operations，使其与 formal OPSX bundle 合并后得到目标架构稳态。Node intent、status 与 relations SHALL 使用 durable target-state language，MUST NOT 叙述本次如何变化、实现历史、源码路径或机械 code evidence。

#### Scenario: MODIFIED intent 是最终稳定定义
- **WHEN** change 修改 existing capability intent
- **THEN** `MODIFIED.capabilities[]` 的 `intent` SHALL 直接定义 change 后该 capability 的稳定职责
- **AND** SHALL NOT 使用“本次修改”“以前/现在”等 change-log prose

#### Scenario: Relation 表达目标架构事实
- **WHEN** change-local delta 增加或修改 relation
- **THEN** relation SHALL 使用 `RelationDefinitionRegistry` 的 canonical token、direction 与 endpoints
- **AND** SHALL 表达目标架构中持续成立的 semantic fact
- **AND** MUST NOT 仅依据 import/call evidence 机械生成

#### Scenario: Node 删除同时保持 graph 完整
- **WHEN** delta 删除会被现有 relations 引用的 node
- **THEN** delta SHALL 包含使目标 graph 不产生 dangling endpoints 所需的 relation reconciliation
- **AND** dry-run semantic validation SHALL 在遗漏时失败

#### Scenario: Delta 不包含 code-map 数据
- **WHEN** Agent 编写 `opsx-delta.yaml`
- **THEN** nodes 与 relations SHALL 排除 code paths、symbols、imports、calls 与 code-map fields
- **AND** 无法精确分类的 interaction SHALL 留作 review gap 而非创建通用 relation
