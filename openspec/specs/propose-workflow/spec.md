---
capabilities:
  - cap.ai.propose-smart-routing
  - cap.ai.workflow-templates
---
## Purpose

定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为。

## Requirements

### Requirement: Propose 创建完整 change 制品

系统 SHALL 提供 propose workflow，在不实施代码的前提下创建 change，并生成 `proposal.md`、delta Specs、`design.md`、`tasks.md` 与 `opsx-delta.yaml`。

#### Scenario: 创建新 change
- **WHEN** 用户调用 propose 并提供 change 名称或充分描述
- **THEN** workflow SHALL 派生 kebab-case 名称并执行 `openspec new change`
- **AND** SHALL 按 artifact dependency order 生成 apply 所需制品

#### Scenario: 已有 change
- **WHEN** 目标 change 已存在
- **THEN** workflow SHALL 询问继续现有 change 或使用新名称
- **AND** 非交互环境 SHALL fail fast 并要求明确选择

#### Scenario: Workflow stage 边界
- **WHEN** 生成 `openspec-propose` skill
- **THEN** 正文首个章节 SHALL 包含 `## Workflow Stage`
- **AND** SHALL 声明 Stage 为 `PROPOSE`、允许生成 change artifacts、禁止实施代码或修改现有项目文件

### Requirement: Propose onboarding UX

Propose SHALL 在首次使用时说明将生成的 artifacts 与下一步 apply handoff，并 SHALL 在生成过程中报告 artifact progress。

#### Scenario: 首次使用指引
- **WHEN** 用户调用 propose
- **THEN** workflow SHALL 说明将创建 proposal、design、Specs、tasks 与 OPSX delta
- **AND** SHALL 指示下一步使用 apply 实施

#### Scenario: Artifact progress
- **WHEN** workflow 完成一个 artifact
- **THEN** SHALL 报告该 artifact 已创建

### Requirement: Propose 生成完整 planning set

Propose SHALL 生成与既有 scaffold-plus-generation 流程等价的 change 目录与 planning artifacts；console output MAY 不同。

#### Scenario: 等价 artifact 结果
- **WHEN** 用户调用 propose
- **THEN** change directory 与 planning artifact set SHALL 完整创建

### Requirement: Propose smart routing

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`。没有 summary 时，SHALL 根据项目配置与输入细节判断直接生成或建议 explore。多 subsystem scope SHALL 被显式报告。

#### Scenario: 复用 Design Summary
- **WHEN** conversation 包含 explore 生成的 `Design Summary`
- **THEN** propose SHALL 说明正在复用该 summary
- **AND** SHALL 将其中的 architecture、testing、risk 与 trade-off decisions 路由到对应 artifacts

#### Scenario: Test Maintenance 分发
- **WHEN** Testing Strategy 包含过时测试信息
- **THEN** 过时原因 SHALL 进入 `design.md`
- **AND** 具体更新或删除操作 SHALL 进入 `tasks.md`

#### Scenario: One-time Verification 分发
- **WHEN** Testing Strategy 包含 `One-time Verification`
- **THEN** 项目 SHALL 生成 evidence-only Check 且 SHALL NOT 创建 persistent test file
- **AND** absence assertion SHALL 锚定 REMOVED Requirement

### Requirement: Proposal 分离 behavior 与 architecture source impact

Proposal SHALL 使用 canonical `## Source Impact`，分别声明 `### Behavior Source` 与 `### Architecture Source`。Behavior Source SHALL 使用 Spec ID；Architecture Source SHALL 使用 canonical OPSX node ID。Proposal MUST NOT 假设 Spec 与 OPSX capability 一一对应。

#### Scenario: Behavior Source 使用 Spec ID
- **WHEN** observable behavior 发生变化
- **THEN** `New Specs` 与 `Modified Specs` SHALL 使用 `specs/<spec-id>/spec.md` 对应的 Spec ID
- **AND** change-local Specs SHALL 只为这些 entries 创建或修改

#### Scenario: Architecture Source 使用 OPSX ID
- **WHEN** durable architecture 发生变化
- **THEN** Architecture Source SHALL 声明受影响的 OPSX nodes、responsibilities、ownership、boundaries 或 relation scope
- **AND** exact target-state operations SHALL 只定义在 `opsx-delta.yaml`

#### Scenario: Source 不变化
- **WHEN** 某类 source 经确认不变化
- **THEN** 对应 section SHALL 写 `None`
- **AND** unresolved impact MUST NOT 被表示为 `None`

#### Scenario: 缺失 capability coverage 不创建 Spec
- **WHEN** OPSX capability 不在任何 Spec frontmatter 的 `capabilities` 数组中
- **THEN** propose MUST NOT 仅凭该缺口创建 New Spec
- **AND** 只有 genuinely new observable behavior 才 SHALL 产生 New Spec

### Requirement: Propose 使用 definition-first authoring

