---
element: cap.ai.workflow-templates
---

# ai-workflow-templates Specification

## Purpose
Define the reviewed Agent Workflow Generation contract for 模板不内联 subagent 角色定义; Verify template 对 subagent 使用明确 delegation 指令; Phase 2 checkpoint state machine 使用表格格式; and 6 additional reviewed Requirements.
## Requirements
### Requirement: 模板不内联 subagent 角色定义
verify/apply/archive 模板 SHALL NOT 在模板 body 中内联 reviewer 或 optimizer 的完整角色定义、验证协议、判断标准或输出格式。这些内容归对应的 generated internal subagent artifact 所有。

模板 SHALL 保留以下 orchestration 职责的描述：证据包收集、subagent delegation、payload 校验、CLI 持久化、checkpoint 管理和写回执行。

#### Scenario: 模板内容精简
- **WHEN** 比较改进前后的 verify 模板
- **THEN** 改进后模板 SHALL NOT 包含 reviewer 的验证维度列表、severity 定义、或输出 JSON schema
- **AND** 改进后模板 SHALL 保留 evidence 包组装和 subagent delegation 指令

### Requirement: Verify template 对 subagent 使用明确 delegation 指令

`buildSubagentVerifyInstructions` function SHALL 将 Step 5 中的 prose description `"Spawn a clean-context reviewer subagent"` 替换为明确的 subagent delegation instructions。

delegation instructions SHALL 指定：

- delegate to clean-context generated `xirang-reviewer` subagent
- 传入显式 evidence bundle 结构
- 等待完整 reviewer payload
- MUST NOT 由主 agent 读取或内联 generated subagent artifact

`buildPhase2Step` function SHALL 将 `"Phase 2 Optimization Protocol"` 中的 prose description 替换为 optimizer subagent 的明确 delegation instructions，指向 generated `xirang-optimizer` subagent。

#### Scenario: Reviewer subagent step 具有明确 delegation 指令

- **WHEN** subagent-orchestrated verify prompt 到达 Step 5
- **THEN** prompt SHALL 明确要求 delegate to clean-context generated `xirang-reviewer` subagent
- **AND** prompt SHALL 包含 evidence bundle 字段列表
- **AND** SHALL NOT 只包含 `"Spawn a clean-context reviewer subagent"` 这类 prose
- **AND** SHALL NOT 指示主 agent 读取或内联 generated subagent artifact

#### Scenario: Optimizer subagent step 具有明确 delegation 指令

- **WHEN** verify prompt 到达 Phase 2 optimization step
- **THEN** prompt SHALL 明确要求 delegate to clean-context generated `xirang-optimizer` subagent
- **AND** SHALL 将 failedDirections 作为具名输入字段传入
- **AND** SHALL NOT 指示主 agent 读取或内联 generated subagent artifact

#### Scenario: Verify template 不包含工具 API 语法

- **WHEN** verify prompt 被组装
- **THEN** prompt SHALL NOT 包含 `Agent({`
- **AND** prompt SHALL NOT 包含 `TaskOutput({`
- **AND** prompt SHALL NOT 包含 `AskUserQuestion`

### Requirement: Phase 2 checkpoint state machine 使用表格格式

`buildPhase2Step` function SHALL 将 checkpoint state machine description 从连续 prose paragraph 重构为 Markdown table，映射 state、trigger 和 git operation。

`VERIFY_STATE_MACHINE_DIAGRAM` fragment SHALL 放在 Phase 2 section 开头，位于 checkpoint state machine table 之前。

`Hard rules` bullet list SHALL 跟在表格之后，列出不可协商的安全约束。

#### Scenario: Checkpoint state 以表格展示

- **WHEN** verify prompt 到达 Phase 2 checkpoint section
- **THEN** 四个 state（CREATED、BASELINE_RESTORED_FOR_RETRY、TERMINAL_ACCEPTED、TERMINAL_RESTORED）SHALL 出现在表格中
- **AND** 每一行 SHALL 显示 state name、trigger condition 和 git operation
- **AND** 表格前 SHALL 出现 `[Mode: Checkpoint]` label

#### Scenario: 简洁意识使用中性术语

- **WHEN** explore 指令描述简单性检查
- **THEN** 章节 SHALL 使用 "Simplicity Awareness" 标题
- **AND** 规则列表 SHALL 称为 "simplicity filter"
- **AND** SHALL 使用中性术语，不引用外部框架名称

### Requirement: Propose 模板使用统一 CLI 查询接口

Propose 模板 SHALL 使用 `xirang list --specs --json` 替代 deprecated 的 `xirang spec list --json`。

