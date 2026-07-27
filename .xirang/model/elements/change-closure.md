---
entity: element-declaration
identity: change-closure
kind: capability
parent: change-realization
title: "Change Closure"
summary: "将已验证 Change 同步进正式模型并归档为新稳定状态的阶段。"
---

## Requirements

### Requirement: 仅接受有效验证结果
Change Closure SHALL 以仍然有效的 Change Implementation 验证结果为入口，SHALL NOT 基于未验证或已过期的项目状态同步或归档。

#### Scenario: 验证结果不再有效
- **WHEN** Closure 无法确认当前项目状态仍由该验证结果覆盖
- **THEN** Closure 拒绝推进并要求重新验证

### Requirement: 先同步后归档
Closure SHALL 先通过 CLI Sync 将 Semantic Delta 原子应用于 Semantic Model，使 Expected Semantic Model 成为新正式模型；再由 Archive 保存已完成 Change 与最终证据并结束活动状态。

#### Scenario: 完成 Change Closure
- **WHEN** Sync 与 Archive 均成功
- **THEN** 项目实现和 Semantic Model 进入一致的新稳定状态
