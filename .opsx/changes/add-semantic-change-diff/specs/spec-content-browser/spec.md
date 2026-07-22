## ADDED Requirements

### Requirement: Active change Specs semantic diff

Spec 内容浏览器 SHALL 在 selected active change 中按 Requirement 与 Scenario identity 展示 Formal → Target semantic diff，并从统一 Diff IR 生成 operation badges 与文本差异。

#### Scenario: Requirement operation 展示
- **WHEN** selected change 新增、修改或删除 Requirement
- **THEN** Specs 区域 SHALL 显示对应 ADDED、MODIFIED 或 REMOVED badge
- **AND** identity 与 counts SHALL 与 `opsx diff --json` 一致

#### Scenario: Scenario operation 派生
- **WHEN** `MODIFIED Requirement` 的 target Scenario set 与 Formal 不同
- **THEN** 浏览器 SHALL 通过 title 与 body 比较派生 Scenario ADDED、MODIFIED、REMOVED 或 UNCHANGED 状态
- **AND** SHALL NOT 读取 change-local Scenario operation labels

#### Scenario: Modified text 展示
- **WHEN** Requirement statement 或 Scenario body 发生修改
- **THEN** SHALL 展示行级 additions/removals 与行内词组高亮
- **AND** unchanged lines SHALL 默认折叠并允许展开上下文

#### Scenario: Scenario title 变化
- **WHEN** Formal 与 Target 使用不同 Scenario title 且没有 stable Scenario ID
- **THEN** SHALL 显示一个 REMOVED Scenario 与一个 ADDED Scenario
- **AND** SHALL NOT 自动推断 rename

### Requirement: Active change diff loading and isolation

Spec Content Gateway SHALL 按 selected active change 与 Diff IR fingerprints 提供 Formal/Target content、diff entries 与 diagnostics。不同 active changes SHALL 相互隔离，且 generated review artifact MUST NOT 成为内容来源。

#### Scenario: Change 间隔离
- **WHEN** 用户从 change A 切换到 change B
- **THEN** gateway SHALL 使用 B 的独立 materialized target 与 fingerprints
- **AND** SHALL NOT 合并 A 的 operations

#### Scenario: effective-change.md 不作为输入
- **WHEN** `effective-change.md` 缺失、stale 或被手工修改
- **THEN** Web diff SHALL 继续从 Formal 与 change source 实时计算
- **AND** SHALL NOT 展示该文件内容作为 authoritative diff

#### Scenario: Specs parse error
- **WHEN** selected change 某个 Spec 无法解析
- **THEN** gateway SHALL 返回该 Spec 的 location-aware diagnostics
- **AND** 其他可解析 Specs 与 Architecture SHALL 保持可用

#### Scenario: Spec 修改定向失效
- **WHEN** active change 中一个 Spec 文件变化
- **THEN** SHALL 只失效相关 Specs diff 与 registry projection
- **AND** SHALL NOT 仅因该修改重新布局 Architecture graph

#### Scenario: Windows watcher path
- **WHEN** Windows watcher 返回 backslash 分隔的 change Spec path
- **THEN** gateway SHALL 规范化为 project-relative cache key
- **AND** SHALL 精确失效对应 active change 与 Spec
