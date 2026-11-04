---
entity: element-declaration
identity: agent-prompt-guidance
kind: element
parent: agent-workbench-projection
title: Agent Prompt Guidance
definition: Agent Prompt Guidance 是 Apply、Quality 与 Archive 共用的质量协议呈现，独立承载委托、证据、完成条件及恢复诊断的共享指引，并提供可选失败定位方法。它从实现协议投影机械信息，不维护重复 schema，不将模型的优化取舍固化为逐方向状态机。
---

## Specification

### Section: 简单变更快速路径识别

Optimization 启用且用户未明确拒绝时，提示词 SHALL 委托 Opt 进行初次优化，即使是纯删除或重命名也不由主 Agent 虚构无优化结论。Opt 可以交付无保留改动及依据；交付后主 Agent 判断是否继续，不强制再启动 fresh Opt 或证明全部机会耗尽。配置禁用/用户拒绝时明确记录跳过。

### Section: 共享 quality gate 指引片段

系统 SHALL 从同一实现协议源向 Apply/Archive 生成委托、交付、测试捕获、独立 Review、主 Agent 结论、status/seal 指引，提供最小合法输入和确定性失败语义，不保留并行方向队列协议。阶段指引表达必需保障而非将每种情境固定为审批链或执行算法。

### Section: Archive 模板未收口恢复路径

Archive SHALL 对未完成优化给出可执行恢复指引，复用共享委托与恢复协议；缺基线、未交付、过期验证和恢复不确定分别处理。优化中断后 SHALL 在主 Agent 确认旧写入者已停止后核对原委托、最近进度与磁盘差异，默认继续同一委托；意外中断可能没有最终保存。记录 A 已完成而磁盘有半成品 B 时，检查 B 和相互影响后继续、修正或撤销，不直接判 B 完成或自动丢弃 A/B。未记录、未验证或过期证据需补查；归属或恢复可靠性不明时停止并交回主 Agent。只有主 Agent 主动开始新探索才建新委托。 可修复问题不固定永久锁定；恢复仍无法确认时停止完成。

### Section: Quality 模板 CLI 错误恢复指南

提示词 SHALL 根据 CLI code、diagnostics、allowedNextOperations 修正输入或补齐真实证据，不伪造输入、删除历史或把测试失败输出改为成功。记录缺失不得推断通过，baseCommit 无效不得猜测；不支持的旧质量格式、旧命令输入和退役优化配置 SHALL 给出明确诊断，不静默解释、自动迁移或启用兼容执行路径。旧活动记录不自动转换为新完成结论；既有代码、commits/checkpoints、归档和历史记录 SHALL 保留，由主 Agent 与用户判断旧 Change 如何继续。

### Section: 提供可选失败诊断 reference

系统 SHALL 提供新的共享优化失败诊断 reference，供实际排查参考。局部测试原因明确可修正重验；最终测试/Review 定位某项改动时可修正或撤销并保留其他有效工作；合并无法定位时可拆分或二分，各部分通过而组合失败需检查相互作用。方法无强制顺序，允许更合适方法，不强制二分或每次整批回滚重跑。reference SHALL 经显式生成清单管理，不按模式扫描删除用户文件。
