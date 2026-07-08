# ai-workflow-templates Specification

## Purpose
此规约记录变更 add-subagent-skills 引入的行为，请在后续同步或归档前补全正式 Purpose。
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

- delegate to clean-context generated `openspec-reviewer` subagent
- 传入显式 evidence bundle 结构
- 等待完整 reviewer payload
- MUST NOT 由主 agent 读取或内联 generated subagent artifact

`buildPhase2Step` function SHALL 将 `"Phase 2 Optimization Protocol"` 中的 prose description 替换为 optimizer subagent 的明确 delegation instructions，指向 generated `openspec-optimizer` subagent。

#### Scenario: Reviewer subagent step 具有明确 delegation 指令

- **WHEN** subagent-orchestrated verify prompt 到达 Step 5
- **THEN** prompt SHALL 明确要求 delegate to clean-context generated `openspec-reviewer` subagent
- **AND** prompt SHALL 包含 evidence bundle 字段列表
- **AND** SHALL NOT 只包含 `"Spawn a clean-context reviewer subagent"` 这类 prose
- **AND** SHALL NOT 指示主 agent 读取或内联 generated subagent artifact

#### Scenario: Optimizer subagent step 具有明确 delegation 指令

- **WHEN** verify prompt 到达 Phase 2 optimization step
- **THEN** prompt SHALL 明确要求 delegate to clean-context generated `openspec-optimizer` subagent
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

### Requirement: Explore invokes impact sweeper

`openspec-explore` SHALL invoke `openspec-impact-sweeper` agent when exploration reaches a code-change concept that needs impact discovery, a user term does not clearly map to project terminology and affects scope, or the agent is preparing to say the discussion is ready for proposal/change artifacts.

Explore agent SHALL 将 sweeper 视为可复用方法，在一次对话中可以多次调用，每次调用只处理一个 concept。Explore agent SHALL 在向用户总结影响面发现前读取 sweeper 返回的 JSON report path。Sweeper report 写入是内部 agent 例外，SHALL NOT 赋予 main explore agent 创建或修改项目文件、OpenSpec 制品的权限。

#### Scenario: 委托使用 agent 表述

- **WHEN** explore 指令描述 sweeper 调用
- **THEN** 指令 SHALL 使用 "Delegate to the `openspec-impact-sweeper` agent" 表述
- **AND** SHALL 传递 `projectRoot`、`concept`、`optionalChangeName`、`knownUserTerms`、`focus` 参数

#### Scenario: 简洁意识使用中性术语

- **WHEN** explore 指令描述简单性检查
- **THEN** 章节 SHALL 使用 "Simplicity Awareness" 标题
- **AND** 规则列表 SHALL 称为 "simplicity filter"
- **AND** SHALL 使用中性术语，不引用外部框架名称

### Requirement: Impact sweeper report contract
`openspec-impact-sweeper` SHALL accept lightweight location and concept input from the caller: `projectRoot`, `concept`, optional `optionalChangeName`, optional `knownUserTerms`, and optional `focus`.

The sweeper SHALL write a JSON report under `openspec/sweeper/impact-sweep-<english-project-term-slug>.json` relative to `projectRoot`, overwriting the same concept path on repeat runs. The JSON report SHALL use this schema shape:

```json
{
  "concept": "string",
  "projectRoot": "string",
  "termMappings": [
    {
      "userTerm": "string",
      "projectTerms": ["string"],
      "evidence": ["string"]
    }
  ],
  "opsx": {
    "nodes": [
      {
        "id": "string",
        "reason": "string"
      }
    ],
    "relationsExpanded": [
      {
        "from": "string",
        "to": "string",
        "type": "string"
      }
    ],
    "coverageGaps": ["string"]
  },
  "mustChange": [
    {
      "target": "string",
      "reason": "string",
      "evidence": ["string"]
    }
  ],
  "mustCheck": [
    {
      "target": "string",
      "reason": "string",
      "evidence": ["string"]
    }
  ],
  "coverageGaps": ["string"],
  "questions": ["string"]
}
```

The sweeper response SHALL contain only the report path on success. The report content MAY use natural language in item values, but the JSON field names SHALL remain canonical.

#### Scenario: Sweeper writes project report
- **WHEN** `openspec-impact-sweeper` completes an impact sweep for concept `explore impact sweep`
- **THEN** it SHALL write `openspec/sweeper/impact-sweep-explore-impact-sweep.json`
- **AND** SHALL return that path to the caller
- **AND** SHALL not emit a separate summary

