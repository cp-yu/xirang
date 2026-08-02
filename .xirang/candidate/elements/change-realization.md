---
entity: element-declaration
identity: change-realization
kind: domain
parent: realization
title: Change Realization
definition: Change Realization 是 Realization 推进过程中落实单次 Change 的过程。它通过 Change Formation 形成完整 Change，通过 Change Implementation 实现并验证，再通过 Change Closure 将经验证的 Semantic Delta 更新到 Semantic Model 并关闭 Change，使项目实现与语义模型进入新的稳定状态。
---

## Requirements

### Requirement: 按形成、实现、收束推进

Change Realization SHALL 先完成 Change Formation，再通过 Change Implementation 落实并验证，最后仅以有效验证结果进入 Change Closure。

#### Scenario: 推进一个 Change

- **WHEN** 用户授权新的演进意图
- **THEN** Change 依次形成、实现并验证、同步和归档

### Requirement: 保持实现与模型一致

Change Closure 完成后，项目实现与同步后的 Semantic Model SHALL 共同进入表达同一用户意图的新稳定状态。

#### Scenario: Change 完成

- **WHEN** Change 被成功关闭
- **THEN** 正式模型表达已验证实现所落实的目标语义
