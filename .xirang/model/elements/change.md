---
entity: element-declaration
identity: change
kind: domain
parent: project.root
title: "Change"
definition: "承载一次项目演进意图的 Semantic Delta 与辅助 Change Plan。"
---

## Requirements

### Requirement: 由 Delta 与 Plan 共同组成
每个 Change SHALL 包含规范性的 Semantic Delta 与解释意图和路径的 Change Plan；Semantic Delta SHALL 与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

#### Scenario: 编译 Change
- **WHEN** Agent 或 CLI 评估一个活动 Change
- **THEN** 系统从当前模型和 Semantic Delta 推导唯一目标状态，并用 Change Plan 辅助执行

### Requirement: 以 Delta 为规范依据
当 Change Plan 与 Semantic Delta 冲突时，系统 SHALL 以 Semantic Delta 为目标语义依据。

#### Scenario: Plan 与 Delta 不一致
- **WHEN** Change Plan 描述的目标与 Semantic Delta 不同
- **THEN** Agent 与 CLI 以 Semantic Delta 为目标语义且不使用 Plan 覆盖 Delta
