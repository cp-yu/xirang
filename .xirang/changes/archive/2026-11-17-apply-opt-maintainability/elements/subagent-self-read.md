---
operation: MODIFIED
entity: element-declaration
identity: subagent-self-read
kind: element
parent: internal-agents
title: Subagent Self-Read
definition: Subagent Self-Read 是 Reviewer 与 Optimizer 独立取证及工具能力的约束，独立区分只读审查、只读机会检查与授权优化实施。角色能力不构成写入授权，Optimizer 按委派模式读取或实施验证；提交和最终验证编排由协调者负责，它不改变目标语义。
---

## MODIFIED Sections

### Section: Subagent 工具权限定义

Reviewer SHALL 拥有主 Agent 的正常工具范围，包括环境中可用的检索和编辑工具；使用权限不构成修改授权，Reviewer 只读评估项目。Optimizer SHALL 在委托范围内拥有实际读取、搜索、修改实现和测试、运行局部测试的能力，不得仅在 prompt 声称可写而由原生权限阻止；两者均独立读取实际依据，不依赖主 Agent 转述。

Optimizer 的工具能力 SHALL NOT 代替模式授权；inspection 保持只读，只有 implementation 可实施获授权组的修改，结果 Git 提交由协调者负责。

### Section: Subagent 测试策略（L1）

主 Agent SHALL 在 Review 委派前运行并检查本次所需测试全部通过。Reviewer SHALL 独立检查测试对受托行为与边界的保护是否足够，而不必重跑测试，也不能仅凭复选框或测试通过断定行为正确；当可信行为证据缺失时不得 PASS，可测试却无对应测试或存在弱断言时报告 CRITICAL，已有可信证据但持久测试必要性不确定时报告 WARNING 并交主 Agent 与用户决定。Optimizer SHALL 在 implementation 对改动运行相关局部测试，缺少对应行为测试时先补后改；inspection 如实报告已有证据与建议，不制造实施验证。主 Agent按累计风险判断测试及独立 Review 范围，保留未审改动不能免审。
