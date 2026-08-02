---
entity: element-declaration
identity: apply
kind: capability
parent: change-implementation
title: Apply
definition: Apply 是 Change Implementation 中落实项目改动的活动。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态，落实 Change 要求的全部项目改动；在 `tasks.md` 存在时按其中的执行与验证安排推进；在 Verify 返回 Required Corrections 或已确认的优化事项时继续完成相应改动。
---

## Requirements

### Requirement: 以 Expected Semantic Model 为目标
Apply SHALL 以 Expected Semantic Model 为项目目标状态。

#### Scenario: 开始 Change Implementation
- **WHEN** 当前模型与 Delta 可推导 Expected Model
- **THEN** Apply 依据该目标判断实现工作

### Requirement: 落实全部项目改动
Apply SHALL 结合 Change Plan 与当前项目状态落实 Change 要求的全部项目改动。

#### Scenario: Change 含多个影响面
- **WHEN** 实现尚未覆盖全部目标语义
- **THEN** Apply 继续直到完整落实

### Requirement: 遵循现有 Tasks 安排
当 `tasks.md` 存在时，Apply SHALL 按其中的执行与验证安排推进。

#### Scenario: Change 具有任务清单
- **WHEN** Apply 开始执行
- **THEN** 工作按适用任务安排推进

### Requirement: 处理 Required Corrections
Verify 返回 Required Corrections 时，Apply SHALL 完成相应修正。

#### Scenario: Review 未通过
- **WHEN** 当前状态收到阻塞修正项
- **THEN** Apply 修正实现并重新进入 Review

### Requirement: 实现已确认优化事项
Verify 返回已确认优化事项时，Apply SHALL 完成相应实现。

#### Scenario: Optimization 选择事项
- **WHEN** 事项返回 Apply
- **THEN** Apply 实现后重新进入 Review

### Requirement: 产出可独立评估的项目状态
Apply SHALL 产出可交由 Verify 独立评估的项目状态。

#### Scenario: 一轮 Apply 完成
- **WHEN** 当前修改已完成
- **THEN** 项目状态可供 clean-context Review

### Requirement: 提供可复现证据
Apply SHALL 为当前项目状态提供可复现证据。

#### Scenario: 状态交给 Verify
- **WHEN** Apply 声明当前实现可评估
- **THEN** Verify 可取得证明目标行为的证据
