## MODIFIED Requirements

### Requirement: 内部 subagent 引用替换内联 fragment

Verify/apply/archive 三个模板中 delegate to reviewer subagent 的步骤 SHALL delegate to 对应的 `openspec-reviewer` agent。Delegate to optimizer subagent 的步骤 SHALL delegate to 对应的 `openspec-optimizer` agent。

模板中的 delegation 指令 SHALL 使用 agent 名引用（`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`）。Subagent 由 agent 文件承载，模板 SHALL 引用 `openspec/references/` 路径下的 reference 文件获取步骤详情。

#### Scenario: [MODIFIED] Apply 模板 delegate to reviewer agent

- **WHEN** apply 模板执行 Phase 1
- **THEN** 模板 SHALL 指示顶层 agent delegate to the clean-context `openspec-reviewer` agent with `context: "fresh"`
- **AND** agent 的审查维度和判定标准 SHALL 由 reviewer agent 自身 prompt 定义

#### Scenario: [MODIFIED] Apply 模板 Phase 2 的 optimizer agent

- **WHEN** apply 模板执行 Phase 2 优化循环
- **THEN** 模板 SHALL 指示主 agent delegate to the clean-context `openspec-optimizer` agent with `context: "fresh"`
- **AND** SHALL 传递 Phase 1 结果、制品、文件内容、config 和 failedDirections

### Requirement: Workflow Skills 声明 Internal Subagents 约束

Workflow skill 模板的 instructions SHALL 以 OPSX Compilation Philosophy 开头，直接后接 Flow Outline 或核心规则。Subagent 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中，而非在主 skill 模板中以独立协议节列出。

#### Scenario: [MODIFIED] Explore skill 的 instructions 结构

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill instructions
- **THEN** instructions SHALL 以 OPSX Compilation Philosophy 开头，后接 Hard Rules、Required Context、Mandatory Exploration Flow
- **AND** impact sweeper 的调用描述 SHALL 使用 "Delegate to the `openspec-impact-sweeper` agent" 表述
- **AND** sweeper 调用参数 SHALL 包含 `projectRoot`、`concept`、`optionalChangeName`、`knownUserTerms`、`focus`

#### Scenario: [MODIFIED] Apply skill 的 instructions 结构

- **WHEN** `getApplyChangeSkillTemplate()` 生成 apply skill instructions
- **THEN** instructions SHALL 以 OPSX Compilation Philosophy 开头，后接 Flow Outline 和 Implementation Discipline
- **AND** 每个流程步骤 SHALL 指向独立的 `openspec/references/openspec-apply-step-<N>-<name>.md` 文件

### Requirement: Explore invokes impact sweeper

`openspec-explore` SHALL invoke `openspec-impact-sweeper` agent when exploration reaches a code-change concept that needs impact discovery, a user term does not clearly map to project terminology and affects scope, or the agent is preparing to say the discussion is ready for proposal/change artifacts.

Explore agent SHALL 将 sweeper 视为可复用方法，在一次对话中可以多次调用，每次调用只处理一个 concept。Explore agent SHALL 在向用户总结影响面发现前读取 sweeper 返回的 JSON report path。Sweeper report 写入是内部 agent 例外，SHALL NOT 赋予 main explore agent 创建或修改项目文件、OpenSpec 制品的权限。

#### Scenario: [MODIFIED] 委托使用 agent 表述

- **WHEN** explore 指令描述 sweeper 调用
- **THEN** 指令 SHALL 使用 "Delegate to the `openspec-impact-sweeper` agent" 表述
- **AND** SHALL 传递 `projectRoot`、`concept`、`optionalChangeName`、`knownUserTerms`、`focus` 参数

#### Scenario: [MODIFIED] 简洁意识使用中性术语

- **WHEN** explore 指令描述简单性检查
- **THEN** 章节 SHALL 使用 "Simplicity Awareness" 标题
- **AND** 规则列表 SHALL 称为 "simplicity filter"
- **AND** SHALL 使用中性术语，不引用外部框架名称
