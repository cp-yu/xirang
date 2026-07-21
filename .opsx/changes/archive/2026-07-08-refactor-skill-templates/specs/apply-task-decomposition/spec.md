## MODIFIED Requirements

### Requirement: Master agent 直接执行 pending task

Apply 阶段的 Master agent SHALL 读取 `tasks.md` 中的 pending task，并在当前上下文中按 Check 执行严格 TDD、证据收集和任务勾选。实现 specs 未覆盖的细节时，agent SHALL 按"删除 > 标准库 > 平台原生 > 已安装依赖 > 直接表达式 > 最小实现"优先顺序选择方案。Agent SHALL NOT 质疑或简化 specs 明确要求的行为。

Apply skill 的 `Implementation Discipline` 节 SHALL 以最多 8 条精简条目直接描述以上纪律，每条不超过两行。每个流程步骤（Preparation、Pre-flight Scan、Branch Isolation、Phase 1/2/3 verification、Output）SHALL 指向独立的 `openspec/references/openspec-apply-step-<N>-<name>.md` reference 文件，skill body 中该步骤只提供一行指引和文件路径。

Subagent 委托 SHALL 使用 "delegate to the clean-context `openspec-reviewer` agent" 表述。Skill instructions 以 OPSX Compilation Philosophy 开头，后接 Flow Outline。

#### Scenario: [MODIFIED] 实现纪律为精简条目

- **WHEN** apply skill 被加载
- **THEN** skill SHALL 以 `Implementation Discipline` 节列出编码纪律
- **AND** 每条 SHALL 使用中性术语，不使用外部框架名称

#### Scenario: [MODIFIED] 流程步骤指向 reference

- **WHEN** apply agent 执行到某个流程步骤
- **THEN** agent SHALL 读取对应的 `openspec/references/openspec-apply-step-<N>-<name>.md`
- **AND** skill body 中该步骤 SHALL 只提供一行描述和文件路径
