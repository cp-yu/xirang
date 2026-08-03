---
entity: element-declaration
identity: verify-orchestration
kind: element
parent: verify
title: Verify Orchestration
definition: Verify Orchestration 定义 verify 工作流提示词的编排契约：Coordinator 角色声明、阶段模式标签、显式 subagent delegation 指令、subagent 超时与等待规则、checkpoint 有序执行步骤与语言一致性。它保证顶层 agent 只做编排与持久化，不替代 reviewer/optimizer 判断。
---

## Requirements

### Requirement: Coordinator 角色声明

verify 工作流提示词 SHALL 以显式 coordinator 角色声明开头，将 top-level agent 定义为 verification coordinator，而不是 verification judge。角色声明 SHALL 定义 coordinator、Reviewer Subagent、Optimizer Subagent 与 CLI 四个互相独立的角色及其边界，并显式包含约束：`You MUST NOT substitute your own completeness/correctness/coherence judgments for the reviewer's.` Coordinator 的 `[Mode: Evidence]` 步骤 SHALL 简化为确定 changeDir 与 projectRoot 路径，不再读取候选文件内容。

#### Scenario: Agent 理解自身是 coordinator 而不是 judge
- **WHEN** top-level agent 加载 verify prompt
- **THEN** 第一个内容块 SHALL 声明 coordinator 角色
- **AND** SHALL 列出四个角色及其职责
- **AND** SHALL 显式禁止 coordinator 自行作出裁决

#### Scenario: Evidence 步骤不再读取文件内容
- **WHEN** coordinator 进入 `[Mode: Evidence]`
- **THEN** coordinator SHALL 仅确定 changeDir 和 projectRoot 路径
- **AND** SHALL NOT 读取候选实现文件的内容
- **AND** SHALL NOT 执行 git diff 或 git status（由 subagent 自行执行）
#### Scenario: Agent 理解自身是 coordinator 而不是 judge（prompt orchestration 变体）
- **WHEN** top-level agent 加载 verify prompt
- **THEN** 第一个内容块 SHALL 声明 coordinator 角色
- **AND** SHALL 列出四个角色及其更新后的职责（coordinator 不再收集 evidence）
- **AND** SHALL 显式禁止 coordinator 自行作出裁决
### Requirement: 阶段模式标签

verify 工作流提示词 SHALL 使用 mode label 标记主要阶段切换，以提示认知上下文切换。Mode label SHALL NOT 应用于 checkpoint 子状态（BASELINE_COMMITTED、SUCCESS_COMMITTED、FAILED_STATE_SNAPSHOTTED、FAILURE_ROLLED_BACK）；这些只是单一 `[Mode: Checkpoint]` 认知模式内的实现分支。

#### Scenario: 主要阶段切换带有 mode label

- **WHEN** verify 工作流从 evidence collection 切换到 reviewer delegation
- **THEN** step header SHALL 包含 `[Mode: Delegate Review]`
- **AND** mode label SHALL 作为 step number 的前缀

#### Scenario: Checkpoint 子状态不单独使用 mode label

- **WHEN** verify 工作流处于 Phase 2 checkpoint management
- **THEN** 单个 checkpoint 状态 SHALL NOT 获得独立 mode label
- **AND** SHALL 在 `[Mode: Checkpoint]` section 内描述
#### Scenario: Checkpoint 子状态不单独使用 mode label（prompt orchestration 变体）
- **WHEN** verify 工作流处于 Phase 2 checkpoint management
- **THEN** 单个 checkpoint 状态（BASELINE_COMMITTED、SUCCESS_COMMITTED 等）SHALL NOT 获得独立 mode label
- **AND** SHALL 在 `[Mode: Checkpoint]` section 内描述
### Requirement: Explicit subagent delegation instructions

verify 工作流提示词 SHALL 提供明确的 subagent delegation 指令，用于启动 reviewer 和 optimizer subagent。提示词 SHALL NOT 写入任何工具专属 API 调用语法，只描述工作流意图、subagent 角色、skill invoke、输入信息和等待规则。

#### Scenario: Master 委派 reviewer 时只传定位信息
- **WHEN** verify coordinator 进入 `[Mode: Delegate Review]`
- **THEN** coordinator SHALL 传入 changeName、changeDir、projectRoot 三个字符串
- **AND** SHALL NOT 传入 finalFileContents、changeArtifacts 或 gitEvidence 的完整文本
- **AND** SHALL 声明 reviewer 拥有 Read + Bash 工具能力

