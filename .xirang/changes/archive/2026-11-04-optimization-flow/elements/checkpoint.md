---
operation: "MODIFIED"
entity: "element-declaration"
identity: "checkpoint"
kind: "element"
parent: "quality"
title: "Checkpoint"
definition: "Checkpoint 是 Quality 中保留可恢复代码状态并区分恢复依据与最终验证成功状态的机制，独立承载基线、中间状态及最终成功状态的关联。它保存优化前独立审查的原实现，支持按需中间恢复及所需验证通过后的最终成功；不规定逐方向 commit 或以每项 Review 作为唯一推进依据，也不替代验证证据。"
---

## MODIFIED Sections

### Section: Checkpoint 隔离状态

Quality SHALL 在优化修改前保留通过独立 Review 的可恢复基线，保存原实现与恢复位置。Opt MAY 按需要保存中间状态，例如完成一组相对独立优化或即将较大调整时；不强制每方向 Git commit。中间局部测试通过只支持排查恢复，不自动表示最终验证完成。最终状态完成主 Agent 确定的所需验证后 SHALL 保存 successful checkpoint。

优化引入的问题 SHALL 依据实际证据局部修正或撤销并验证，保留其他可靠优化，不因测试或 Review 失败固定整批回滚。合并后无法直接定位时 MAY 拆分、二分或采用更合适方法；各部分单测通过但组合失败时 SHALL 检查组合影响。无法确认局部恢复可靠时 SHALL 恢复到可确认基线；仍无法确认时停止并交回主 Agent，不以未解决状态完成。

恢复 SHALL 保留既有代码、commits/checkpoints、当前质量记录和全部历史，不能用猜测性清理丢弃不明改动或失败原因。最终成功后代码再次变化 SHALL 重新判断受影响验证，旧成功 checkpoint 不证明新状态。
