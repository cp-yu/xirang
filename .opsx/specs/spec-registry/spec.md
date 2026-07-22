---
element: project.root/domain.validation/cap.validation.semantic-contract
---

# spec-registry Specification

## Purpose
Define the reviewed Semantic Contract Validation contract for 运行时构建 cap↔spec 双向映射; 提供查询 API; Registry 扫描使用跨平台路径.

## Requirements
### Requirement: 运行时构建 cap↔spec 双向映射

系统 SHALL 扫描 `.opsx/specs/*/spec.md` 的 singular `element` frontmatter，构建 `elementToSpecs` 与 `specToElement` 派生 registry。一个 element MAY 对应多个 Specs；每个 Spec SHALL 最多产生一个 owner entry。

#### Scenario: 构建 one-to-many mapping
- **WHEN** `specs/payment-auth/spec.md` 与 `specs/payment-errors/spec.md` 均声明 `element: payment.authorize`
- **THEN** `elementToSpecs.get("payment.authorize")` SHALL 返回按 Spec ID 排序的两个 entries
- **AND** `specToElement.get("payment-auth")` SHALL 返回 `payment.authorize`

#### Scenario: Spec 缺失 binding
- **WHEN** Spec 没有合法 singular `element`
- **THEN** registry SHALL 将其记录为 orphaned Spec
- **AND** MUST NOT 将其加入任一 element mapping

#### Scenario: specs 目录为空或不存在
- **WHEN** `.opsx/specs/` 不存在或为空
- **THEN** SHALL 返回空 registry
- **AND** SHALL NOT 抛出文件系统异常

### Requirement: 提供查询 API

Registry SHALL 提供 element-oriented query API：`getSpecsForElement(elementId)`、`getElementForSpec(specId)`、`getOrphanedSpecs()` 与 `getUncoveredRequiredElements(elements, metamodel)`。

#### Scenario: 查询 element 的 Specs
- **WHEN** 调用 `getSpecsForElement("payment.authorize")`
- **THEN** SHALL 返回全部绑定 Specs 的排序数组
- **AND** unknown element SHALL 返回空数组

#### Scenario: 查询 Spec owner
- **WHEN** 调用 `getElementForSpec("payment-auth")`
- **THEN** SHALL 返回唯一 `elementId`
- **AND** unknown 或 orphaned Spec SHALL 返回 null

#### Scenario: 查询 required contract gaps
- **WHEN** required element 没有任何 Spec
- **THEN** `getUncoveredRequiredElements` SHALL 包含该 element
- **AND** optional element 无 Spec SHALL NOT 被包含

### Requirement: Registry 扫描使用跨平台路径

`buildSpecRegistry` SHALL 使用 `path.join()`、`path.resolve()` 与 project-relative normalization 构建所有 paths，不硬编码 separator，并 SHALL 只扫描明确的 `<spec-id>/spec.md` layout。

#### Scenario: Windows 路径处理
- **WHEN** 在 Windows 执行 registry scan
- **THEN** SHALL 使用 Node.js path API 定位 `.opsx/specs`
- **AND** SHALL 返回与 POSIX 相同的 Spec IDs 与 element mappings
