---
entity: element-declaration
identity: change-implementation
kind: element
parent: change-realization
title: Change Implementation
definition: Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过独立评估与可复现证据确认项目结果与 Expected Semantic Model 一致；验证通过后，Change 可进入 Change Closure，本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。
---

## Requirements

### Requirement: 实现并独立验证目标状态
Change Implementation SHALL 由 Apply 依据 Expected Semantic Model 修改项目，并由 Verify 使用独立判断与可复现证据确认完整性、正确性和一致性。

#### Scenario: Apply 修改项目
- **WHEN** 项目状态在 Verify 后发生任何修改
- **THEN** 修改后的状态必须重新接受 Review

### Requirement: 不在本阶段更新正式模型
Change Implementation SHALL NOT 将 Semantic Delta 应用于正式 Semantic Model，也 SHALL NOT 关闭 Change。

#### Scenario: Verify 通过
- **WHEN** 最新项目状态通过 Review 且 Optimization 完成
- **THEN** Change 获得进入 Closure 的资格但尚未同步或归档
