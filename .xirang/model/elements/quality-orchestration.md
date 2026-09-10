---
entity: element-declaration
identity: quality-orchestration
kind: element
parent: quality
title: Quality Orchestration
definition: Quality Orchestration 定义 quality 工作流提示词的编排契约：Coordinator 角色声明、阶段模式标签、显式 subagent delegation 指令、subagent 超时与等待规则、checkpoint 有序执行步骤与语言一致性。它保证顶层 agent 只做编排与持久化，不替代 reviewer 与 optimizer 的判断，也不定义这两个角色自身的判断标准。
---

## Requirements

### Requirement: Coordinator 角色声明

quality 工作流提示词 SHALL 以显式 coordinator 角色声明开头，把顶层 agent 定义为 quality coordinator，而不是 judge。角色声明 SHALL 定义 coordinator、Reviewer Subagent、Optimizer Subagent 与 CLI 四个互相独立的角色及其边界，并显式包含约束：顶层 agent MUST NOT 用自己的完整性、正确性或一致性判断替代 reviewer 的判断。

#### Scenario: Agent 理解自身是 coordinator

- **WHEN** 顶层 agent 加载 quality prompt
- **THEN** 第一个内容块 SHALL 声明 coordinator 角色
- **AND** SHALL 列出四个角色及其职责
- **AND** SHALL 显式禁止 coordinator 自行作出裁决

#### Scenario: Evidence 步骤不再读取文件内容

- **WHEN** coordinator 进入证据准备步骤
- **THEN** coordinator SHALL 仅确定 changeDir 与 projectRoot 路径
- **AND** SHALL NOT 读取候选实现文件的内容
- **AND** SHALL NOT 执行 git diff 或 git status（由 subagent 自行执行）

### Requirement: 阶段模式标签

quality 工作流提示词 SHALL 使用 mode label 标记主要阶段切换，以提示认知上下文切换。Mode label SHALL NOT 应用于 checkpoint 子状态；这些只是单一 `[Mode: Checkpoint]` 认知模式内的实现分支。

#### Scenario: 主要阶段切换带有 mode label

- **WHEN** 工作流从证据准备切换到 reviewer 委派
- **THEN** step header SHALL 包含 `[Mode: Delegate Review]`
- **AND** mode label SHALL 作为 step number 的前缀

#### Scenario: Checkpoint 子状态不单独使用 mode label

- **WHEN** 工作流处于 checkpoint 管理阶段
- **THEN** 单个 checkpoint 状态 SHALL NOT 获得独立 mode label
- **AND** SHALL 在 `[Mode: Checkpoint]` section 内描述

### Requirement: 显式 subagent delegation 指令

quality 工作流提示词 SHALL 提供明确的 subagent delegation 指令，用于启动 reviewer 与 optimizer subagent。提示词 SHALL NOT 写入任何工具专属 API 调用语法，只描述工作流意图、subagent 角色、输入信息与等待规则。

#### Scenario: 委派 reviewer 时只传定位信息

- **WHEN** coordinator 进入委派 reviewer 的步骤
- **THEN** coordinator SHALL 传入 changeName、changeDir、projectRoot 三个字符串
- **AND** SHALL 指定 fresh context，确保 subagent 不继承对话历史
- **AND** SHALL NOT 传入文件内容、change artifacts 或 git 证据的完整文本
- **AND** SHALL 声明 reviewer 拥有 Read 与 Bash 工具能力

#### Scenario: 委派 optimizer 时只传定位信息

- **WHEN** coordinator 进入委派 optimizer 的步骤
- **THEN** coordinator SHALL 传入 changeName、changeDir、projectRoot 三个字符串
- **AND** SHALL 指定 fresh context
- **AND** SHALL NOT 传入已有结论、文件内容或配置的完整文本
- **AND** SHALL 声明 optimizer 拥有 Read 与 Bash 工具能力

### Requirement: Subagent 超时和等待规则

quality 工作流提示词 SHALL 为所有 subagent delegation 包含显式 timeout 与 waiting rules：等待完整 subagent 结果、超时后继续等待、询问用户而不是终止 subagent，且顶层 agent MUST 在进入下一步前接收完整 payload。

#### Scenario: Subagent 未及时返回

- **WHEN** subagent 在预期时间内没有返回
- **THEN** coordinator SHALL NOT 将其视为失败
- **AND** SHALL 继续等待
- **AND** SHALL NOT 在收到结果前进入 payload 校验

#### Scenario: 等待时间过长

- **WHEN** coordinator 等待某个 subagent 超过设定的等待预算
- **THEN** coordinator SHALL 询问用户是否继续等待或终止
- **AND** SHALL NOT 在未经用户确认时终止 subagent

### Requirement: Checkpoint 协议使用有序执行步骤

quality 工作流提示词 SHALL 以有序步骤描述 checkpoint 与回滚边界：先创建非空 baseline commit；每个成功方向创建含方向 ID 的 commit；失败记录写入后把 quality 记录与 `.apply-isolation.json` 快照到 repository 外并记录 SHA-256；最后回滚该轮实现、原子恢复两个状态文件并校验 hash。协议 SHALL 明确禁止空 baseline、stash 与 tag，并要求状态恢复异常时停止。

#### Scenario: Agent 执行失败回滚

- **WHEN** coordinator 处理某轮复核失败
- **THEN** prompt SHALL 先指示持久化两个状态文件的 snapshot
- **AND** SHALL 再指示回滚该轮实现并原子恢复两个状态文件

### Requirement: 语言一致性

quality 工作流中新增或修改的 prompt text SHALL 使用与现有模板一致的语言。Mode label SHALL 使用 `[Mode: ...]` 形式。

#### Scenario: Mode label 使用固定形式

- **WHEN** quality prompt 被组装
- **THEN** 所有 mode label SHALL 以 `[Mode: <Label>]` 形式出现
