## Why

Semantic Browser 当前把每个 Element 暴露为独立 View，导致临时测试机制取代了预期的单一模型浏览体验，同时 Relationship 连线缺少 Kind 文案，模型也无法区分用于组织抽象的 Perspective Elements。现在需要统一 View 语义、层级导航与视觉表达，使 Browser 忠实呈现 Semantic Model 和 Semantic Delta。

## What Changes

- **BREAKING** 删除 Element-derived Views，不保留隐式 View、旧 runtime `variant`/`formal` 术语或旧 `variant` HTTP 参数兼容层。
- 为每个项目提供唯一默认 `Model View`，并在同一 View identity 内通过 focus 和 breadcrumb 连续下钻。
- 保留 Authored Views 与每个活动 Change 的单一 Change-derived View，并明确各自导航边界。
- 新增受管内置 Element Kind `perspective`，以特殊形状和确定性配色呈现拆分视角。
- 直接以 Relationship Kind identity 标记连线，并在当前可见层聚合跨 descendants 的 Relationships。

## Source Impact

### Behavior Source

#### New Specs

- `model-view`: 每个项目唯一默认 View 的派生、focus 导航与层级关系呈现。

#### Modified Specs

- `metamodel`: 管理持久化内置 `perspective` Kind 及旧项目迁移约束。
- `derived-views`: 以 Model View 和 Change-derived Views 取代 Element-derived Views 组成。
- `change-derived-views`: 每个活动 Change 只产生一个可连续下钻的差异 View。
- `semantic-browser`: 统一 View selector、focus 导航、Relationship 标签与聚合、Perspective 呈现及 Contract 数据源术语。
- `project-tooling-configuration`: 在新项目、clean Candidate 与既有项目更新中维护内置 `perspective` 声明。

### Architecture Source

#### Added Elements

- `semantic-objects`: 从项目规范语义对象角度组织 Semantic Model 与 Change 的 Perspective。
- `model-view`: 从完整 Semantic Model 确定性派生的唯一默认模型浏览 View。

#### Modified Elements

- `semantic-model`: parent 改为 `semantic-objects`。
- `change`: parent 改为 `semantic-objects`。
- `realization`: Kind 改为 `perspective`。
- `realization-process`: Kind 改为 `perspective`。
- `collaboration-structure`: Kind 改为 `perspective`。
- `derived-views`: children 由 Element-derived Views 与 Change-derived Views 改为 Model View 与 Change-derived Views。
- `change-derived-views`: 边界收敛为每个活动 Change 唯一且可在同一 identity 内下钻的差异 View。
- `metamodel`: 增加受管内置 `perspective` Element Kind 的模型记法边界。

#### Removed Elements

- `element-derived-views`: 按 Element 创建 View 的概念不再属于目标模型。

#### Architecture Relations

- None；本次变更不新增、修改或移除规范 Relationships，也不修改 Authored View entries。

## Impact

- Semantic Model 与 Semantic Delta：`perspective` Kind、Perspective Declarations、Derived View hierarchy 和相关 Contracts。
- CLI：项目初始化、setup/update、Candidate skeleton、模型校验、LikeC4 缓存生成与 `xirang view` runtime manifest。
- Browser：runtime protocol、HTTP Contract loader、React/XState 状态、View selector、focus projection、布局、Relationship details 和 Perspective 样式。
- Public API：删除 Xirang-specific `variant`/`formal` 类型、字段、参数、exports、selectors、errors 和产品文案。
- Tests：更新或删除旧 implicit View tests，增加跨平台迁移、投影、导航、聚合、术语清理、LikeC4 validate 与 Browser E2E 覆盖。
- Dependencies：不增加运行时或开发依赖。
