---
element: project.root/domain.ai_integration/cap.ai.workflow-generation
---

## MODIFIED Requirements

### Requirement: Project Structure
OPSX 项目 SHALL 使用一致目录保存 formal Semantic Model、change-local Semantic Deltas、一个可选 active Candidate 与 durable build history。

#### Scenario: 初始化项目结构
- **WHEN** `opsx setup` 初始化项目
- **THEN** SHALL 创建 formal `architecture/`、`specs/`、`changes/`、`references/` 与 `config.yaml`
- **AND** Project Build SHALL 只在 `.opsx/candidate/` 编写待提升的 `build.md`、Architecture 和 Specs
- **AND** successful promotion SHALL 在 `.opsx/history/builds/` 保存 previous formal source
- **AND** graph 与 contract directories SHALL 始终被解释为一个 OPSX Semantic Model

### Requirement: Verb–Noun CLI Command Structure
OPSX CLI SHALL 优先使用动作明确的顶层 commands，但 MAY 为具有内聚 lifecycle 的 durable resource 提供稳定 noun namespace。

#### Scenario: Setup 使用动词 command
- **WHEN** 用户创建或刷新 project setup
- **THEN** SHALL 使用 `opsx setup`
- **AND** SHALL NOT 保留 `opsx init` alias

#### Scenario: Candidate 使用 resource namespace
- **WHEN** 用户管理 active Semantic Model Candidate
- **THEN** SHALL 使用 `opsx candidate init|status|validate|promote`
- **AND** noun namespace SHALL 只聚合该 resource 的内聚 lifecycle operations

#### Scenario: 退役 command family
- **WHEN** 用户请求 `opsx bootstrap` 或 `opsx migrate`
- **THEN** CLI SHALL 报告 command 不存在
- **AND** SHALL NOT 自动转发到 Project Build
