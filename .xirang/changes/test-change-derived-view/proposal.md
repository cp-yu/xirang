## Why

需要一个可验证的测试 Change，覆盖 Element（Declaration + Contract）、Element Kind（Metamodel）和 Relationship（含 Relationship Kind）三种语义 Delta 类型，以验证 Change-derived View 的正确渲染。

## What Changes

在 Semantic Model 中新增：
- Element Kind `test-component`（contract: required）
- Element `test-entity`（kind: `test-component`, parent: `derived-views`），带一个简单 Requirement
- Relationship Kind `test-references`
- Relationship `test-entity` `test-references` `model-view`

不涉及任何代码修改。

## Source Impact

### Behavior Source

#### New Specs

- `test-entity`: 测试 Element Contract 在 Change-derived View 中的呈现

#### Modified Specs

- None

### Architecture Source

#### Added Elements

- `test-entity`: 测试用 Element，验证新增 Declaration 与 Contract 在 Change-derived View 中的差异呈现

#### New Element Kinds

- `test-component`: 测试用 Element Kind，验证新增 Element Kind 的差异呈现

#### New Relationship Kinds

- `test-references`: 测试用 Relationship Kind，验证新增 Relationship Kind 的差异呈现

#### Modified Elements

- `model-view`: 修改 Declaration definition 文本，验证 MODIFIED 在 Change-derived View 中的差异呈现

#### Removed Elements

- None

#### Architecture Relations

- ADDED: `test-entity` `test-references` `model-view`
- REMOVED: `cli` `supports-presentation` `text-presentation`

## Impact

- 仅修改 `.xirang/` 下的 Semantic Model 语义单元，不涉及代码、API、依赖或配置。