每个 artifact 写入前，workflow SHALL 读取 resolved `definition`，使用 `content.includes` 与 `content.excludes` 判断内容归属，遵守 `writePolicy`，再执行 `instruction` 并填充 `template`。Definition、context、rules、config projection 与 Agent reasoning MUST NOT 被复制进 artifact。

#### Scenario: Specs 按 Behavior Source 生成
- **WHEN** propose 创建 change-local Specs
- **THEN** SHALL 只消费 proposal Behavior Source 中的 Spec IDs
- **AND** SHALL 使用返回的 definition 路由非 behavior 内容到 proposal、design、tasks 或 OPSX delta

#### Scenario: Specs boundary 不重复定义
- **WHEN** workflow 生成 Specs
- **THEN** SHALL 依赖 `openspec instructions specs --change "<name>" --json` 返回的 definition boundary
- **AND** SHALL NOT 在 workflow template 中维护独立的内容分类合同

#### Scenario: Scenario labels 程序化生成
- **WHEN** Agent 编写 Specs
- **THEN** Agent MUST NOT 手写 scenario operation labels
- **AND** validation 后 SHALL 执行 `openspec scenario-labels "<name>" --write`
- **AND** labels SHALL 保持 change-local review metadata
- **AND** sync/archive SHALL 消费并清理已有 labels，但 MUST NOT 生成 labels
- **AND** SHALL NOT 仅因程序化 labels 再运行一次 validate

### Requirement: Propose 在写 Specs 前检查 delta references

Propose SHALL 在写入 change-local Specs 前运行 `openspec check-delta`，传入目标 Spec IDs 与 planned `--added`、`--modified`、`--removed`、`--renamed-from` headers。Missing 与 Conflict 结果 SHALL 阻塞 spec authoring。

#### Scenario: Check-delta 先于写入
- **WHEN** workflow 准备写 delta Specs
- **THEN** `openspec check-delta` SHALL 在文件写入前执行
- **AND** post-write validation 仍 SHALL 保持 warning-only

#### Scenario: 简短 guidance 保留在主 Skill
- **WHEN** propose 没有既有 Specs authoring `referenceFiles` entry
- **THEN** `check-delta` guidance SHALL 简洁保留在主 Skill instructions
- **AND** SHALL NOT 仅为该命令 synopsis 新增 reference file

### Requirement: Propose 在 OPSX delta 前 reconcile architecture scope

Specs 与 `design.md` 完成后，propose SHALL 重新读取 proposal Architecture Source、design decisions、formal OPSX 与 implementation evidence，再生成 `opsx-delta.yaml`。

#### Scenario: Design 改变架构判断
- **WHEN** design 确认 durable architecture impact 与 proposal 初稿不同
- **THEN** workflow SHALL 更新 proposal Architecture Source
- **AND** exact reconciliation SHALL 写入 `opsx-delta.yaml`

#### Scenario: 无架构变化生成 canonical no-op
- **WHEN** Architecture Source 为 `None`
- **THEN** `opsx-delta.yaml` SHALL 只包含 `schema_version: 2`
- **AND** SHALL NOT 从 behavior changes 发明 OPSX operations

### Requirement: Propose 消费共享语言合同

Propose SHALL 消费 artifact instructions 的 config projection，使新写或修改的 natural-language prose 跟随 `proseLanguage`，同时保持 headings、normative keywords、BDD keywords、IDs、schema keys、paths、commands 与 code identifiers canonical。

#### Scenario: 不增加额外语言扫描
- **WHEN** artifact 已消费共享 language contract
- **THEN** workflow SHALL NOT 增加独立的 per-artifact English prose scan

### Requirement: Post-propose validation 保持 warning-only

Artifact 生成后，workflow SHALL 依次运行 Specs-scoped、OPSX-delta-scoped 与 full change validation。发现 warning 时 SHALL 只修复一轮并复检一次，最终总结 SHALL 区分 fixed、remaining 与 skipped checks。

#### Scenario: Staged validation
- **WHEN** artifacts 已生成
- **THEN** SHALL 运行 `openspec validate --change "<name>" --artifacts specs --json`
- **AND** SHALL 运行 `openspec validate --change "<name>" --artifacts opsx-delta --json`
- **AND** SHALL 运行 `openspec validate --change "<name>" --json`
- **AND** MUST NOT 在该检查中执行 `openspec sync`

#### Scenario: Lightweight auxiliary checks
- **WHEN** 检查 proposal、design 与 tasks
- **THEN** SHALL 使用当前 Schema instructions/templates 与 `validateTaskStructure`
- **AND** SHALL NOT 发明额外 semantic lint 或判断 Check 语义充分性

#### Scenario: Validation 不阻塞 propose handoff
- **WHEN** 单轮修复后仍有 warnings
- **THEN** summary SHALL 披露 remaining warnings
- **AND** workflow MAY 继续声明 apply-ready
