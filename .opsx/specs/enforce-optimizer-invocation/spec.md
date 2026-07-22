---
element: project.root/domain.verify/cap.verify.optimization-gate
---

# enforce-optimizer-invocation Specification

## Purpose
Define the reviewed Finding-Driven Optimization Gate contract for CLI 拒绝无证据的 NO_OPTIMIZATION_NEEDED; Prompt fragment 强制委托 optimizer subagent; Apply 编排文本明确角色分离.

## Requirements
### Requirement: CLI 拒绝无证据的 NO_OPTIMIZATION_NEEDED

CLI SHALL 拒绝缺少合法 optimizer reconciliation envelope 的 `NO_OPTIMIZATION_NEEDED`。非空 summary 不再单独证明 optimizer 已被调用；envelope MUST 对全部非终态 findings 作出裁决，且不存在 actionable finding。

#### Scenario: 合法 reconciliation 被接受
- **WHEN** input 包含结构合法的 optimizer envelope
- **AND** 不存在 actionable finding
- **THEN** CLI SHALL 接受该结果
- **AND** SHALL 持久化 reconciliation history

#### Scenario: 只有 summary 时拒绝
- **WHEN** input 只包含 `NO_OPTIMIZATION_NEEDED` 与非空 summary
- **THEN** CLI SHALL 返回 `{ ok: false, reason: "OPTIMIZER_REQUIRED" }`
- **AND** 以 exit 1 退出

### Requirement: Prompt fragment 强制委托 optimizer subagent

`VERIFY_SIMPLE_CHANGE_FAST_PATH` 常量 SHALL 保持名称和引用兼容，但文本 SHALL 要求每个未跳过的 Phase 2 至少 spawn optimizer 一次，由 optimizer 提交 reconciliation envelope 并判断 actionable findings。Master MUST NOT 自行声明 NOT_NEEDED。

#### Scenario: 简单变更也调用 optimizer
- **WHEN** 变更仅删除、重命名或移除参数
- **AND** optimization 未被禁用或跳过
- **THEN** prompt SHALL 要求 spawn optimizer
- **AND** SHALL 仅在合法 envelope 无 actionable finding 时记录 NOT_NEEDED

### Requirement: Apply 编排文本明确角色分离

Apply Phase 2 文本 SHALL 将 master 描述为 evidence collector、TDD implementer 和 context challenger；将 optimizer 描述为 optimization judge 与 key design author；将 reviewer 描述为 speculative behavior judge。

#### Scenario: Phase 2 编排角色明确
- **WHEN** apply skill 模板被渲染
- **THEN** SHALL 要求 optimizer 先判断和排序 findings
- **AND** master SHALL 只实现 selected finding或提交 masterChallenge
- **AND** fresh reviewer SHALL 独立验证实现
