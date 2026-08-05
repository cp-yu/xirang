## Context

Semantic Browser 的 view 导出菜单位于 `likec4/packages/likec4-spa/src/components/view-page/Header.tsx` 的 `ExportButton`：图像格式走 `/export/$viewId`（`ExportPage`），文本格式 dot/d2/mmd/puml 走 `/view/$viewId/{dot,d2,mmd,puml}` 路由，各自经 vite-plugin 虚拟模块（`likec4:dot` 等）在构建期预计算全部 view 的字符串。层级树要求格式与字段在页面内实时切换，构建期预计算需枚举 3 格式 × 字段组合 × 全部 view，不适用。当前 view 的完整 `DiagramView`（`DiagramNode` 带 `id/fqn`、`title`、`kind`、`parent`、`children`）已由 `useCurrentView()` 在客户端可用，客户端实时生成即可。约束：不改模型与语义，不改既有导出格式，嵌入式浏览器 `isRpcAvailable=false` 走 `_single` 布局路由。

## Goals / Non-Goals

**Goals:**
- 为当前 view 提供层级树导出，支持纯文本（`├──`/`└──`）、Markdown 嵌套列表、JSON 三种格式实时切换。
- 文本/Markdown 每行内容按 `title`/`fqn`/`kind` 字段选择组合；JSON 恒含全字段。
- 导出页提供复制与下载（`${viewId}.tree.txt|.md|.json`）；导出菜单新增「Export hierarchy tree」入口。
- 生成逻辑为可单测纯函数。

**Non-Goals:**
- 不改变 View identity、Element 层级、Relationships、Metamodel 或 Authored Views。
- 不改变既有 png/jpg/dot/d2/mmd/puml 导出格式与行为。
- 不为层级树引入构建期虚拟模块或服务端预计算。

## Decisions

### 1. 生成逻辑放 `@likec4/generators`，客户端实时调用

新增 `likec4/packages/generators/src/tree/generate-tree.ts`：`buildViewTree(view)` 从 `view.nodes` 构建中立树 `{ id, title, kind, children: ViewTree[] }`（根 = `parent` 为 null 的节点，子节点按 `children` id 关联并按标题自然序稳定排序）；`renderTreeText(tree, fields)`、`renderTreeMarkdown(tree, fields)`、`treeToJson(tree)` 三种序列化。`likec4-spa` 新增 workspace 依赖 `@likec4/generators`，仅 import 树模块，tree-shake 后增量很小。

- 替代方案 A：仿 dot/puml 加 vite-plugin 虚拟模块 `likec4:tree` 构建期预计算——需枚举全部格式/字段组合与全部 view，膨胀且无法页面内即时切换，弃用。
- 替代方案 B：树逻辑内联在 likec4-spa——不可被 generators 单测独立覆盖，且与既有生成器归属不一致，弃用。
- 理由：`@likec4/generators` 是既有纯生成器归属（generatePuml/generateD2/generateMermaid），单测位置一致；客户端调用数据已由 `useCurrentView()` 提供，零构建期改动。

### 2. 路由与 search 参数

新增 `view.$viewId.tree.tsx`（project 与 `_single` 两套），search 参数 `format: 'text'|'markdown'|'json'`（默认 `text`）与 `fields: ('title'|'fqn'|'kind')[]`（默认 `['title']`），沿用 `ExportPage` 的 `validateSearch` + `stripSearchParams` 模式。`routeTree.gen.ts` 由 TanStack Router 自动重生成。

### 3. 导出页 `ViewAsTree`

页面用 `useCurrentView()` 取当前 view，`buildViewTree` 构建树，按 `format`/`fields` 序列化；顶部控制条（Mantine `SegmentedControl` 选格式 + `Checkbox` 组选字段）更新 search 参数并即时重渲染；正文 `<pre>`/`Code` 展示；`CopyToClipboard` 复用既有组件；下载按钮以 Blob 生成 `${viewId}.tree.txt|.md|.json`。行内容渲染规则固定为 `标题 [fqn] (kind)`（按选中字段顺序 title → fqn → kind），JSON 恒含全字段。

### 4. 文本/Markdown 行渲染规则

每行 = 选中字段按固定顺序组合：title 原样、fqn 以 `[fqn]` 呈现、kind 以 `(kind)` 呈现，仅渲染选中字段；Markdown 为 2 空格缩进的 `-` 列表，文本为 `├──`/`└──` 树形线（末子节点用 `└──`，其余 `├──`，缩进 4 空格）。

### 5. e2e grep 列表补充

新增 e2e 测试名（如 "exports a hierarchy tree"）不在既有 playwright desktop/mobile grep 模式中，`playwright.config.ts` 的 desktop 与 mobile `grep` 正则各追加新测试名替代项。既有用例不修改。

## Risks / Trade-offs

- [`@likec4/generators` 进入 spa 客户端 bundle] → 仅 import 树模块，tree-shake 增量很小；构建体积异常时改评估放 `@likec4/core`。
- [字段组合渲染歧义] → 行渲染规则（`标题 [fqn] (kind)` 顺序）在 generators 单测以快照固定。
- [树排序稳定性] → 根与子节点均按标题自然序（`compareNatural`）稳定排序，快照可复现。
- [移动端无 hover] → 导出页控制条为常驻控件，不依赖 hover，移动端可用。

## Migration Plan

1. 合并后导出菜单新增「Export hierarchy tree」；旧 URL 无影响，默认 `format=text`、`fields=title` 与直接访问 `/view/$viewId/tree` 等价。
2. 无需数据迁移；无持久化 schema 变化。
3. 回滚：移除路由、页面与菜单项并还原 `playwright.config.ts` grep 列表即可恢复现状。

## Open Questions

- 无阻塞项。树节点深度过大时的截断/折叠策略后续按需另立 Change，本期输出完整树。
