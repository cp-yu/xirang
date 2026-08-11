---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、verify 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与 definition-first authoring。
---

## ADDED Requirements

### Requirement: Agent 认知缺口 SHALL 触发确定性语义重载

Core workflow templates SHALL 指导 Agent 将不清楚、上下文压缩后可能遗忘或无法从当前权威内容确定的 Semantic Model 语义视为认知缺口，并通过 CLI 重新读取。Agent MUST NOT 根据 identity、title、旧摘要、残余对话上下文或实现代码猜测缺失的 Element Definition 或 Contract。

#### Scenario: 整体模型认知不清

- **WHEN** Agent 不清楚整体 Semantic Model，或怀疑上下文压缩、长会话或上下文切换已丢失整体认知
- **THEN** Agent SHALL 重新运行 `xirang arch outline --format json`
- **AND** SHALL 使用当前完整 hierarchy、Relationships、Metamodel 与局部 loaded Definitions 恢复整体认知

#### Scenario: 具体 Element 语义不清

- **WHEN** Agent 不清楚或怀疑遗忘某个 Element 的完整 Definition 或 Contract
- **THEN** Agent SHALL 使用该稳定 identity 重新运行 `xirang arch query <identity> --json`，并在需要 Contract 时添加 `--contract`
- **AND** SHALL NOT 从 impact identity、outline unloaded node 或 implementation evidence 猜测完整语义

#### Scenario: 多个具体 Elements 批量重载

- **WHEN** Agent 同时需要多个已知 identities 的完整语义
- **THEN** Agent SHALL 使用一次 batch `arch query` 显式请求这些 identities
- **AND** SHALL NOT 为方便而自动加载 impact 返回的全部 identities

## MODIFIED Requirements

### Requirement: 统一 CLI 查询接口

Core workflow templates SHALL 使用 `xirang arch outline` 恢复整体结构认知，使用 `xirang arch search` 定位未知概念候选，使用 `xirang arch impact` 发现 refinement 与 Relationship 相关 identities，并使用 batch `xirang arch query` 读取显式 Elements 的完整 Declaration 与 owned Contracts。需要校验全体 Element Contracts 时 SHALL 使用 `xirang validate --contracts`；MUST NOT 引用退役 spec commands 或已移除的 query navigation options。

#### Scenario: Propose 模板包含正确的契约导航指令

- **WHEN** propose 模板被加载
- **THEN** SHALL 指导 Agent 使用 `arch search` 定位候选 identities、使用 `arch impact` 发现相关 identities，并使用 batch `arch query --contract --json` 读取所选 Elements 的完整语义
- **AND** MUST NOT 引用 `arch query --relations`、`arch query --depth`、退役 spec commands 或 list-based Contract 扫描

#### Scenario: Apply 模板包含正确的契约交叉检查指令

- **WHEN** apply-change 模板被加载
- **THEN** SHALL 指导 Agent 在实现 element-owned behavior 前使用 `arch impact` 获取相关范围并使用 batch `arch query --contract` 查询显式关联 Elements
- **AND** MUST NOT 引用已移除的 query navigation options 或退役 spec commands

#### Scenario: Optimizer 使用 impact 获取 directed relationships

- **WHEN** optimizer 执行 semantic Relationship dependency expansion
- **THEN** SHALL 使用 `arch impact <identity> --depth 1 --json` 获取一跳 directed Relationship context
- **AND** SHALL 按需 batch query 选定 identities，而不是要求 impact 返回完整语义

### Requirement: apply skill SHALL 读取架构上下文

Apply skill SHALL 指导 Agent 通过 outline 理解 Target Semantic Model 的整体结构，通过 impact 发现 affected Elements 的 abstraction/refinement 与 semantic Relationship identities，再通过 batch query 读取显式 Elements 的完整 Declarations 与 owned Contracts。

#### Scenario: 查询受影响 elements

- **WHEN** Agent 开始 apply task 且 task 涉及特定 Element
- **THEN** SHALL 运行 `xirang arch impact <elementId> --depth 2 --json`
- **AND** SHALL 对需要实现或验证的 identities 运行 batch `xirang arch query <identities...> --contract --json`

#### Scenario: 从 Project Root 建立整体上下文

- **WHEN** task 的局部 Element 缺少足够 context，或 Agent 怀疑整体认知已丢失
- **THEN** Agent SHALL 重新运行 `xirang arch outline --format json`
- **AND** SHALL 使用完整 hierarchy 回溯到足以解释 intent 的 abstraction，再按需 query 更深 Element

#### Scenario: 读取 element-owned Contracts

- **WHEN** query 返回显式 identities 的 Contracts
- **THEN** Agent SHALL 将每个 Contract 解释为对应宿主 Element 单元中的完整 Requirements
- **AND** MUST NOT 依赖 metadata、impact payload 或未显式请求对象

#### Scenario: 语义优先的实现流程

- **WHEN** Agent 开始实现 task
- **THEN** SHALL 依次使用 outline 恢复必要整体认知、impact 发现 affected identities、query 读取选定 Definitions/Contracts、解释 relevant semantic Relationships、使用 CodeGraph 或 ACE/`rg`/`read` 获取 current implementation evidence，再开始编码
- **AND** code evidence MUST NOT 静默覆盖 approved Semantic Delta

### Requirement: 统一加载协议与优雅降级

Core workflows SHALL 使用同一无状态 Semantic Model loading protocol：`arch outline` 返回完整 Element hierarchy、Relationships 与 Metamodel，并按项目配置局部加载 Element Definitions；`arch impact` 返回影响 identities 与结构路径；batch `arch query` 返回显式 identities 的完整 Declarations 与可选 Contracts。`arch snapshot` SHALL 保留为完整导出工具，不作为默认 Agent onboarding command。Semantic Model 缺失或不完整时，只读 workflow MAY 使用部分 context 继续并声明不可用；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。

#### Scenario: Model 不存在

- **WHEN** Formal Semantic Model 不存在
- **THEN** 只读 workflow MAY 继续使用 code evidence
- **AND** SHALL 声明 Semantic Model unavailable

#### Scenario: Target model 不完整

- **WHEN** apply 或 sync 发现 root、identity 或 required contract error
- **THEN** SHALL 停止需要完整语义的操作
- **AND** MUST NOT 以空 collection 掩盖 error

#### Scenario: Shared context 使用统一模型

- **WHEN** workflow 启动且新版 model 存在
- **THEN** SHALL 使用 outline 获取完整 identity/hierarchy/Relationship/Metamodel context，并使用 impact 与 query 按需读取更深语义
- **AND** MUST NOT 使用 domain/capability 固定层级或 parallel YAML graph

#### Scenario: Shared context 使用 outline 恢复模型总览

- **WHEN** workflow 需要项目模型整体认知或怀疑整体认知已丢失
- **THEN** shared context fragment SHALL 指引运行 `xirang arch outline --format json`
- **AND** SHALL 说明 `architecture.outline.elementDefinitionDepth` 只控制 Element Definition projection，完整 Contract 必须通过显式 batch query 获取

#### Scenario: Code evidence 与 Semantic Model 分层

- **WHEN** workflow 需要 source path、symbol、import 或 call facts
- **THEN** SHALL 将其作为 current implementation evidence
- **AND** MUST NOT 将其自动提升为 Element、Relationship、Definition 或 Contract

#### Scenario: Templates 使用同一 fragment

- **WHEN** 检查 generated workflow templates
- **THEN** relevant surfaces SHALL 复用同一 exported constant
- **AND** SHALL 使用一致 canonical terminology 与认知恢复规则
