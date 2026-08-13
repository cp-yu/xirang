---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、verify 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。
---

## Requirements

### Requirement: 模板不内联 subagent 角色定义

verify/apply/archive 模板 SHALL NOT 在模板 body 中内联 reviewer 或 optimizer 的完整角色定义、验证协议、判断标准或输出格式。这些内容归对应的 generated internal subagent artifact 所有。模板 SHALL 保留 orchestration 职责描述：证据包收集、subagent delegation、payload 校验、CLI 持久化、checkpoint 管理和写回执行。

#### Scenario: 模板内容精简

- **WHEN** 比较改进前后的 verify 模板
- **THEN** 改进后模板 SHALL NOT 包含 reviewer 的验证维度列表、severity 定义或输出 JSON schema
- **AND** 改进后模板 SHALL 保留 evidence 包组装和 subagent delegation 指令

### Requirement: Verify template 对 subagent 使用明确 delegation 指令

verify 模板 SHALL 使用明确的 subagent delegation instructions 替代 prose description，指定 delegate to clean-context generated subagent、传入显式 evidence bundle 结构、等待完整 payload，且主 agent MUST NOT 读取或内联 generated subagent artifact。

#### Scenario: Reviewer subagent step 具有明确 delegation 指令

- **WHEN** subagent-orchestrated verify prompt 到达 reviewer step
- **THEN** prompt SHALL 明确要求 delegate to clean-context generated reviewer subagent
- **AND** prompt SHALL 包含 evidence bundle 字段列表
- **AND** SHALL NOT 只包含 prose 描述

#### Scenario: Verify template 不包含工具 API 语法

- **WHEN** verify prompt 被组装
- **THEN** prompt SHALL NOT 包含工具专属 API 调用语法

#### Scenario: Optimizer subagent step 具有明确 delegation 指令

- **WHEN** verify prompt 到达 Phase 2 optimization step
- **THEN** prompt SHALL 明确要求 delegate to clean-context generated `xirang-optimizer` subagent
- **AND** SHALL 将 failedDirections 作为具名输入字段传入
- **AND** SHALL NOT 指示主 agent 读取或内联 generated subagent artifact

### Requirement: Phase 2 checkpoint state machine 使用表格格式

verify 模板 SHALL 将 Phase 2 checkpoint state machine 描述重构为 Markdown table，映射 state、trigger 与 git operation；`VERIFY_STATE_MACHINE_DIAGRAM` fragment SHALL 放在 Phase 2 section 开头、位于 checkpoint state machine table 之前；`Hard rules` bullet list SHALL 跟在表格之后列出不可协商的安全约束。

#### Scenario: Checkpoint state 以表格展示

- **WHEN** verify prompt 到达 Phase 2 checkpoint section
- **THEN** 四个 state（CREATED、BASELINE_RESTORED_FOR_RETRY、TERMINAL_ACCEPTED、TERMINAL_RESTORED）SHALL 出现在表格中
- **AND** 每一行 SHALL 显示 state name、trigger condition 与 git operation
- **AND** 表格前 SHALL 出现 `[Mode: Checkpoint]` label

#### Scenario: 简洁意识使用中性术语

- **WHEN** explore 指令描述简单性检查
- **THEN** 章节 SHALL 使用 "Simplicity Awareness" 标题
- **AND** 规则列表 SHALL 称为 "simplicity filter"
- **AND** SHALL 使用中性术语，不引用外部框架名称

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

### Requirement: 固定工作流模板集合

WorkflowManifestRegistry SHALL 恰好包含六个 user workflows：propose、explore、apply、archive、build 和 snack。Registry SHALL NOT 包含退役的 build 工作流。

#### Scenario: Registry 包含 Project Build

- **WHEN** 查询 workflow manifest
- **THEN** SHALL 包含 workflow ID `build`，其 skill name 与 directory 均为 `xirang-build`
- **AND** SHALL NOT 包含退役 build 名称

### Requirement: 内部 subagent 引用替换内联 fragment

Verify/apply/archive 三个模板中 delegate to reviewer subagent 的步骤 SHALL delegate to `xirang-reviewer`；delegate to optimizer subagent 的步骤 SHALL delegate to `xirang-optimizer`。Reviewer 与 Optimizer 的完整角色定义、判断标准和输出合同 SHALL 由对应 generated agent artifact 承载。Explore SHALL NOT delegate impact discovery to an internal subagent，而通过 `xirang arch search` 与 `xirang arch impact` 获取 Formal Semantic Model context。

#### Scenario: Apply 模板 delegate to reviewer agent

- **WHEN** apply 模板执行 Phase 1
- **THEN** 模板 SHALL 指示顶层 agent delegate to the clean-context reviewer agent with `context: "fresh"`
- **AND** agent 的审查维度和判定标准 SHALL 由 reviewer agent 自身 prompt 定义

#### Scenario: Explore 模板使用 CLI 影响面查询

- **WHEN** explore 模板被生成
- **THEN** semantic impact behavior SHALL 直接引用 `xirang arch search` 与 `xirang arch impact` CLI command surface
- **AND** SHALL NOT 生成或引用第三个 internal subagent

#### Scenario: Apply 模板 Phase 2 的 optimizer agent

- **WHEN** apply 模板执行 Phase 2 优化循环
- **THEN** 模板 SHALL 指示主 agent delegate to the clean-context `xirang-optimizer` agent with `context: "fresh"`
- **AND** SHALL 传递 Phase 1 结果、artifacts、文件内容、config 和 failedDirections

### Requirement: Workflow Skills 声明 Internal Subagents 约束

Workflow skill 模板的 instructions SHALL 以共享 Xirang Philosophy 开头；具体 authoring、canonical syntax 与 gate 规则 SHALL 由对应 workflow surface 声明，不得重新扩写项目哲学。Reviewer 与 Optimizer 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中。

#### Scenario: Explore skill 的 instructions 结构

- **WHEN** explore skill 被生成
- **THEN** instructions SHALL 包含 Xirang Philosophy、只读 workflow stage、Required References、Hard Rules、Required Context、Semantic Impact 与唯一 Brainstorming Checklist
- **AND** SHALL NOT 重复完整 brainstorming flow

#### Scenario: Apply skill 的 instructions 结构

- **WHEN** `getApplyChangeSkillTemplate()` 生成 apply skill instructions
- **THEN** instructions SHALL 以 Xirang Philosophy 开头，后接制品定义先行写作规则、Flow Outline 和 Implementation Discipline
- **AND** 每个流程步骤 SHALL 指向独立的 `.xirang/references/xirang-apply-step-<N>-<name>.md` 文件

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

### Requirement: Agent 制品定义先行写作

编写 Project Build source 的 workflow template SHALL 消费 Candidate contract 与 CLI command surface，且 SHALL NOT 重新引入 phase-specific bootstrap instructions。

#### Scenario: Build skill authoring

- **WHEN** 生成 `xirang-build`
- **THEN** SHALL 指导 Agent 询问 exploration scope 与 build starting point
- **AND** SHALL 指导 Agent 编写 `build.md` 与四分区 Candidate
- **AND** SHALL 指导 Agent 使用 `xirang candidate validate` diagnostics
- **AND** SHALL NOT 要求退役的 bootstrap instructions、scan/map files 或固定 subagent roles