#### Scenario: Master 委派 optimizer 时只传定位信息
- **WHEN** verify coordinator 进入 `[Mode: Optimize]`
- **THEN** coordinator SHALL 传入 changeName、changeDir、projectRoot 三个字符串
- **AND** SHALL NOT 传入 phase1Summary、finalFileContents 或 config 的完整内容
- **AND** SHALL 声明 optimizer 拥有 Read + Bash 工具能力
#### Scenario: Master 委派 reviewer 时只传定位信息（prompt orchestration 变体）
- **WHEN** verify coordinator 进入 `[Mode: Delegate Review]`
- **THEN** coordinator SHALL 传入 changeName、changeDir、projectRoot 三个字符串
- **AND** SHALL 指定 `context: "fresh"` 确保 subagent 不继承对话历史
- **AND** SHALL NOT 传入 finalFileContents、changeArtifacts 或 gitEvidence 的完整文本
- **AND** SHALL 声明 reviewer 拥有 Read + Bash 工具能力
#### Scenario: Master 委派 optimizer 时只传定位信息（prompt orchestration 变体）
- **WHEN** verify coordinator 进入 `[Mode: Optimize]`
- **THEN** coordinator SHALL 传入 changeName、changeDir、projectRoot 三个字符串
- **AND** SHALL 指定 `context: "fresh"` 确保 subagent 不继承对话历史
- **AND** SHALL NOT 传入 phase1Summary、finalFileContents 或 config 的完整内容
- **AND** SHALL 声明 optimizer 拥有 Read + Bash 工具能力
### Requirement: Subagent 超时和等待规则

verify 工作流提示词 SHALL 为所有 subagent delegation 包含显式 timeout 和 waiting rules：表达 10 分钟等待预算、等待完整 subagent 结果、超时继续 polling、询问用户而不是 kill subagent、top-level agent MUST 在进入下一步前接收完整 subagent payload。

#### Scenario: Reviewer subagent 超过默认 timeout

- **WHEN** reviewer subagent 在 30 秒内没有返回
- **THEN** coordinator SHALL NOT 将其视为失败
- **AND** SHALL 继续等待或 polling
- **AND** SHALL NOT 在收到结果前进入 payload validation

#### Scenario: Subagent 等待时间过长

- **WHEN** coordinator 等待某个 subagent 超过 10 分钟
- **THEN** coordinator SHALL 询问用户是否继续等待或终止
- **AND** SHALL NOT 在未经用户确认时 kill subagent

### Requirement: Checkpoint 协议 SHALL 使用有序执行步骤

Phase 2 prompt SHALL 以有序步骤描述 commit checkpoint 与 rollback fence：先创建非空 baseline commit；每个成功 finding 创建含 finding ID 的 commit；失败 CLI record 后把 `.verify-result.json` 与 `.apply-isolation.json` 快照到 repository 外并记录 SHA-256；最后回滚 speculative code、原子恢复两个状态文件并校验 hash。协议 SHALL 明确禁止空 baseline、stash 与 tag，并要求状态恢复异常时停止。

#### Scenario: Agent 执行失败回滚

- **WHEN** coordinator 处理 speculative verification 失败
- **THEN** prompt SHALL 先指示持久化两个状态文件的 snapshot
- **AND** SHALL 再指示回滚 speculative code 并原子恢复两个状态文件

### Requirement: 语言一致性

verify 工作流中新增或修改的 prompt text SHALL 全部使用英文，与现有 template language 保持一致。Mode label SHALL 使用英文格式 `[Mode: ...]`。Severity philosophy 表述 SHALL 从"prefer lower tier"改为"escalate when uncertain"，删除降级偏见的措辞。

#### Scenario: Mode label 使用英文

- **WHEN** verify prompt 被组装
- **THEN** 所有 mode label SHALL 以 `[Mode: <EnglishLabel>]` 形式出现
- **AND** SHALL NOT 使用中文 mode label

#### Scenario: 删除"prefer lower tier"表述

- **WHEN** reviewer subagent contract 定义 severity 判定标准时
- **THEN** SHALL NOT 包含 "when uncertain, prefer SUGGESTION over WARNING and WARNING over CRITICAL" 表述
- **AND** SHALL 替换为 "when uncertain, escalate to CRITICAL to enforce the 'clean slate' principle"
#### Scenario: Mode label 使用英文（prompt orchestration 变体）
- **WHEN** verify prompt 被组装
- **THEN** 所有 mode label SHALL 以 `[Mode: <EnglishLabel>]` 形式出现
- **AND** SHALL NOT 使用 `[模式：证据]` 这类中文 mode label
#### Scenario: 删除"prefer lower tier"表述（prompt orchestration 变体）
- **WHEN** reviewer.ts 子代理 contract 被渲染
- **THEN** SHALL NOT 包含 "when uncertain, prefer SUGGESTION over WARNING and WARNING over CRITICAL" 表述
- **AND** SHALL 替换为 "when uncertain, escalate to CRITICAL to enforce the 'clean slate' principle"
