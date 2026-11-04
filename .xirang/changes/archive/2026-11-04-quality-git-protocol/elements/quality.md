---
operation: MODIFIED
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中以 commit 绑定的 Review 意见、可选 Opt 意见与 Seal 声明协调项目实现判断并控制进入 Change Closure 的阶段。它确保每个 Change 具有通过的独立基线 Review、明确的 Opt 处置及主 Agent 对 Seal commit 的声明；Review 负责独立判断，Optimization 负责保持目标语义的改进，CLI 负责意见关联和记录门禁，不负责代码恢复或当前工作区新鲜度判定。
---

## MODIFIED Sections

### Section: Review 通过后建立 Baseline
Quality SHALL 要求每个 Change 在可 Seal 前至少具有一条通过的独立基线 Review。Review opinion SHALL 绑定已提交且在审查期间保持不变的 Git commit；失败 Review 的修正 SHALL 形成不同的 Git commit，并在该 commit 上重新 Review，直至基线 Review 通过。通过的基线 Review 是 Opt 与 Seal 的必要前置条件；Quality 不为该 commit 创建或保存代码恢复状态。

### Section: 保留失败方向与优化历史
Quality SHALL 在唯一质量 JSON 中保留 Review opinion 历史及 Opt opinions，包含已放弃方向、原因和处理结果，以供主 Agent 后续判断并避免重复尝试。该记录保存意见，不保存代码快照、测试输出或恢复事件；Git 承载代码修改和恢复历史。

### Section: 收口后确认可进入 Change Closure
Quality SHALL 仅在基线 Review 已通过、Seal 前已有明确 Opt 处置、且主 Agent 已记录有效 Seal 声明时允许 Change 进入 Change Closure。已执行 Opt 的处置 SHALL 包含 opinion 及 `baseCommit`、`resultCommit`；未执行 Opt 的处置 SHALL 包含简短理由。Seal 声明 SHALL 绑定一个 Git commit，并由主 Agent 声明该版本可运行且预期通过适用测试。CLI 不执行测试、不保存测试输出、不要求工作区 clean、不要求 Seal commit 等于 HEAD 或工作区内容，也不要求在 Seal 或 Archive 前单独提交 Quality JSON。Archive 的 Quality 门禁只确认 Seal commit 对象仍存在。

### Section: 按阶段与证据缺口推进
Quality SHALL 按基线 Review、主 Agent 决定的可选 Opt、Opt 处置和 Seal 顺序推进。Review findings 与 Required Corrections 交由主 Agent 判断和处理；Quality SHALL NOT 自动修改 `tasks.md`。没有 Seal 时不得进入 Change Closure；Opt 后是否追加 Review 由主 Agent 按实际风险决定，不由 CLI 推断或要求。

## REMOVED Sections

- 成功优化推进 Checkpoint
- 失败优化恢复 Checkpoint
- 仅以最新成功状态完成
- 活动 Change 的显式重新验证

## ADDED Sections

### Section: 单一 Quality Record 承载意见与 Seal
Quality SHALL 仅将 Review opinions、Opt opinions 或明确不做 Opt 的处置及当前 Seal 声明持久化在每个 Change 的一个 Git-tracked JSON 文档中。代码状态、执行过程、测试输出与恢复状态不复制进该文档；CLI 对更新执行原子写入与 revision compare-and-swap。