#### Scenario: Sweeper prepares ignored report directory
- **WHEN** `openspec/sweeper/` does not exist
- **THEN** the sweeper SHALL create it
- **AND** SHALL ensure `openspec/sweeper/.gitignore` exists with content that ignores reports while keeping `.gitignore`
- **AND** SHALL NOT modify an existing `.gitignore`

### Requirement: Impact sweeper evidence collection
`openspec-impact-sweeper` SHALL ground impact discovery in OPSX before broad code search. It SHALL obtain OPSX node data through a single batch invocation of `openspec opsx query <node-id...> --json` covering all plausible node IDs, defaulting to `--depth 1` and using `--depth 2` only when a first-hop node is shared infrastructure, cross-domain, or code search shows outward runtime use. It SHALL NOT read `openspec/project.opsx.yaml`, `openspec/project.opsx.code-map.yaml`, or `openspec/project.opsx.relations.yaml` directly.

The sweeper SHALL use `git ls-files` as the repository search boundary when available and SHALL exclude `openspec/changes/archive/**`. It SHALL perform repo-wide reverse search for mapped project terms, exported symbols, workflow/skill names, command names, config keys, template fragment names, and path references. It SHALL not rely only on OPSX code-map paths.

#### Scenario: OPSX first then reverse search
- **WHEN** the concept maps to an OPSX capability
- **THEN** the sweeper SHALL read matching OPSX node intent, code-map refs, and direct relations from the batch query output
- **AND** SHALL perform repo-wide reverse search for key mapped project terms and symbols
- **AND** SHALL classify relevant targets into `mustChange`, `mustCheck`, `coverageGaps`, or `questions`

#### Scenario: depth 展开判据
- **WHEN** 批量查询返回的一跳邻居属于共享基础设施、跨域节点，或代码搜索显示存在外向运行时使用
- **THEN** the sweeper SHALL 改用 `--depth 2` 重新批量查询以覆盖二跳邻居
- **AND** MUST NOT 通过逐节点连环 `openspec opsx query` 调用模拟多跳展开

#### Scenario: Multiple term mappings are explored
- **WHEN** a user term maps plausibly to multiple project terms
- **THEN** the sweeper SHALL search all plausible mappings
- **AND** SHALL record mappings and evidence in `termMappings`
- **AND** SHALL put scope-changing ambiguity into `questions`

#### Scenario: Optional change artifacts are scoped
- **WHEN** `optionalChangeName` is provided
- **THEN** the sweeper SHALL read only that change's proposal, specs, design, tasks, and opsx-delta if they exist
- **AND** SHALL NOT inspect unrelated active changes

### Requirement: Impact sweeper write and execution boundaries
`openspec-impact-sweeper` SHALL perform read-only analysis except for its report directory writes. It MAY create `openspec/sweeper/`, create `openspec/sweeper/.gitignore` if missing, and write or overwrite its JSON report. It SHALL NOT modify source files, specs, change artifacts, OPSX files, config, package files, tests, or generated workflow files.

The sweeper SHALL NOT run tests, builds, installs, `git diff`, `git status`, or `git log` as impact evidence. It MAY use `git ls-files`, file reads, and text search. Reports under `openspec/sweeper/` SHALL be treated as working notes, not proposal, design, tasks, specs, OPSX delta, sync input, or archive input.

#### Scenario: No tests or git diff
- **WHEN** the sweeper needs impact evidence
- **THEN** it SHALL use OPSX files, main specs, optional selected change artifacts, git tracked file listing, and text search
- **AND** SHALL NOT run `npm test`, build commands, `git diff`, `git status`, or `git log`

#### Scenario: Only sweeper report files are written
- **WHEN** the sweeper writes output
- **THEN** it SHALL write only under `openspec/sweeper/`
- **AND** SHALL NOT modify any formal OpenSpec artifact or implementation file

### Requirement: Propose 模板使用统一 CLI 查询接口

Propose 模板 SHALL 使用 `openspec list --specs --json` 替代 deprecated 的 `openspec spec list --json`。

#### Scenario: Propose 模板包含正确的 spec 发现指令

- **WHEN** propose 模板被加载
- **THEN** SHALL 包含步骤指示 LLM 运行 `openspec list --specs --json` 获取现有 specs 及其 capabilities 关联
- **AND** MUST NOT 引用 `openspec spec list --json`
- **AND** SHALL 指示 LLM 交叉对比提议的新 capabilities 与已有 specs，避免创建冗余 spec

