## REMOVED Requirements

### Requirement: TTY 环境下的模式提问
**Reason**: Project Build 不再提供 full、opsx-first 或 refresh mode selection。

**Migration**: `opsx-build` 询问 exploration range 和 Candidate starting point。

### Requirement: 模式说明必须准确反映合同
**Reason**: Mode-specific generation contracts 被删除。

**Migration**: 使用 Project Build 与 Candidate CLI contracts。

### Requirement: 非交互环境下 fail fast
**Reason**: 被删除的 bootstrap mode prompt 不再存在。

**Migration**: Non-interactive Build caller 必须提供显式 Candidate init options 和 user-approved constraints。

### Requirement: Retained workspace restart SHALL require explicit user intent
**Reason**: Retained `.opsx/bootstrap/` phase workspace 被删除。

**Migration**: Active `.opsx/candidate/` restart 继续要求 explicit user intent。

### Requirement: Bootstrap guidance SHALL explain projection-driven authoring rules
**Reason**: Phase projection 不再拥有 Candidate authoring guidance。

**Migration**: Generated `opsx-build` guidance 说明 Agent authoring 与 canonical CLI diagnostics。

### Requirement: Granularity init state SHALL be explicit
**Reason**: coarse/fine granularity 被删除；Agent 独立判断 element 与 Spec boundaries。

**Migration**: Candidate validation 强制 singular ownership 与 required-contract closure。

### Requirement: Init SHALL expose a public scan transition
**Reason**: Agent exploration 不再表示为 CLI phase transition。

**Migration**: 运行 `opsx candidate init`，编写 Candidate，再运行 `opsx candidate validate`。
