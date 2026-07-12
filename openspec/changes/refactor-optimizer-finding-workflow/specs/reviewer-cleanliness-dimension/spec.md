## MODIFIED Requirements

### Requirement: Cleanliness 与 Optimizer 的职责边界

Reviewer Phase 1 SHALL 判断本次 change 声称的工作是否完整、正确和清洁；optimizer Phase 2 SHALL 只判断已经正确的实现是否存在有实际收益、静态可证明且行为保持的改进。

本次 change 引入的孤儿代码、半迁移、死 import、过时 TODO、规格外行为改动或其他 completeness/correctness 缺陷 SHALL 由 reviewer 报告并阻塞 Phase 2。正确实现中的结构、算法、数据结构、I/O、分配、资源或维护成本机会 MAY 由 optimizer 形成 finding。

Optimizer 发现 correctness、spec 或 artifact 冲突时 SHALL 返回 `blockingObservations`，不得将缺陷包装为 optimization finding。Speculative reviewer SHALL 验证 selected finding 的 preservation constraints，但不得重判优化价值。

#### Scenario: [ADDED] 本次变更遗留物由 reviewer 阻塞
- **WHEN** 本次 diff 的重构任务保留了应删除的旧 API
- **THEN** reviewer SHALL 报告 completeness/cleanliness issue
- **AND** optimizer SHALL NOT 将其作为非阻塞优化建议

#### Scenario: [ADDED] 正确实现中的算法机会由 optimizer 判断
- **WHEN** Phase 1 已通过
- **AND** 当前实现正确但存在静态可证明的复杂度改进
- **THEN** optimizer MAY 生成 finding
- **AND** reviewer SHALL 在实现后验证 preservation constraints

#### Scenario: [ADDED] optimizer 发现 spec 冲突
- **WHEN** optimizer 读取代码时发现实现违反 requirement
- **THEN** SHALL 返回 blockingObservations
- **AND** 系统 SHALL 路由回 Phase 1 remediation

#### Scenario: [REMOVED] 本次变更引入的孤儿代码由 Reviewer 检测

- **WHEN** 本次 diff 包含重构任务
- **AND** 旧代码在本次变更范围内但未清理
- **THEN** Reviewer SHALL 将其判定为 CRITICAL
- **AND** SHALL block 归档直到清理或显式豁免

#### Scenario: [REMOVED] 历史遗留的死代码由 Optimizer 检测

- **WHEN** 代码库中存在 unused exports
- **AND** 这些 exports 不在本次 git diff 范围内
- **THEN** Reviewer SHALL NOT 检测这些历史债务
- **AND** Optimizer Phase 2 MAY 提出优化建议
- **AND** 历史债务 SHALL NOT block 归档
