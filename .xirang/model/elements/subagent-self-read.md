---
entity: element-declaration
identity: subagent-self-read
kind: element
parent: internal-agents
title: Subagent Self-Read
definition: Subagent Self-Read 是 Reviewer 与 Optimizer 独立取证和角色工具能力的约束，独立区分只读审查与可写优化执行。Reviewer 读取和按需测试，不修改项目；Optimizer 在委托范围内读取、编辑和执行必需局部测试，缺失对应测试时先补后改。它不决定主 Agent 的最终验证范围或改变目标语义。
---

## Specification

### Section: Subagent 工具权限定义

Reviewer SHALL 拥有读取、搜索与只读 Bash 验证能力，不允许 Edit/Write，也不通过 Bash 绕过。Optimizer SHALL 在主 Agent 委托范围内拥有实际读取、搜索、修改实现及测试、运行测试和保存必要进度的能力，可新增、删除或移动必要文件；不得仅在 prompt 宣称可写而由原生权限阻止。两者独立读取实际依据，不依赖主 Agent 转述内容。

### Section: Subagent Bash 允许命令范围

Reviewer 的 Bash SHALL 限于测试、Git 只读、只读搜索与构建验证，不执行文件修改、网络请求、进程管理或包安装。Optimizer MAY 在委托范围内使用实现、测试和可靠恢复所需的文件操作；不得借写入权限改变目标语义、执行无关工作或丢弃不明历史。

### Section: Subagent 测试策略（L1）

Reviewer SHALL 采用 L1 测试策略：默认静态判断，可疑时 Bash 抽查。Reviewer MUST NOT 默认跑全量测试，仅在无法确定受影响的测试子集或 git diff 范围过大时跑全量。

- **Tasks 标记测试通过且覆盖充分**
  - tasks.md 中测试 task 标记为 [x]
  - 相关测试文件包含对应 Acceptance Case 的 test case
  - reviewer SHALL 分配 PASS 并引用 tasks.md 和测试文件作为证据
  - SHALL NOT 重新执行测试

- **Tasks 标记通过但覆盖可疑**
  - tasks.md 中测试 task 标记为 [x]
  - reviewer 发现 spec 中某 Acceptance Case 在测试文件中无对应 case
  - reviewer SHALL 使用 Bash 跑相关测试子集验证
  - SHALL 将缺失覆盖报告为 WARNING 并在 writeBackPlan 中建议补测试

- **测试执行失败**
  - reviewer 通过 Bash 执行测试且 exit code ≠ 0
  - reviewer SHALL 报告为 CRITICAL issue
  - SHALL 引用失败的测试输出作为证据
  - SHALL 在 writeBackPlan 中建议修复失败测试

Optimizer SHALL 对优化运行相关局部测试；对应测试缺失时先补测试再修改实现。不得以默认静态判断免除测试，也不要求每项全量测试。主 Agent 根据累计风险决定最终全量测试与增量 Review；Opt 自测不是独立 Review。
