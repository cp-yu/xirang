---
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中确认并改进项目实现质量的环节，独立承载基线独立审查、受托优化与基于风险的最终验证之间的协调。它包含进入条件、恢复状态、证据关联、最终成功状态及进入 Closure 的条件；Review 负责独立正确性判断，Optimization 负责在语义不变前提下改进实现。它不承担普通 Apply 的任务实现，也不执行模型同步或归档。
---

## Specification

### Section: Review 通过后建立 Baseline

首次独立 Review 通过后，Quality SHALL 在优化修改前保留可恢复的基线，并关联被审查状态和恢复位置。基线保留原实现，不能以历史无关 PASS 替代。

### Section: 成功优化推进 Checkpoint

最终状态完成主 Agent 判断所需的全部验证且证据仍适用时，Quality SHALL 保存最终 successful checkpoint。优化中的中间状态按恢复需要保存；局部测试通过不自动构成最终成功，也不要求每个方向 commit 或 Review。

### Section: 失败优化恢复 Checkpoint

优化引入的问题 SHALL 依据实际证据局部修正或撤销并验证，保留其他可靠优化，不因测试或 Review 失败固定整批回滚。合并后无法直接定位时 MAY 拆分、二分或采用更合适方法；各部分单测通过但组合失败时 SHALL 检查组合影响。无法确认局部恢复可靠时 SHALL 恢复到可确认基线；仍无法确认时停止并交回主 Agent，不以未解决状态完成。

### Section: 保留失败方向与优化历史

Quality SHALL 保留已尝试但放弃的优化事项、原因、处理结果、实际测试证据及历史，在放弃时保存并在最终交付告知用户。失败尝试与保留的有效结果分开，不因一项可选优化未成功阻塞正确且满足验证要求的 Change。

### Section: 仅以最新成功状态完成

优化前实现 SHALL 先通过独立 Review。主 Agent SHALL 根据累计优化改动、行为保持依据与测试覆盖确定最终验证范围并简短说明理由；测试必需，全量测试和优化后增量 Review 按实际风险决定，不增加固定风险审批。已确认的当前 Change 基线正确性缺陷 SHALL 修复并通过针对问题及其影响的独立 Review。只有所需验证全部完成且通过、证据对应当前状态、交付完整且无未解决的正确性或恢复问题时，才可保存最终 successful checkpoint 并完成。基线 Review 不证明后续改动经过独立审查；无需追加 Review 的判断不记为 Reviewer PASS。后续代码变化 SHALL 重新判断受影响的验证。

### Section: 收口后确认可进入 Change Closure

Quality SHALL 关联基线独立 Review、每次优化委托及完整实际交付（或配置禁用/用户拒绝的明确跳过）、主 Agent 最终验证结论、当前所需验证结果及最终 successful checkpoint，只有这些完成条件成立时才允许进入 Change Closure。未交付中断、失败或过期验证、未解决基线缺陷及恢复不确定均阻塞。CLI 只检查声明条件与关联，不判断自然语言充分性。

### Section: 活动 Change 的显式重新验证

用户明确要求活动 Change 从头重新验证时，Quality SHALL 在原流程已停止、无旧执行者或待处理写入与恢复后，在同一 Change 保留原代码、commits/checkpoints、旧记录和失败原因，并建立新的验证依据。新基线 SHALL 由 fresh-context Reviewer 重新审查，旧 PASS 只作历史参考；不修改历史冒充新结果。普通修正、局部撤销和中断续跑 SHALL 继续原委托，不自动变为从头重验。

- **同代码重审**：用户因旧证据不可信要求从头 Review/Optimization，即使代码相同也取得新的独立 Review，保留旧历史。
- **旧执行者未结束**：Reviewer 或 Opt 仍在运行时，不开启并行重验或更换写入者。
- **旧格式记录**：不支持的旧记录给出诊断并原样保留，如何继续由主 Agent 与用户判断，不自动转换成新完成结论。

### Section: 按阶段与证据缺口推进

Quality SHALL 先完成普通实现的独立 Review，再进入委托式 Optimization。优化开始后，不以每次代码变化强制回到整条 Review 流程；主 Agent 可读取实际代码与证据，按累计改动判断后续委托和最终验证，必要时追加独立 Review。已知候选处理完且结果交付后可收尾，无需再次调用 Opt 证明不存在更多机会。
