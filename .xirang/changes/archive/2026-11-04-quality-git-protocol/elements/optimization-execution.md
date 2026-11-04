---
operation: MODIFIED
entity: element-declaration
identity: optimization-execution
kind: element
parent: quality
title: Optimization Execution
definition: Optimization Execution 是 Quality 中通过可选 Opt 委托与 commit-bound opinion 推进优化的执行协议，独立承载基线、实施、Git-based recovery 与主 Agent Seal 判断的衔接。它允许 Opt 自主组合实施与局部测试；Quality 不持久化执行进度或代码 checkpoint，报告内容由 Optimizer Findings 定义，意见关联由 Quality CLI Gate 定义。
---

## MODIFIED Sections

### Section: 最优性检验执行
通过独立基线 Review 后，主 Agent SHALL 决定是否委托 fresh-context Opt。Opt 存在时，主 Agent 在实现前确定范围与约束；Opt 可在一次委托内分组、合并、连续修改与局部验证，且 SHALL 在交付意见时绑定 `baseCommit` 与 `resultCommit`。对应测试缺失时须在改实现前补充。主 Agent 决定不执行 Opt 时，Seal 前 SHALL 记录明确理由，不伪造交付。

### Section: 模型判断继续与停止
Opt 与主 Agent SHALL 按收益、成本、风险、实际进展及明确委托约束判断继续、放弃或停止，无固定方向数量、失败次数或收益分级门槛。没有新证据或实质进展的重复尝试 SHALL 停止；已完成或放弃的尝试及处理结果在交付时写入 Opt opinion。是否继续 Opt 由主 Agent 决定，CLI 不选择下一项工作。

### Section: 主 Agent 决定最终验证
通过基线 Review 后，主 Agent SHALL 可选择进行 Opt 并决定是否追加 Opt 后 Review。Opt 局部测试用于实施判断，但 Quality CLI 不执行测试、不接收测试输出作为状态证据。主 Agent SHALL 通过 Seal 为指定 Git commit 声明 `canRun` 与 `testsExpectedToPass`，并提供适用测试范围及 assessment；Seal 只记录该判断。只有基线 Review 通过、Opt 已执行并交付 opinion 或明确记录不做 Opt、且 Seal 绑定的 commit 对象存在时，Quality 才能完成。无需追加 Review 的判断不得伪装成 Reviewer PASS。

## REMOVED Sections

- Checkpoint 与回滚
- 优化结果持久化
- 核对现场继续原委托

## ADDED Sections

### Section: Git 管理优化代码状态与恢复
代码修改、提交历史与恢复 SHALL 由 Git 承载，Quality 不保存 baseline/intermediate/successful checkpoint、代码 manifest 或恢复位置。Opt MAY 按恢复需要提交代码，不要求每个方向 commit。失败优化 SHALL 依据 Git 中的实际代码状态局部修正或撤销并验证，保留可靠工作；合并问题无法定位时 MAY 拆分或使用更合适方法。恢复无法确认时停止并交回主 Agent，不以未解决状态完成。

### Section: 仅持久化已交付意见
Quality SHALL 只持久化 Review opinions、Opt opinions/明确不做 Opt 的处置及当前 Seal，不保存 Opt 开始、进度、暂停、恢复或完整测试输出。Opt opinion SHALL 在完成交付时写入，并关联起始与结果 commit；被中断且未交付的 Opt 不视为已完成 opinion。后续恢复依据 Git history 与工作区状态，由主 Agent 负责编排。

### Section: 中断后依据 Git 继续
Opt 中断后，主 Agent SHALL 先确认旧写入者及 pending writes 已停止，再检查 Git history、工作区差异和现存文件；不得将未交付状态推断为完整 Opt opinion。记录与磁盘存在差异时，依据 Git 证据检查、继续、修正或撤销，保留可信工作；归属或恢复可靠性不明时停止并交回主 Agent。
