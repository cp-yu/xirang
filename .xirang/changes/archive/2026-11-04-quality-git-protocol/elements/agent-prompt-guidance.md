---
entity: element-declaration
identity: agent-prompt-guidance
kind: element
parent: agent-workbench-projection
title: Agent Prompt Guidance
definition: Agent Prompt Guidance 是 Apply、Quality 与 Archive 共用的质量协议呈现，独立承载委托、证据、完成条件及恢复诊断的共享指引，并提供可选失败定位方法。它从实现协议投影机械信息，不维护重复 schema，不将模型的优化取舍固化为逐方向状态机。
---

## MODIFIED Sections

### Section: 共享 quality gate 指引片段
系统 SHALL 从同一实现协议源向 Apply/Archive 生成 Review 委托、Opt opinion/显式不做 Opt 处置、Seal、status 与 Archive commit 检查指引，提供最小合法 JSON 示例和确定性失败语义。阶段指引表达基线 Review、主 Agent 决定的可选 Opt 与 Seal；不得保留独立 test-capture、checkpoint 或 freshness ledger 协议。

### Section: Archive 模板未收口恢复路径
Archive SHALL 对缺失或不可解析的 Seal commit 提供具体诊断，并指引主 Agent 返回 Apply 补齐 Quality 意见/Seal。Opt 的进度与代码恢复从 Git 判断；Archive 不将中断推断为已完成 opinion 或明确 skip。Semantic Delta、Sync、validation 和 task gate 独立处理。

### Section: Quality 模板 CLI 错误恢复指南
提示词 SHALL 根据 CLI code、diagnostics 和 allowedNextOperations 修正输入或补齐真实 Review/Opt opinion 与 Seal commit，不伪造意见、不删除历史、不把测试失败输出改为成功。Commit identity 无效时不得猜测 HEAD 或 branch ref。新实现不读取、迁移或兼容旧 quality 格式与命令输入；旧记录保持原样且不作为新协议证据。Seal commit 存在不表示当前 HEAD 或工作区与之相同，提示词 SHALL NOT 作此声明。

### Section: 提供可选失败诊断 reference
系统 SHALL 提供共享的优化失败诊断 reference，供主 Agent 与 Opt 依据 Git history 和实际证据定位问题。局部原因明确时可修正或撤销并验证；合并问题无法定位时可拆分或采用更合适方法；恢复不可靠时停止并交回主 Agent。Reference 不要求 Quality checkpoint、整批 reset/clean 或持久化方向队列，并经显式生成清单管理。
