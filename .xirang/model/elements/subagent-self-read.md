---
entity: element-declaration
identity: subagent-self-read
kind: element
parent: internal-agents
title: Subagent Self-Read
definition: Subagent Self-Read 定义 Reviewer/Optimizer subagent 的工具权限模型：允许 Read 与只读 Bash（测试、git 只读、搜索、构建验证），禁止 Edit/Write 及任何 Bash 文件修改绕行，并规定 L1 测试策略（默认静态判断、可疑时抽查）。
---

## Requirements

### Requirement: Subagent 工具权限定义
Reviewer 和 Optimizer subagent SHALL 拥有 Read 与 Bash（只读操作）能力，不允许 Edit/Write。Subagent MUST NOT 通过 Bash 绕过 Edit/Write 限制（如 `echo >`, `sed -i`, `rm`, `mv`）。

#### Scenario: Reviewer 使用 Read 读取实现文件
- **WHEN** reviewer 需要检查某候选实现文件的内容
- **THEN** reviewer SHALL 直接使用 Read 工具读取该文件
- **AND** SHALL NOT 依赖 master agent 传入的文件内容

#### Scenario: Reviewer 使用 Bash 跑测试
- **WHEN** reviewer 对某 task 的测试覆盖存疑
- **THEN** reviewer SHALL 使用 Bash 执行相关测试子集
- **AND** SHALL 将测试结果作为验证证据引用

#### Scenario: Subagent 尝试通过 Bash 修改文件
- **WHEN** subagent 的 Bash 命令包含文件修改操作（echo >、sed -i、rm、mv、cp 覆盖）
- **THEN** 该行为违反 hard constraint
- **AND** 用户审批层 SHALL 拒绝该命令

### Requirement: Subagent Bash 允许命令范围
Reviewer 与 Optimizer 的 Bash 使用 SHALL 限定于：测试执行（`pnpm test`、`vitest run <path>`）、Git 只读（`git status`、`git diff`、`git log`、`git show`）、搜索（`grep`、`find` 只读搜索）与构建验证（`pnpm build`、`tsc --noEmit`）。Subagent MUST NOT 执行文件系统修改命令、网络请求命令、进程管理命令或包安装命令。

#### Scenario: Optimizer 使用 grep 定位代码模式
- **WHEN** optimizer 需要确认某函数在多个文件中的重复出现
- **THEN** optimizer SHALL 使用 `grep -rn "pattern" src/` 定位
- **AND** SHALL 基于搜索结果决定是否提议去重

#### Scenario: Reviewer 执行类型检查
- **WHEN** reviewer 需要验证实现代码的类型正确性
- **THEN** reviewer SHALL 使用 `tsc --noEmit` 或 `pnpm build` 验证
- **AND** SHALL 将编译错误作为 CRITICAL issue 的证据

### Requirement: Subagent 测试策略（L1）
Subagent SHALL 采用 L1 测试策略：默认静态判断，可疑时 Bash 抽查。Subagent MUST NOT 默认跑全量测试，仅在无法确定受影响的测试子集或 git diff 范围过大时跑全量。

#### Scenario: Tasks 标记测试通过且覆盖充分
- **WHEN** tasks.md 中测试 task 标记为 [x]
- **AND** 相关测试文件包含对应 scenario 的 test case
- **THEN** reviewer SHALL 分配 PASS 并引用 tasks.md 和测试文件作为证据
- **AND** SHALL NOT 重新执行测试

#### Scenario: Tasks 标记通过但覆盖可疑
- **WHEN** tasks.md 中测试 task 标记为 [x]
- **AND** reviewer 发现 spec 中某 scenario 在测试文件中无对应 case
- **THEN** reviewer SHALL 使用 Bash 跑相关测试子集验证
- **AND** SHALL 将缺失覆盖报告为 WARNING 并在 writeBackPlan 中建议补测试

#### Scenario: 测试执行失败
- **WHEN** reviewer 通过 Bash 执行测试且 exit code ≠ 0
- **THEN** reviewer SHALL 报告为 CRITICAL issue
- **AND** SHALL 引用失败的测试输出作为证据
- **AND** SHALL 在 writeBackPlan 中建议修复失败测试
