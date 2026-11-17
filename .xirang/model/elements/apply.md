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

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

优化修改不自动重复普通 Apply 任务循环；代码历史和恢复由 Git 承载，Quality SHALL NOT 创建代码 checkpoint。

### Section: 实现取舍与维护质量

Apply SHALL 选择使职责与控制流清晰、使修改集中于相关位置的抽象与代码组织，避免增加对当前实现没有具体收益的结构。合理的提取、增加、合并或删除抽象均可；不以文件、函数、层数或代码行数直接判断优劣，也不为假想未来扩展增加结构。

生成的实现纪律 SHALL 保留既有删除、标准库、平台与直接表达等偏好，并采用：Choose abstractions and code organization that make responsibilities and control flow clear and changes easier to localize. Avoid added structure without a concrete benefit to the current implementation.
