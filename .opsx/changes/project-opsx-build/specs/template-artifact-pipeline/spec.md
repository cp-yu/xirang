---
element: project.root/domain.ai_integration/cap.ai.workflow-generation
---

## MODIFIED Requirements

### Requirement: Canonical Workflow Manifest
canonical workflow manifest SHALL 是生成 skill artifacts 的唯一 source of truth，并 SHALL 包含六个 user workflows：`propose`、`explore`、`apply`、`archive`、`build` 和 `snack`。

#### Scenario: 仅注册一次 Project Build
- **WHEN** 生成 Project Build workflow
- **THEN** manifest entry SHALL 使用 workflow ID `build`、skill name `opsx-build` 和 skill directory `opsx-build`
- **AND** 所有 tool projections SHALL 从该 entry 派生
- **AND** manifest SHALL NOT 包含 `bootstrap-arch`

### Requirement: Shared Artifact Sync Engine
Setup 和 update SHALL 使用 shared artifact sync engine 生成 `opsx-build` 及相关 managed artifacts，并 SHALL NOT 生成第二套 bootstrap command surface。

#### Scenario: Setup/update 保持 parity
- **WHEN** setup 或 update 写入 workflow skills
- **THEN** 两者 SHALL 使用同一个 manifest-derived engine
- **AND** generated output SHALL 收敛到六个 fixed workflow set
