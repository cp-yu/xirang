---
element: project.root
---

## MODIFIED Requirements

### Requirement: Independent product and durable workspace
OPSX SHALL 通过唯一 `opsx` CLI 与 `.opsx` workspace 独立运行。Setup、Project Build、Candidate、formal source 与 history SHALL 具有明确边界，且不得存在 migration 或 history fallback semantic stores。

#### Scenario: 项目 setup 或 build
- **WHEN** OPSX 创建 setup skeleton 或 Agent 构建 Candidate
- **THEN** generated workflows SHALL 使用当前 OPSX identity 和统一 Semantic Model
- **AND** retired bootstrap/migration workspaces SHALL 仅归档为 history evidence
- **AND** runtime SHALL NOT 消费这些 retired inputs

### Requirement: Evidence-gated source promotion
Candidate graph、contract modules 与本次用户要求 SHALL 在 `.opsx/candidate/` 中保持隔离，直到 canonical representation、identities、bindings、policies、relationships、platform behavior 和 rollback path 通过 validation，且用户明确授权当前 `reviewDigest`。

#### Scenario: Candidate 有 unresolved gap
- **WHEN** required validation 或 human decision 缺失
- **THEN** formal `.opsx/architecture/` 与 `.opsx/specs/` SHALL 保持不变

#### Scenario: 用户确认后 Candidate 改变
- **WHEN** `build.md` 或 Candidate source 在用户确认后发生变化
- **THEN** prior authorization SHALL 失效
- **AND** promotion SHALL 要求新的 valid `reviewDigest`

#### Scenario: Promotion 成功
- **WHEN** confirmed digest 仍新鲜且 atomic transaction 完成
- **THEN** formal Architecture + Specs SHALL 被完整替换
- **AND** previous formal source SHALL 保存在 `.opsx/history/`
