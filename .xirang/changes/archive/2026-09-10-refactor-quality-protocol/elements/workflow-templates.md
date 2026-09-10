---
operation: MODIFIED
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、quality 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。
---

## MODIFIED Requirements

### Requirement: 模板不内联 subagent 角色定义

quality/apply/archive 模板 SHALL NOT 在模板 body 中内联 reviewer 或 optimizer 的完整角色定义、验证协议、判断标准或输出格式。这些内容归对应的 generated internal subagent artifact 所有。模板 SHALL 保留 orchestration 职责描述：证据包收集、subagent delegation、payload 校验、CLI 持久化、checkpoint 管理和写回执行。

#### Scenario: 模板内容精简
- **WHEN** 比较改进前后的 quality 模板
- **THEN** 改进后模板 SHALL NOT 包含 reviewer 的验证维度列表、severity 定义或输出 JSON schema
- **AND** 改进后模板 SHALL 保留 evidence 包组装和 subagent delegation 指令

### Requirement: 内部 subagent 引用替换内联 fragment

quality/apply/archive 三个模板中 delegate to reviewer subagent 的步骤 SHALL delegate to `xirang-reviewer`；delegate to optimizer subagent 的步骤 SHALL delegate to `xirang-optimizer`。Reviewer 与 Optimizer 的完整角色定义、判断标准和输出合同 SHALL 由对应 generated agent artifact 承载。Explore SHALL NOT delegate impact discovery to an internal subagent，而通过 `xirang arch search` 与 `xirang arch impact` 获取 Formal Semantic Model context。

#### Scenario: Apply 模板 delegate to reviewer agent
- **WHEN** apply 模板执行 Review
- **THEN** 模板 SHALL 指示顶层 agent delegate to the clean-context reviewer agent with `context: "fresh"`
- **AND** agent 的审查维度和判定标准 SHALL 由 reviewer agent 自身 prompt 定义

#### Scenario: Explore 模板使用 CLI 影响面查询
- **WHEN** explore 模板被生成
- **THEN** semantic impact behavior SHALL 直接引用 `xirang arch search` 与 `xirang arch impact` CLI command surface
- **AND** SHALL NOT 生成或引用第三个 internal subagent

#### Scenario: Apply 模板 Optimization 的 optimizer agent
- **WHEN** apply 模板执行 Optimization 循环
- **THEN** 模板 SHALL 指示主 agent delegate to the clean-context `xirang-optimizer` agent with `context: "fresh"`
- **AND** SHALL 传递 Review 结果、artifacts、文件内容、config 和失败方向

#### Scenario: Workflow Skills 声明 Internal Subagents 约束
- **WHEN** workflow skill 模板被生成
- **THEN** instructions SHALL 以共享 Xirang Philosophy 开头
- **AND** Reviewer 与 Optimizer 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中

## REMOVED Requirements

### Requirement: Verify template 对 subagent 使用明确 delegation 指令

### Requirement: Phase 2 checkpoint state machine 使用表格格式

## ADDED Requirements

### Requirement: Quality template 对 subagent 使用明确 delegation 指令

quality 模板 SHALL 使用明确的 subagent delegation instructions 替代 prose description，指定 delegate to clean-context generated subagent、传入显式 evidence bundle 结构、等待完整 payload，且主 agent MUST NOT 读取或内联 generated subagent artifact。

#### Scenario: Reviewer subagent step 具有明确 delegation 指令
- **WHEN** subagent-orchestrated quality prompt 到达 reviewer step
- **THEN** prompt SHALL 明确要求 delegate to clean-context generated reviewer subagent
- **AND** prompt SHALL 包含 evidence bundle 字段列表
- **AND** SHALL NOT 只包含 prose 描述

#### Scenario: Quality template 不包含工具 API 语法
- **WHEN** quality prompt 被组装
- **THEN** prompt SHALL NOT 包含工具专属 API 调用语法

#### Scenario: Optimizer subagent step 具有明确 delegation 指令
- **WHEN** quality prompt 到达 Optimization step
- **THEN** prompt SHALL 明确要求 delegate to clean-context generated `xirang-optimizer` subagent
- **AND** SHALL 将失败方向作为具名输入字段传入
- **AND** SHALL NOT 指示主 agent 读取或内联 generated subagent artifact

### Requirement: checkpoint state machine 使用表格格式

quality 模板 SHALL 将 checkpoint state machine 描述为 Markdown table，映射 state、trigger 与 git operation；`QUALITY_STATE_MACHINE_DIAGRAM` fragment SHALL 放在 Optimization section 开头、位于 checkpoint state machine table 之前；`Hard rules` bullet list SHALL 跟在表格之后列出不可协商的安全约束。

#### Scenario: Checkpoint state 以表格展示
- **WHEN** quality prompt 到达 checkpoint section
- **THEN** 四个 state（CREATED、BASELINE_RESTORED_FOR_RETRY、TERMINAL_ACCEPTED、TERMINAL_RESTORED）SHALL 出现在表格中
- **AND** 每一行 SHALL 显示 state name、trigger condition 与 git operation
- **AND** 表格前 SHALL 出现 `[Mode: Checkpoint]` label

#### Scenario: 简洁意识使用中性术语
- **WHEN** explore 指令描述简单性检查
- **THEN** 章节 SHALL 使用 "Simplicity Awareness" 标题
- **AND** 规则列表 SHALL 称为 "simplicity filter"
- **AND** SHALL 使用中性术语，不引用外部框架名称
