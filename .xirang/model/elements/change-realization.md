---
entity: element-declaration
identity: change-realization
kind: domain
parent: realization-process
title: Change Realization
summary: 将单次 Change 从形成、实现与验证推进到收束的新稳定状态。
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