#### Scenario: Propose 模板解析 capabilities 字段

- **WHEN** propose 模板指示 LLM 使用 `openspec list --specs --json` 输出
- **THEN** SHALL 指示 LLM 从每个 spec 条目的 `capabilities` 字段提取 cap ID 列表
- **AND** SHALL 说明 `capabilities` 字段是字符串数组
- **AND** SHALL 说明无 frontmatter 的 spec 返回空数组

### Requirement: Apply 模板使用统一 CLI 查询接口

Apply-change 模板 SHALL 使用 `openspec list --specs --json` 替代 deprecated 的 `openspec spec list --json`。

#### Scenario: Apply 模板包含正确的 spec 交叉检查指令

- **WHEN** apply-change 模板被加载
- **THEN** SHALL 包含步骤指示 LLM 在实现 capability 前查询关联的所有 specs
- **AND** SHALL 指示 LLM 运行 `openspec list --specs --json` 获取 cap→spec 映射
- **AND** MUST NOT 引用 `openspec spec list --json`
- **AND** SHALL 指示 LLM 确认是否需要同步更新 delta spec

### Requirement: 固定工作流模板集合

工作流模板注册表 SHALL 包含固定的 5 个核心工作流模板定义。

#### Scenario: 注册表包含固定的 5 个工作流

- **WHEN** 查询工作流模板注册表
- **THEN** 注册表 SHALL 包含以下 5 个工作流：
  - `propose`
  - `explore`
  - `apply`
  - `archive`
  - `bootstrap-opsx`
- **AND** 注册表 SHALL NOT 包含其他工作流

#### Scenario: 已删除工作流不在注册表中

- **WHEN** 查询工作流模板注册表
- **THEN** 注册表 SHALL NOT 包含以下工作流：
  - `new`
  - `continue`
  - `ff`
  - `verify`
  - `sync`
  - `bulk-archive`
  - `onboard`

### Requirement: 内部 subagent 引用替换内联 fragment

Verify/apply/archive 三个模板中 delegate to reviewer subagent 的步骤 SHALL delegate to 对应的 `openspec-reviewer` agent。Delegate to optimizer subagent 的步骤 SHALL delegate to 对应的 `openspec-optimizer` agent。

模板中的 delegation 指令 SHALL 使用 agent 名引用（`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`）。Subagent 由 agent 文件承载，模板 SHALL 引用 `openspec/references/` 路径下的 reference 文件获取步骤详情。

#### Scenario: Apply 模板 delegate to reviewer agent

- **WHEN** apply 模板执行 Phase 1
- **THEN** 模板 SHALL 指示顶层 agent delegate to the clean-context `openspec-reviewer` agent with `context: "fresh"`
- **AND** agent 的审查维度和判定标准 SHALL 由 reviewer agent 自身 prompt 定义

#### Scenario: Apply 模板 Phase 2 的 optimizer agent

- **WHEN** apply 模板执行 Phase 2 优化循环
- **THEN** 模板 SHALL 指示主 agent delegate to the clean-context `openspec-optimizer` agent with `context: "fresh"`
- **AND** SHALL 传递 Phase 1 结果、制品、文件内容、config 和 failedDirections

### Requirement: Workflow Skills 声明 Internal Subagents 约束

Workflow skill 模板的 instructions SHALL 以 OPSX Compilation Philosophy 开头，直接后接 Flow Outline 或核心规则。Subagent 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中，而非在主 skill 模板中以独立协议节列出。

#### Scenario: Explore skill 的 instructions 结构

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill instructions
- **THEN** instructions SHALL 以 OPSX Compilation Philosophy 开头，后接 Hard Rules、Required Context、Mandatory Exploration Flow
- **AND** impact sweeper 的调用描述 SHALL 使用 "Delegate to the `openspec-impact-sweeper` agent" 表述
- **AND** sweeper 调用参数 SHALL 包含 `projectRoot`、`concept`、`optionalChangeName`、`knownUserTerms`、`focus`

#### Scenario: Apply skill 的 instructions 结构

- **WHEN** `getApplyChangeSkillTemplate()` 生成 apply skill instructions
- **THEN** instructions SHALL 以 OPSX Compilation Philosophy 开头，后接 Flow Outline 和 Implementation Discipline
- **AND** 每个流程步骤 SHALL 指向独立的 `openspec/references/openspec-apply-step-<N>-<name>.md` 文件

