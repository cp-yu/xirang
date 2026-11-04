---
entity: element-declaration
identity: apply
kind: element
parent: change-implementation
title: Apply
definition: Apply 是 Change Implementation 中落实 Change 项目改动的活动，独立承载按 Expected Semantic Model、Change Plan 与当前状态实施普通项目工作及处理相应修正。存在 tasks.md 时按执行与验证安排推进，并将结果交给 Verify；优化阶段集成受托 Opt 的实施与主 Agent 的最终验证编排，不承担逐方向选择协议或模型同步归档。
---

## Specification

### Section: 以 Expected Semantic Model 为目标

Apply SHALL 以 Expected Semantic Model 为项目目标状态。

- **开始 Change Implementation**
  - 当前模型与 Delta 可推导 Expected Model
  - Apply 依据该目标判断实现工作

### Section: 落实全部项目改动

Apply SHALL 结合 Change Plan 与当前项目状态落实 Change 要求的全部项目改动。

- **Change 含多个影响面**
  - 实现尚未覆盖全部目标语义
  - Apply 继续直到完整落实

### Section: 遵循现有 Tasks 安排

当 `tasks.md` 存在时，Apply SHALL 按其中的执行与验证安排推进。

- **Change 具有任务清单**
  - Apply 开始执行
  - 工作按适用任务安排推进

### Section: 处理 Required Corrections

Verify 返回普通实现的 Required Corrections 时，Apply SHALL 完成相应修正并重新进入 Change 级 Review。优化中的问题按优化协议分流：局部优化回归由 Opt 修正或撤销；基线漏掉的当前 Change 缺陷由主 Agent 安排修复并追加针对性独立 Review。

### Section: 产出可独立评估的项目状态

Apply SHALL 产出可交由 Verify 独立评估的项目状态。

- **一轮 Apply 完成**
  - 当前修改已完成
  - 项目状态可供 clean-context Review

### Section: 提供可复现证据

Apply SHALL 为当前项目状态提供可复现证据。

- **状态交给 Verify**
  - Apply 声明当前实现可评估
  - Verify 可取得证明目标行为的证据

### Section: 集成受托优化执行

Apply SHALL 在普通实现完成并通过独立 Review 后集成 Optimization。Opt 在委托范围内自主分组、修改与局部测试，主 Agent 负责范围、后续投入和基于累计改动的最终验证。优化修改不自动重复普通 Apply 任务循环或每项 Change 级 Review；最终所需验证通过后形成成功 checkpoint。
