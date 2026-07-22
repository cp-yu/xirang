---
element: project.root/domain.architecture/cap.architecture.semantic-model
---

# opsx-impact-sweeper-architecture Specification

## Purpose
Define the reviewed Versioned Semantic Model contract for Impact sweeper SHALL 使用 LikeC4 导航架构.

## Requirements
### Requirement: Impact sweeper SHALL 使用 LikeC4 导航架构

Sweeper SHALL 使用 `opsx arch query` 导航 OPSX Semantic Model，并 SHALL 将 stable elements、abstraction/refinement hierarchy、Element Contracts 与 semantic relationships 作为 impact context。

#### Scenario: 查询相关 elements
- **WHEN** sweeper 分析 concept impact
- **THEN** SHALL 以 known `elementId` 查询
- **AND** SHALL 使用 `--relations --depth 2` 展开 hierarchy 与 relation context
- **AND** MUST NOT 假设 domain/capability 固定层级

#### Scenario: Nesting 不自动证明 impact
- **WHEN** query 返回 parent 或 child context
- **THEN** sweeper SHALL 将其解释为 abstraction/refinement navigation
- **AND** MUST NOT 仅因相邻就自动判定 mustChange

#### Scenario: 报告使用 stable elementIds
- **WHEN** sweeper 生成 report
- **THEN** SHALL 使用 canonical `elementId`
- **AND** MAY 附带当前 FQN 作为 source navigation evidence
- **AND** MUST NOT 使用 kind-specific capability ID 作为通用 identity

#### Scenario: Spec impact 通过 owner binding定位
- **WHEN** report 引用 Element Contract
- **THEN** SHALL 通过 registry 的 singular binding 定位 Specs
- **AND** MUST NOT 使用 `metadata.specs` 或多 capability mapping
