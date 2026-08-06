## Context

Semantic Browser 的 PNG/JPG 导出当前不等于屏上内容：`ExportPage` 渲染 `<LikeC4Diagram view={基础 model view}>`，而 `LikeC4Diagram` 无条件挂载交互式状态机与 `XirangArchitectureOverlay`，其 materialize effect 用机器默认上下文（focus=null→根、expanded 空、source=model、mode=full）投影，且导出页没有 URL→机器 的 focus 同步桥，因此导出总是"根 focus 视图"并忽略 URL `focus`。dot/mmd/drawio 走服务端生成源，导出完整编译模型视图。交互视图的机器中已有当前 focus、expanded、source、mode 全部状态。

## Goals / Non-Goals

**Goals:**
- 通过既有 Header 导出入口（PNG/JPG，不新增不删除选项）导出与当前屏上呈现一致的内容：当前 source、full/diff 模式、当前 focus 与就地展开。
- 对用户完全不可见：不增加新点击入口、不隐藏任何导出格式。
- 确定性：导出页首次 materialize 即正确，避免"先渲染根视图再切换"的下载竞态。

**Non-Goals:**
- 不重构"导出页运行交互式机器"这一现状架构；修复是喂给它当前状态而非默认状态。
- 不改变 dot/d2/mmd/puml/Draw.io/层级树的导出行为——它们仍导出完整模型结构，不反映当前 focus 与就地展开；该范围作为既定边界记录在 `semantic-browser` 契约的“文件类导出保持完整模型结构”Requirement 中，是项目承认的能力边界而非缺陷回退对象。
- 不把 expanded 编码进 URL（规模不可扩展，已否决）。
- 不新增服务端状态或 HTTP endpoint（overkill，已否决）。

## Decisions

1. **快照 store（新增 `diagram/src/xirang/export-state.ts`）**：模块级 `{source, mode, focus, expanded: string[]}` + `getSnapshot`/`setSnapshot`。`XirangArchitectureOverlay` 用一个 effect 在状态变化时镜像当前 `selected.id`/`mode`/`focusIdentity`/`expandedNodes`；`enableStaticView` 时跳过——导出页自身的 overlay 不会覆盖快照。选模块 store 而非持续写 sessionStorage：交互时零 I/O，点击导出时一次性传输。
2. **sessionStorage 传输**：Header 在 `viewId === 'model'` 的 PNG/JPG 点击时把 store 快照写入 `sessionStorage['xirang:export-snapshot']`，并用 `window.open` 打开导出标签页——保留 opener 使新标签页克隆 sessionStorage（`target="_blank"` 隐式 `rel=noopener`，Chromium 不克隆，已实测确认）。URL 仍只携带 `download`/`source`/`focus`/`mode` 等小参数，不膨胀。无快照（直接打开导出 URL）时导出页回退现状。
3. **机器播种（向后兼容）**：`machine.setup.ts` 的 `Input`/`Context` 增加可选 `initialFocusIdentity?: string | null`、`initialExpanded?: ReadonlySet<string>`，`Context()` 用 `?? null` / `?? new Set()` 初始化；`DiagramActorProvider` 与 `LikeC4Diagram` 透传可选 prop。交互视图不传 → 行为不变。导出页从快照读出 focus/expanded 传入，机器首次 materialize 即当前视图。
4. **source/mode 应用**：`useXirangViewSources` 是 React context，不在机器内。ExportPage 加一个小桥组件（沿用 ViewHistoryBridge 的 URL→context 模式），挂载时 `select(snapshot.source)` + `setMode(snapshot.mode)`，覆盖 Candidate / Change / Diff 视图导出。
5. **下载门控**：ExportPage 的自动下载（`onInitialized` + 500ms）在快照应用前不触发，保证截图内容与播种/桥接后的最终渲染一致；无快照时立即允许（现状行为）。
6. **测试顺序约束**：浏览器验证必须按本仓库既有 skill 先 `@likec4/spa build` 再 `xirang-likec4 build` 重建 bundle，否则 Playwright 读到旧产物。

## Risks / Trade-offs

- 机器 input 为纯增量可选字段，交互视图零行为变化；播种缺失时回退到既有默认（根 focus、空展开）。
- sessionStorage 是隐式状态：键名明确、仅交互态 overlay 写入、导出页静态模式不写，避免覆盖；缺失时回退现状，无回归。
- 导出页仍运行完整交互机器（架构现状），加载面比纯静态渲染大，但属既有行为，不在本变更范围。
- 下载门控把时序从"固定 500ms 缓冲"变为"应用完成后触发"，确定性更好；实现需保证无快照路径不被门控卡住（回退立即放行）。
- 测试维护：既有 e2e（`semantic-browser-model-view.spec.ts` 等）只覆盖交互视图行为，不涉及导出页渲染断言，无需删除；本变更新增导出相关用例。
