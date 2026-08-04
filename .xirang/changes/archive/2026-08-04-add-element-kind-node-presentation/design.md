## Context

当前 Element Kind IR 接口和持久语法只支持 `identity`、`contract`、`root`、`parents`、`children`、`body`。Framing CLI 的 payload schema 使用 `exactKeys` 校验，未知字段会被拒绝。Serializer 只支持 scalar 和数组，无法序列化嵌套 YAML mapping。

`perspective` 的普通化已在 `make-element-kinds-model-driven` Change 中完成，本 Change 仅需为其增加 `nodePresentation`。

## Goals / Non-Goals

**Goals:**
- Element Kind 可声明 `nodePresentation`（`shape`、`color`、`border`）。
- Parser 对 `nodePresentation` 执行严格枚举校验。
- Serializer 支持确定性嵌套 YAML mapping。
- Semantic Delta、fingerprint、framing 全程保留 presentation。
- 所有 Browser runtime sources 一致消费 Kind presentation。
- 当前项目 `perspective` Kind 获得 `{ shape: document, color: indigo, border: solid }`。

**Non-Goals:**
- 不增加逐 View 或 Element 实例级 override。
- 不开放任意 CSS/HEX/RGB 颜色。
- 不开放 `icon`、`opacity`、`size`、`padding`、`textSize`、`multiple` 等字段。
- 不新增依赖。
- 不修改 LikeC4 自身渲染逻辑。

## Decisions

### 1. 数据结构命名

`nodePresentation` 作为 Element Kind 的可选对象，而非 `style` 或 `likec4Style`，避免与 LikeC4 `ElementStyle` 耦合。

```ts
interface NodePresentation {
  shape?: NodeShape;
  color?: NodeColor;
  border?: NodeBorder;
}
```

### 2. Xirang 自有枚举，通过 adapter 映射 LikeC4

Xirang 定义自己的枚举值，由 `src/core/likec4/adapter.ts` 或类似模块统一映射：

- `NodeShape` → LikeC4 `ElementShape`
- `NodeColor` → LikeC4 `ThemeColor`
- `NodeBorder` → LikeC4 `BorderStyle`

generator 与 Browser materializer 强制使用同一映射函数。

> 跨包边界说明：`presentation-adapter.ts` 位于 core 包（`src/core/likec4/`），而 Browser materializer（`likec4/packages/diagram/src/xirang/architectureView.ts`）位于独立的 likec4 包，无法直接 import core 模块。本 Change 采用确定性降级方案：`mapNodeShape`/`mapNodeColor`/`mapNodeBorder` 为恒等映射（Xirang 枚举值与 LikeC4 值一致），Browser materializer 直接消费 source 中已携带的 `elementKinds[].nodePresentation` 值，从而与 generator 经 adapter 产出的值必然一致；若未来 Xirang 枚举与 LikeC4 值分叉，需要在两处同步映射并通过 source parity 测试保护（`architectureView.spec.ts` 的 uniform sources 测试覆盖）。

### 3. Parser 严格校验

`src/core/model/parser.ts` 的 ElementKind 分支增加 `nodePresentation` 读取：

```ts
if (entity === 'element-kind') {
  const nodePresentation = data.nodePresentation;
  // 校验：必须是 mapping，只允许 shape/color/border，值必须属于枚举
}
```

未知字段 `shapee`、`colour`、`borderStyle` 等产生 `ERROR`，不得被静默忽略。

### 4. Serializer 嵌套 YAML 支持

`src/core/model/frontmatter.ts` 的 `renderFrontmatter` 当前只处理 scalar 和数组。增加 `renderMapping` 函数，支持确定性嵌套对象：

```ts
function renderEntry(key: string, value: unknown): string {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return renderMapping(key, value as Record<string, unknown>);
  }
  // existing array/scalar logic
}
```

固定 `nodePresentation` 字段顺序：`shape`、`color`、`border`。

### 5. Semantic Delta 完整目标态

Element Kind `ADDED` 或 `MODIFIED` 携带完整 `nodePresentation`。`REMOVED` 只携带 `identity`。

### 6. Dongle Fingerprint 与 diff

`nodePresentation` 变化进入：
- Semantic Model fingerprint（canonical JSON 包含它）
- Metamodel partition fingerprint
- Change fingerprint
- Browser source revision
- framing baseline capture

Element Kind diff 将 `nodePresentation` 作为单个 property 呈现。首版不强制递归子字段 diff。

### 7. Framing CLI 扩展

`ElementKindTarget` 增加 `nodePresentation`，`parseElementKinds` 的 `exactKeys` 允许它，并对其值做枚举校验。`renderChangeStructuralDefinition` 序列化它。baseline capture 和 drift detection 包含它。

### 8. 呈现优先级

1. error、selection、disabled 等运行时状态
2. ADDED/MODIFIED/REMOVED diff 状态（覆盖 `color`，保留 `shape` 和 `border`）
3. Element Kind `nodePresentation`
4. renderer 默认值

## Risks / Trade-offs

- [Risk] `nodePresentation` 进入 fingerprint 和 delta 后，用户可能误以为呈现配置是规范语义。→ Contract 明确：持久呈现目标可存在于 Metamodel，但不改变 Element 的职责、行为、层级或 Relationship 语义。
- [Risk] LikeC4 枚举值未来变化时，Xirang 枚举可能落后。→ 独立维护 Xirang 枚举，adapter 无法映射时产生明确 diagnostic 并确定性降级。
- [Risk] generator 和 Browser materializer 使用不同映射。→ 强制使用同一 adapter 函数，通过所有 source parity tests 验证。
- [Risk] 旧 framing records 丢失 `nodePresentation`。→ 旧 records 无 `nodePresentation` 时继续有效，不产生错误。