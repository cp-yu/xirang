## REMOVED Requirements

### Requirement: 内部 subagent skill 引用替换内联 fragment

**Reason**: Internal 执行角色不再以 `SKILL.md` 形态安装，workflow 模板不再 "invoke skill"，而是 "delegate to generated subagent"。旧 requirement 把 delegation 绑定到 skill invocation 管线，与新 internal subagent artifact generation framework 不一致。

**Migration**: 见 ADDED Requirement "内部 subagent 引用替换内联 fragment"。delegation 对象从 `openspec-reviewer` / `openspec-optimizer` skill 改为 generated `openspec-reviewer` / `openspec-optimizer` subagent artifact。

### Requirement: Workflow Skills 声明 Internal Skills 约束

**Reason**: "Internal Skills" 术语退役。Workflow skill 不再声明 "subagent-only skills"，而是声明 "internal subagents"。delegation 边界从 "不得读取 `.claude/skills/<name>/SKILL.md`" 改为 "不得读取或内联 generated subagent artifact"。

**Migration**: 见 ADDED Requirement "Workflow Skills 声明 Internal Subagents 约束"。Skill Delegation Protocol 标题保留，但内容指向 generated subagent artifact。

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: 内部 subagent 引用替换内联 fragment

verify/apply/archive 三个模板中 delegate to reviewer subagent 的步骤 SHALL delegate to 对应的 generated `openspec-reviewer` subagent。Delegate to optimizer subagent 的步骤 SHALL delegate to 对应的 generated `openspec-optimizer` subagent。

模板中的 delegation 指令 SHALL 使用 internal subagent 名引用（`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`），SHALL NOT 指示主 agent 读取或内联 generated subagent artifact，也 SHALL NOT 引用 `<toolDir>/skills/<name>/SKILL.md` 路径。

#### Scenario: Propose 模板包含 spec 发现指令

- **WHEN** propose 模板被加载
- **THEN** SHALL 包含步骤指示 LLM 运行 `openspec list --specs --json` 获取现有 specs 及其 capabilities 关联
- **AND** SHALL 指示 LLM 交叉对比提议的新 capabilities 与已有 specs，避免创建冗余 spec

#### Scenario: Apply 模板包含 spec 交叉检查指令

- **WHEN** apply-change 模板被加载
- **THEN** SHALL 包含步骤指示 LLM 在实现 capability 前查询关联的所有 specs
- **AND** SHALL 指示 LLM 运行 `openspec list --specs --json` 获取 cap→spec 映射
- **AND** SHALL 指示 LLM 确认是否需要同步更新 delta spec

#### Scenario: Verify 模板 delegate to reviewer subagent

- **WHEN** verify 模板执行 Phase 1
- **THEN** 模板 SHALL 指示顶层 agent delegate to clean-context generated `openspec-reviewer` subagent
- **AND** SHALL 同时传递显式证据包作为 subagent 的输入上下文
- **AND** SHALL NOT 内联输出验证协议、严重性阈值或证据标准的文本
- **AND** SHALL NOT 指示主 agent 读取 generated subagent artifact 文件

#### Scenario: Apply 模板 Phase 2 的 optimizer subagent

- **WHEN** apply 模板执行 Phase 2 优化循环
- **AND** 需要 delegate to optimizer subagent
- **THEN** 模板 SHALL 指示主 agent delegate to clean-context generated `openspec-optimizer` subagent
- **AND** SHALL 传递 Phase 1 结果、制品、文件内容、config 和 failedDirections

### Requirement: Workflow Skills 声明 Internal Subagents 约束

Workflow skill 模板（`openspec-explore` 和 `openspec-apply-change`）SHALL 在其 instructions 开头包含 "Skill Delegation Protocol" 部分，明确声明哪些角色是 internal subagents，主 agent MUST NOT 直接读取或内联其 generated artifact。

#### Scenario: Explore skill 声明 internal subagents 约束

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill instructions
- **THEN** instructions SHALL 包含 "Skill Delegation Protocol" 部分
- **AND** SHALL 至少列出 `openspec-impact-sweeper` 为 internal subagent
- **AND** MAY 列出 `openspec-reviewer` 和 `openspec-optimizer`（如果 explore 需要避免读取它们）
- **AND** SHALL 包含明确的禁止指令："**Never** read or inline the generated `openspec-impact-sweeper` subagent artifact"
- **AND** SHALL NOT 引用 `<toolDir>/skills/openspec-impact-sweeper/SKILL.md` 路径

#### Scenario: Apply skill 声明所有 internal subagents 约束

- **WHEN** `getApplyChangeSkillTemplate()` 生成 apply skill instructions
- **THEN** instructions SHALL 包含 "Skill Delegation Protocol" 部分
- **AND** SHALL 列出所有三个 internal subagents：
  - `openspec-impact-sweeper`
  - `openspec-reviewer`
  - `openspec-optimizer`
- **AND** SHALL 包含明确的禁止指令："**Never** read or inline the generated `openspec-impact-sweeper`, `openspec-reviewer`, or `openspec-optimizer` subagent artifact"
- **AND** SHALL NOT 引用任何 `<toolDir>/skills/<name>/SKILL.md` 形式的 internal 路径

#### Scenario: 约束格式一致

- **WHEN** workflow skill 包含 Skill Delegation Protocol
- **THEN** 格式 SHALL 为：
  ```markdown
  ## Skill Delegation Protocol

  **Internal Subagents** — The following roles are internal subagents and MUST NOT be read or inlined directly by this agent:
  - `<name>` — Delegate via subagent tool; main agent MUST NOT read the generated artifact

  **Never** read or inline the generated `<name>` subagent artifact.
  ```
- **AND** SHALL 位于 instructions 开头，在首个 "Hard Rules" 或 "Flow" 部分之前

#### Scenario: 约束在模板源代码中定义

- **WHEN** 开发者需要修改 subagent delegation 约束
- **THEN** 应修改以下文件：
  - `src/core/templates/workflows/explore.ts` 中的 `getExploreSkillTemplate()`
  - `src/core/templates/workflows/apply-change.ts` 中的 `getApplyChangeSkillTemplate()`
- **AND** 运行 `openspec update` 重新生成 `<toolDir>/skills/` 下的 workflow skill 文件与 `<toolDir>/agents/` 下的 subagent artifact 文件
