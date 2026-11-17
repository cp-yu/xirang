---
operation: MODIFIED
entity: element-declaration
identity: quality-execution-model
kind: element
parent: quality
title: Quality Execution Model
definition: Quality Execution Model 定义 Quality 与 Archive 共用的 subagent-orchestrated 协作模型，独立承载主 Agent、按模式只读检查或授权实施的 Opt、只读 Reviewer 与确定性 CLI 的职责边界。主 Agent 负责范围、继续投入及最终验证判断，独立 Review 保留在 Reviewer；它不定义各角色具体评估方法或 CLI 输入形状。
---

## MODIFIED Sections

### Section: Quality 模板选择遵循执行模型

系统 SHALL 对所有工具使用 subagent-orchestrated 模板骨架，通过显式 lookup 解析，不通过工具名称、路径或字符串模式推断支持能力，也不使用 current-agent-reread fallback。主 Agent 负责委托范围、越界处理、后续投入和最终风险验证，可读取代码与证据；Opt 独立读取，在 inspection 只读发现、在 implementation 执行授权组改进与局部测试，Reviewer 独立只读审查，CLI 负责确定性记录和门禁。主 Agent 不替代必需基线 Review 或基线缺陷修复的独立 Review。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。
