---
entity: element-declaration
identity: quality-execution-model
kind: element
parent: quality
title: Quality Execution Model
definition: Quality Execution Model 定义 Quality 与 Archive 共用的 subagent-orchestrated 协作模型，独立承载主 Agent、可写 Opt、只读 Reviewer 与确定性 CLI 的职责边界。主 Agent 负责范围、继续投入及最终验证判断，独立 Review 保留在 Reviewer；它不定义各角色具体评估方法或 CLI 输入形状。
---

## Specification

### Section: Quality 模板选择遵循执行模型

系统 SHALL 对所有工具使用 subagent-orchestrated 模板骨架，通过显式 lookup 解析，不通过工具名称、路径或字符串模式推断支持能力，也不使用 current-agent-reread fallback。主 Agent 负责委托范围、越界处理、后续投入和最终风险验证，可读取代码与证据；Opt 独立读取并执行优化与局部测试，Reviewer 独立只读审查，CLI 负责确定性记录和门禁。主 Agent 不替代必需基线 Review 或基线缺陷修复的独立 Review。

### Section: Archive 重跑复用同一执行模型骨架

Archive SHALL 复用 standalone Apply 的 subagent-orchestrated 合约和共享优化/恢复 references，按缺失基线 Review、未完成委托、最终验证过期或恢复问题分流，不维护 archive-only 审查骨架或 reread fallback，不将任何优化修改一律路由为全流程重验。
