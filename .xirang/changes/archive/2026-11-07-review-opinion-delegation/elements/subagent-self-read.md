---
entity: element-declaration
identity: subagent-self-read
kind: element
parent: internal-agents
title: Subagent Self-Read
definition: Subagent Self-Read 是 Reviewer 与 Optimizer 独立取证和角色工具能力的约束，独立区分只读审查与可写优化执行。Reviewer 读取和按需测试，不修改项目；Optimizer 在委托范围内读取、编辑和执行必需局部测试，缺失对应测试时先补后改。它不决定主 Agent 的最终验证范围或改变目标语义。
---

## MODIFIED Sections

### Section: Subagent 工具权限定义

Reviewer SHALL 拥有主 Agent 的正常工具范围，包括环境中可用的检索和编辑工具；使用权限不构成修改授权，Reviewer 只读评估项目。Optimizer SHALL 在委托范围内拥有实际读取、搜索、修改实现和测试、运行局部测试的能力，不得仅在 prompt 声称可写而由原生权限阻止；两者均独立读取实际依据，不依赖主 Agent 转述。

### Section: Subagent Bash 允许命令范围

Reviewer SHALL 不通过 Bash 或其他工具修改项目、Change、Quality、Checkpoint 或 Git 历史；可自主选择可用的只读检索与判断手段，不设 Bash 命令类别白名单。Optimizer MAY 在委托范围内使用实现、测试和可靠恢复所需的文件操作，不得借写入权限改变目标语义或丢弃不明历史。

### Section: Subagent 测试策略（L1）

主 Agent SHALL 在 Review 委派前运行并检查本次所需测试全部通过。Reviewer SHALL 独立检查测试对受托行为与边界的保护是否足够，而不必重跑测试，也不能仅凭复选框或测试通过断定行为正确；当可信行为证据缺失时不得 PASS，可测试却无对应测试或存在弱断言时报告 CRITICAL，已有可信证据但持久测试必要性不确定时报告 WARNING 并交主 Agent 与用户决定。Optimizer SHALL 对优化运行相关局部测试，缺少对应行为测试时先补后改；主 Agent按累计风险判断最终全量测试和增量 Review。
