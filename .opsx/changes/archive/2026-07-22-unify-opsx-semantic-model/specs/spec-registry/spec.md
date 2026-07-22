---
element: validation.registry
---
## MODIFIED Requirements

### Requirement: 运行时构建 cap↔spec 双向映射

系统 SHALL 扫描 `.opsx/specs/*/spec.md` 的 singular `element` frontmatter，构建 `elementToSpecs` 与 `specToElement` 派生 registry。一个 element MAY 对应多个 Specs；每个 Spec SHALL 最多产生一个 owner entry。

#### Scenario: [ADDED] 构建 one-to-many mapping
- **WHEN** `specs/payment-auth/spec.md` 与 `specs/payment-errors/spec.md` 均声明 `element: payment.authorize`
- **THEN** `elementToSpecs.get("payment.authorize")` SHALL 返回按 Spec ID 排序的两个 entries
- **AND** `specToElement.get("payment-auth")` SHALL 返回 `payment.authorize`

#### Scenario: [ADDED] Spec 缺失 binding
- **WHEN** Spec 没有合法 singular `element`
- **THEN** registry SHALL 将其记录为 orphaned Spec
- **AND** MUST NOT 将其加入任一 element mapping

#### Scenario: [MODIFIED] specs 目录为空或不存在
- **WHEN** `.opsx/specs/` 不存在或为空
- **THEN** SHALL 返回空 registry
- **AND** SHALL NOT 抛出文件系统异常

#### Scenario: [REMOVED] 构建双向映射

- **WHEN** `.opsx/specs/cli-archive/spec.md` 的 frontmatter 声明 `capabilities: [cap.cli.archive, cap.change-workflow.archive]`
- **THEN** registry 的 `capToSpecs` SHALL 包含 `cap.cli.archive → ["cli-archive"]` 和 `cap.change-workflow.archive → ["cli-archive"]`
- **AND** registry 的 `specToCaps` SHALL 包含 `cli-archive → ["cap.cli.archive", "cap.change-workflow.archive"]`

#### Scenario: [REMOVED] 多个 spec 关联同一 cap

- **WHEN** `specs/cli-archive/spec.md` 和 `specs/archive-verify-gate/spec.md` 的 frontmatter 均声明 `cap.cli.archive`
- **THEN** `capToSpecs.get("cap.cli.archive")` SHALL 返回 `["archive-verify-gate", "cli-archive"]`（按字母序排列）

#### Scenario: [REMOVED] 无 frontmatter 的 spec 被跳过

- **WHEN** `specs/legacy-cleanup/spec.md` 无 frontmatter
- **THEN** registry 的 `specToCaps` 中 SHALL NOT 包含 `legacy-cleanup`
- **AND** 该 spec SHALL NOT 出现在任何 `capToSpecs` 的值中

### Requirement: 提供查询 API

Registry SHALL 提供 element-oriented query API：`getSpecsForElement(elementId)`、`getElementForSpec(specId)`、`getOrphanedSpecs()` 与 `getUncoveredRequiredElements(elements, metamodel)`。

#### Scenario: [ADDED] 查询 element 的 Specs
- **WHEN** 调用 `getSpecsForElement("payment.authorize")`
- **THEN** SHALL 返回全部绑定 Specs 的排序数组
- **AND** unknown element SHALL 返回空数组

#### Scenario: [ADDED] 查询 Spec owner
- **WHEN** 调用 `getElementForSpec("payment-auth")`
- **THEN** SHALL 返回唯一 `elementId`
- **AND** unknown 或 orphaned Spec SHALL 返回 null

#### Scenario: [ADDED] 查询 required contract gaps
- **WHEN** required element 没有任何 Spec
- **THEN** `getUncoveredRequiredElements` SHALL 包含该 element
- **AND** optional element 无 Spec SHALL NOT 被包含

#### Scenario: [REMOVED] getSpecsForCap 查询

- **WHEN** 调用 `registry.getSpecsForCap("cap.cli.archive")`
- **THEN** SHALL 返回所有在 frontmatter 中声明该 cap 的 spec ID 数组
- **AND** 未知 cap ID SHALL 返回空数组

#### Scenario: [REMOVED] getCapsForSpec 查询

- **WHEN** 调用 `registry.getCapsForSpec("cli-archive")`
- **THEN** SHALL 返回该 spec frontmatter 中声明的所有 cap ID 数组
- **AND** 未知 spec ID SHALL 返回空数组

#### Scenario: [REMOVED] getOrphanedSpecs 查询

- **WHEN** 调用 `registry.getOrphanedSpecs()`
- **THEN** SHALL 返回所有无 frontmatter 或 capabilities 为空的 spec ID 数组

#### Scenario: [REMOVED] getUncoveredCaps 查询

- **WHEN** 调用 `registry.getUncoveredCaps(allCapIds)`，传入 OPSX 中所有 cap ID
- **THEN** SHALL 返回没有任何 spec 声明关联的 cap ID 数组

### Requirement: Registry 扫描使用跨平台路径

`buildSpecRegistry` SHALL 使用 `path.join()`、`path.resolve()` 与 project-relative normalization 构建所有 paths，不硬编码 separator，并 SHALL 只扫描明确的 `<spec-id>/spec.md` layout。

#### Scenario: [MODIFIED] Windows 路径处理
- **WHEN** 在 Windows 执行 registry scan
- **THEN** SHALL 使用 Node.js path API 定位 `.opsx/specs`
- **AND** SHALL 返回与 POSIX 相同的 Spec IDs 与 element mappings