#### Scenario: Propose 模板包含正确的 spec 发现指令

- **WHEN** propose 模板被加载
- **THEN** SHALL 包含步骤指示 LLM 运行 `xirang list --specs --json` 获取现有 Specs 及其 singular element ownership
- **AND** MUST NOT 引用 `xirang spec list --json`
- **AND** SHALL 指示 LLM 交叉对比提议的新 elements 与已有 Specs，避免创建冗余 spec

#### Scenario: Propose 模板解析 element 字段

- **WHEN** propose 模板指示 LLM 使用 `xirang list --specs --json` 输出
- **THEN** SHALL 指示 LLM 从每个 Spec 条目的 `element` 字段提取 stable elementId 或 null
- **AND** SHALL 说明 `element` 字段是 singular stable elementId
- **AND** SHALL 说明无有效 binding 的 Spec 返回 null

### Requirement: Apply 模板使用统一 CLI 查询接口

Apply-change 模板 SHALL 使用 `xirang list --specs --json` 替代 deprecated 的 `xirang spec list --json`。

#### Scenario: Apply 模板包含正确的 spec 交叉检查指令

- **WHEN** apply-change 模板被加载
- **THEN** SHALL 包含步骤指示 LLM 在实现 element-owned behavior 前查询关联的所有 Specs
- **AND** SHALL 指示 LLM 运行 `xirang list --specs --json` 获取 element→Spec 映射
- **AND** MUST NOT 引用 `xirang spec list --json`
- **AND** SHALL 指示 LLM 确认是否需要同步更新 delta spec

### Requirement: 固定工作流模板集合
WorkflowManifestRegistry SHALL 恰好包含六个 user workflows：`propose`、`explore`、`apply`、`archive`、`build` 和 `snack`。Registry SHALL NOT 包含 `bootstrap-arch`。

#### Scenario: Registry 包含 Project Build
- **WHEN** 查询 workflow manifest
- **THEN** SHALL 包含 workflow ID `build`，其 skill name 与 directory 均为 `xirang-build`
- **AND** SHALL NOT 包含 `bootstrap-arch` 或 `xirang-bootstrap-arch`

### Requirement: 内部 subagent 引用替换内联 fragment

Verify/apply/archive 三个模板中 delegate to reviewer subagent 的步骤 SHALL delegate to `xirang-reviewer`。Delegate to optimizer subagent 的步骤 SHALL delegate to `xirang-optimizer`。Reviewer 与 Optimizer 的完整角色定义、判断标准和输出合同 SHALL 由对应 generated agent artifact 承载，workflow templates SHALL NOT 内联这些内容。

Explore SHALL NOT delegate impact discovery to an internal subagent。Explore template SHALL 通过 `xirang arch search` 与 `xirang arch impact` 获取 Formal Semantic Model context，并 SHALL 通过独立代码工具获取 implementation evidence。

#### Scenario: Apply 模板 delegate to reviewer agent

- **WHEN** apply 模板执行 Phase 1
- **THEN** 模板 SHALL 指示顶层 agent delegate to the clean-context `xirang-reviewer` agent with `context: "fresh"`
- **AND** agent 的审查维度和判定标准 SHALL 由 reviewer agent 自身 prompt 定义

#### Scenario: Apply 模板 Phase 2 的 optimizer agent

- **WHEN** apply 模板执行 Phase 2 优化循环
- **THEN** 模板 SHALL 指示主 agent delegate to the clean-context `xirang-optimizer` agent with `context: "fresh"`
- **AND** SHALL 传递 Phase 1 结果、artifacts、文件内容、config 和 failedDirections

### Requirement: Workflow Skills 声明 Internal Subagents 约束

Workflow skill 模板的 instructions SHALL 以共享 Xirang Philosophy 开头。具体 authoring、canonical syntax 与 gate 规则 SHALL 由对应 workflow surface 在需要处声明，不得重新扩写项目哲学。Reviewer 与 Optimizer 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中，而非在主 skill 模板中以独立协议节列出。Explore semantic impact behavior SHALL 直接引用 CLI command surface，而不是生成或引用第三个 internal subagent。

#### Scenario: Explore skill 的 instructions 结构

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill instructions
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
- **AND** SHALL 指导 Agent 编写 `build.md`、Candidate Architecture 与 Candidate Specs
- **AND** SHALL 指导 Agent 使用 `xirang candidate validate` diagnostics
- **AND** SHALL NOT 要求 `xirang bootstrap instructions`、scan/map files、evidence.yaml、domain-map 或固定 subagent roles

