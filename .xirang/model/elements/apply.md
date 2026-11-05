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

当 `tasks.md` 存在时，Apply SHALL 以其中与用户对齐的目标和验证方向推进，遵守用户明确要求的先后次序；对未指定顺序的目标 SHALL 根据当前代码与测试现状安排实施顺序、文件、测试动作、层级、命令和具体操作。Apply SHALL 不以这些现场判断修改已确认的目标语义或业务时序。

- **Change 具有目标任务**
  - Apply 开始执行
  - 先读取目标 Contract 与 Plan，再确定实际实施与验证方法

- **用户指定目标顺序**
  - 任务排列及 Plan 明确目标 A 须先于 B
  - Apply SHALL 在 A 完成后推进 B

### Section: 处理 Required Corrections

Verify 返回普通实现的 Required Corrections 时，主 Agent SHALL 判断并完成相应修正，按需更新 `tasks.md`，将修正形成新的 Git commit，并针对该 commit 重新执行 Change 级 Review。Opt 中的问题由 Opt 或主 Agent 依据实际证据修正或撤销；基线漏掉的当前 Change 缺陷由主 Agent 安排修复并追加针对性独立 Review。Reviewer 和 Quality CLI SHALL NOT 自动修改任务文件。

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

普通实现完成并通过独立 Review 后，主 Agent MAY 选择委托 Optimization。Opt 在委托范围内自主分组、修改与局部测试，交付关联 `baseCommit`/`resultCommit` 的 opinion；主 Agent 决定是否继续、是否追加 Review 以及 Seal 的最终声明。优化修改不自动重复普通 Apply 任务循环或每项 Change 级 Review。代码历史与恢复由 Git 承载，Quality SHALL NOT 创建代码 checkpoint。
