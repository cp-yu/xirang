## Why

当前 Element Kind 无法为节点声明全局默认呈现配置，`perspective` Kind 的 `document` shape 和颜色选择仍属于 Xirang 框架的硬编码特权。本 Change 将节点呈现配置权交给用户，在 Element Kind 中增加可选的 `nodePresentation` 字段，首版支持 `shape`、`color`、`border`。

## What Changes

- Element Kind 增加可选的 `nodePresentation` 字段，用于声明该类 Element 在所有 View 中的全局默认节点呈现。
- 首版字段范围：`shape`（10 种）、`color`（11 种）、`border`（4 种），值域由 Xirang 自有枚举定义，通过统一 adapter 映射到 LikeC4。
- 当前项目的 `perspective` Kind 将从裸声明改为携带 `nodePresentation: { shape: document, color: indigo, border: solid }`。
- parser 对 `nodePresentation` 执行严格校验，非法值产生 `ERROR`。
- serializer 支持确定性嵌套 YAML mapping 序列化。
- presentation 变化进入 Semantic Delta Element Kind 的完整目标态、各类 fingerprint 和 framing baseline。
- Definition Framing CLI 的 types、payload 校验、document render/parse 和 baseline drift 检测同步扩展。
- `visual-presentation` Contract 明确持久呈现目标可存在于 Metamodel。
- `metamodel` Contract 的“使用规范 Kind 字段”增加 `nodePresentation`。

**不包含**：逐 View override、Element 实例级 override、任意 CSS/HEX/RGB 颜色、`icon`/`iconColor`/`iconSize`/`iconPosition`、`opacity`/`multiple`/`size`/`padding`/`textSize`、自动分配 sibling 异色、像素级跨 renderer 一致性保证。

## Source Impact

### Behavior Source

#### New Specs

None。本 Change 不引入新的 observable behavior。

#### Modified Specs

- `visual-presentation`: 明确持久呈现配置可存在于 Metamodel 作为 Element Kind 的全局节点呈现默认值，不改变该 Kind 的规范语义；Renderer 不支持某个值时可以确定性降级，但不得改变 View composition 或模型语义。
- `metamodel`: Element Kind 规范字段增加 `nodePresentation`，声明 `shape`、`color`、`border` 三个可选子字段及其值域。
- `semantic-delta`: Element Kind Delta 的完整目标态包含 `nodePresentation`。
- `definition-framing`: framing 可确认和保存完整 Kind presentation。
- `change-structural-definition`: 完整 Element Kind target 包含 `nodePresentation`；baseline 和 drift 检测该字段。
- `semantic-browser`: 所有 runtime sources 统一消费 Kind presentation；diff 状态优先级明确。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `metamodel`: Element Kind 可声明 `nodePresentation`。
- `visual-presentation`: 允许持久的 presentation target，重申视觉结果不改变项目规范语义或 View composition。
- `semantic-delta`: Metamodel Delta 的 Element Kind target 携带 `nodePresentation`。
- `definition-framing`: payload schema 和校验支持 `nodePresentation`。
- `change-structural-definition`: Element Kind target 包含 `nodePresentation`。
- `semantic-browser`: 所有 runtime sources 统一消费 Kind presentation。

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- **Core model**: `src/core/model/types.ts` ElementKind interface 增加 `nodePresentation`。
- **Parser**: `src/core/model/parser.ts` ElementKind 解析增加 `nodePresentation` 严格校验。
- **Serializer**: `src/core/model/frontmatter.ts` 增加确定性嵌套 YAML mapping 支持。
- **Semantic diff**: `src/core/semantic-diff.ts` ElementKind diff 包含 `nodePresentation`。
- **Fingerprint**: `src/core/semantic-diff.ts` 或相关 fingerprint 模块将 presentation 纳入计算。
- **Delta**: `src/core/model/delta.ts` ElementKind ADDED/MODIFIED 携带完整 `nodePresentation`。
- **Framing CLI**: `src/core/framing/types.ts`、`document.ts`、`baseline.ts` 同步扩展。
- **LikeC4 generator**: `src/core/likec4/generator.ts` 增加 `nodePresentation`→LikeC4 style 映射。
- **Browser materializer**: `likec4/packages/diagram/src/xirang/architectureView.ts` 统一消费 Kind presentation。
- **Browser runtime sources**: `src/core/view.ts` 所有 source 携带 `nodePresentation`。
- **Tests**: core parser、serializer、diff、fingerprint、delta、framing、generator、Browser、E2E。
- **Dependencies**: 无新增依赖。