---
entity: element-declaration
identity: reviewer-cleanliness
kind: element
parent: review
title: Reviewer Cleanliness
definition: Reviewer Cleanliness 定义 Review 的 Cleanliness 验证维度：检测"本次变更应清理但未清理"的遗留物、工具无关的检测策略、Cleanliness summary schema、与 Optimizer 的职责边界，以及规格外改动检测与归因。
---
## MODIFIED Requirements

### Requirement: Cleanliness 与 Optimizer 的职责边界

Review SHALL 判断本次 change 声称的工作是否完整、正确和清洁；Optimization SHALL 只判断已经正确的实现是否存在有实际收益、静态可证明且行为保持的改进。本次变更引入的遗留物 SHALL 由 reviewer 报告并阻塞 Optimization；optimizer 发现正确性冲突时 SHALL 返回阻塞观察。

#### Scenario: 本次变更遗留物由 reviewer 阻塞
- **WHEN** 本次 diff 的重构任务保留了应删除的旧 API
- **THEN** reviewer SHALL 报告 completeness/cleanliness issue
- **AND** optimizer SHALL NOT 将其作为非阻塞优化建议

#### Scenario: optimizer 发现 spec 冲突
- **WHEN** optimizer 读取代码时发现实现违反 requirement
- **THEN** SHALL 返回阻塞观察
- **AND** 系统 SHALL 路由回 Required Corrections

#### Scenario: 正确实现中的算法机会由 optimizer 判断
- **WHEN** 当前代码已通过 Review
- **AND** 当前实现正确但存在静态可证明的复杂度改进
- **THEN** optimizer MAY 生成方向
- **AND** reviewer SHALL 在该轮实现后验证 preservation constraints
