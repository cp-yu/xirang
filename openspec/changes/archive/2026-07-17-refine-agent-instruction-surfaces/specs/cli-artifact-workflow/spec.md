## ADDED Requirements

### Requirement: Artifact instruction state rendering

`openspec instructions <artifact>` SHALL 在 text 与 JSON modes 投影同一 artifact current state 语义，并 SHALL 保持 definition-first 展示顺序。Renderer SHALL 将 definition、dependencies/current state、instruction 与 template 作为独立 sections，MUST NOT 将文件内容嵌入 current state。

#### Scenario: JSON 输出结构化 current state
- **WHEN** user 运行 `openspec instructions <artifact> --change <id> --json`
- **THEN** output SHALL 包含 `currentState.completed` 与 `currentState.outputs`
- **AND** artifact 定义 completion marker 时 SHALL 包含 marker path 与 presence
- **AND** outputs 与 marker SHALL 只以路径和状态表示

#### Scenario: Text 输出 current state
- **WHEN** user 运行 `openspec instructions <artifact> --change <id>`
- **THEN** output SHALL 在 `<instruction>` 前包含独立 `<current_state>` section
- **AND** SHALL 显示 completion 状态、当前 output paths 与可选 completion marker 状态
- **AND** 无 output 时 SHALL 明确表示当前不存在 artifact outputs

### Requirement: Apply blocker prerequisite handoff

`openspec instructions apply` SHALL 在 Apply prerequisites 未满足时返回 schema-aware prerequisite workflow，而 MUST NOT 指示 Apply workflow 创建自身缺失的输入。Spec-driven schema SHALL hand off 到 Propose；Bootstrap schema SHALL hand off 到 Bootstrap。

#### Scenario: Spec-driven missing artifacts 返回 Propose
- **WHEN** spec-driven change 缺少 apply-required artifact、tracking file 不存在或 tracking file 无可执行 tasks
- **THEN** Apply state SHALL 为 blocked
- **AND** instruction SHALL 指示返回 Propose workflow reconcile 缺失 prerequisite
- **AND** MUST NOT 指示 `openspec-apply-change` 创建缺失 artifact

#### Scenario: Bootstrap missing artifacts 返回 Bootstrap
- **WHEN** bootstrap schema 的 apply-required artifact 缺失
- **THEN** Apply state SHALL 为 blocked
- **AND** JSON 与 text guidance SHALL 指示返回 Bootstrap workflow
- **AND** MUST NOT 将 Propose 作为 Bootstrap prerequisite owner
