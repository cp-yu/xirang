## Why

Semantic Browser 当前对 Model、Authored、Candidate 与 Change-derived 内容采用不同的状态和布局路径，导致相同语义选择产生不一致的 Graphviz 质量、双向 Relationship 相互覆盖、diff 样式覆盖业务呈现，并使模型变更后的 LikeC4 缓存无法可靠刷新。

## What Changes

- **BREAKING** 将 Model 与 Authored View 收敛到单一 Semantic Browser route，以独立的 View Selection、Change Selection 与 Presentation Mode 控制统一 runtime projection，删除旧 Authored View route、混合 source selector 与后置自制布局路径。
- 使用 Semantic Model 作为规范底层、原生 LikeC4 parser/compute/Graphviz 管线作为派生中间层、Semantic Browser Controller 作为顶层状态控制，服务端按 projection key 生成并缓存 layouted view。
- 为 Authored View 增加 `exclude` 选择规则，为 Relationship Kind 增加 Kind 级 `presentation`，并以不覆盖业务样式的独立视觉通道呈现 ADDED、MODIFIED 与 REMOVED。
- 完整重建并原子替换基础 `.cache-likec4` 内容，通过 fingerprint、HMR 与 last-known-good 保证模型更新后的 projection 一致性。
- Candidate 与 Candidate Diff 保持独立 Build Review 语义，但复用统一 LikeC4 projection、Relationship presentation、双向 routing 与 diff overlay 基础设施。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `semantic-browser`: 改为单一路由、三维独立控制、服务端原生 LikeC4 projection、分区 manifest、URL/history 协调、缓存刷新与统一交互。
- `derived-views`: 调整 Derived Views 的组成边界，使 Change-derived 内容成为组合 runtime projection 而不是每个活动 Change 的独立 View identity。
- `model-view`: 将 Model 作为 View Selection，并支持与单个 Change、三种 Presentation Mode、focus 与展开集合组合的统一投影。
- `authored-views`: 增加 `exclude`、descendants 选择闭包、多根 virtual projection root，并获得与 Model 相同的 focus、下钻与就地展开行为。
- `change-derived-views`: 从独立 View source 改为 View Selection、单个 Change Selection 与 Presentation Mode 的确定性组合投影。
- `visual-presentation`: 使用原生 LikeC4/Graphviz 管线、独立 diff overlay、逐 Relationship edge routing、Relationship Kind presentation 与视觉锚点。
- `metamodel`: 允许 Relationship Kind 声明严格校验的可选 `presentation` mapping。

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- `derived-views`: Derived Views 的定义边界不再包含每个活动 Change 的独立 View identity，而包含由 Browser 状态组合形成的 Change-derived runtime projections。
- `model-view`: Model View 的定义边界扩展为可与 Change Selection 和 Presentation Mode 组合的默认 View Selection。
- `change-derived-views`: Change-derived Views 的定义边界改为由 View Selection、单个 Change 与 Presentation Mode 形成的 runtime projections，不再是独立 source 或 route。

#### Removed Elements

- None

#### Architecture Relations

- None

## Impact

- Xirang model parser、validator、serializer、semantic comparison、framing payload 与 LikeC4 generator/presentation adapter。
- `xirang view` 的基础缓存生成、watcher、runtime manifest、projection service、fingerprint、HMR 与错误协议。
- vendored LikeC4 diagram、SPA route、navigation、URL/history、image export snapshot、Element/Relationship details 与 Candidate review integration。
- Semantic Browser 的 unit、property、integration、desktop/mobile Playwright 与一次性真实项目视觉验证。
- 旧 Authored View URL、`source/focus/mode` URL schema、manifest version 3 混合 source contract 与旧 Change 浮动面板不再兼容。
