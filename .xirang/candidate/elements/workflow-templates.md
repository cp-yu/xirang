---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、verify 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与 definition-first authoring。
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

Propose 与 Apply 模板 SHALL 通过 `xirang arch query`（按稳定 identity 查询 Element、其 owned Contracts 与 semantic relationships）与 `xirang arch search`（确定性检索 Formal Semantic Model）导航 Element Contracts，替代退役的 spec 命令族；需要校验全体 Element Contracts 时使用 `xirang validate --contracts`。

#### Scenario: Propose 模板包含正确的契约导航指令

- **WHEN** propose 模板被加载
- **THEN** SHALL 包含步骤指示 LLM 使用 `xirang arch search` 定位候选 Elements 并用 `xirang arch query <elementId> --relations --json` 读取其 owned Contracts（宿主 Element 单元承载的 Requirements）
- **AND** MUST NOT 引用退役的 spec 命令族或 list-based Contract 扫描

#### Scenario: Apply 模板包含正确的契约交叉检查指令

- **WHEN** apply-change 模板被加载
- **THEN** SHALL 包含步骤指示 LLM 在实现 element-owned behavior 前用 `xirang arch query` 查询关联 Element 的所有 Contracts
- **AND** MUST NOT 引用退役的 spec 命令族

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
- **THEN** instructions SHALL 以 Xirang Philosophy 开头，后接 definition-first authoring 规则、Flow Outline 和 Implementation Discipline
- **AND** 每个流程步骤 SHALL 指向独立的 `.xirang/references/xirang-apply-step-<N>-<name>.md` 文件
### Requirement: Agent definition-first authoring
编写 Project Build source 的 workflow template SHALL 消费 Candidate contract 与 CLI command surface，且 SHALL NOT 重新引入 phase-specific bootstrap instructions。

#### Scenario: Build skill authoring
- **WHEN** 生成 `xirang-build`
- **THEN** SHALL 指导 Agent 询问 exploration scope 与 build starting point
- **AND** SHALL 指导 Agent 编写 `build.md` 与四分区 Candidate
- **AND** SHALL 指导 Agent 使用 `xirang candidate validate` diagnostics
- **AND** SHALL NOT 要求退役的 bootstrap instructions、scan/map files 或固定 subagent roles

### Requirement: apply skill SHALL 读取架构上下文

Apply skill SHALL 指导 Agent 从 Project Root 开始读取 Target Semantic Model，并使用 `xirang arch query` 按稳定 identity 导航 abstraction/refinement hierarchy、owned Contracts 与 semantic relationships。

#### Scenario: 查询受影响 elements
- **WHEN** Agent 开始 apply task 且 task 涉及特定 element
- **THEN** SHALL 运行 `xirang arch query <elementId> --relations --depth 2`
- **AND** SHALL 理解 parent abstraction、child refinements 与 relevant relationships

#### Scenario: 从 Project Root 建立整体上下文
- **WHEN** task 的局部 element 缺少足够 context
- **THEN** Agent SHALL 沿 parent chain 回溯到足以解释 intent 的 abstraction
- **AND** SHALL 按需下钻而非一次加载整个模型
#### Scenario: 读取 element-owned Contracts
- **WHEN** query 返回 Contracts
- **THEN** Agent SHALL 读取 identity 索引派生的宿主 Element 单元（`elements/<identity>.md`）中的 Contract
- **AND** MUST NOT 依赖 `metadata`
#### Scenario: 语义优先的实现流程
- **WHEN** Agent 开始实现 task
- **THEN** SHALL 依次：
  1. 查询 affected elements 与 refinement context
  2. 读取 element-owned Contracts
  3. 解释 relevant semantic relationships
  4. 使用 CodeGraph 或 ACE/`rg`/`read` 获取 current implementation evidence
  5. 开始编码
- **AND** code evidence MUST NOT 静默覆盖 approved Semantic Delta
### Requirement: 统一加载协议与优雅降级

Core workflows SHALL 使用同一 Semantic Model loading protocol：从唯一 Project Root 读取 project-level intent，沿 containment 获取 abstraction/refinement context，通过 `xirang arch query` 获取 stable elements、owned Contracts 与 semantic relationships。当 Semantic Model 缺失或不完整时，只读 workflow MAY 使用部分 context 继续并声明不可用；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。

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
- **THEN** SHALL 定位 Project Root
- **AND** SHALL 按需读取 relevant parent/child hierarchy、Element Contracts 与 relations
- **AND** MUST NOT 使用 domain/capability 固定层级或 parallel YAML graph
#### Scenario: Code evidence 与 Semantic Model 分层
- **WHEN** workflow 需要 source path、symbol、import 或 call facts
- **THEN** SHALL 将其作为 current implementation evidence
- **AND** MUST NOT 将其自动提升为 element 或 relation
#### Scenario: Templates 使用同一 fragment
- **WHEN** 检查 generated workflow templates
- **THEN** relevant surfaces SHALL 复用同一 exported constant
- **AND** SHALL 使用一致 canonical terminology
