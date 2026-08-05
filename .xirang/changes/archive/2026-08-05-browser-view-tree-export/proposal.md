## Why

Semantic Browser 的 view 导出菜单（`ExportButton`）目前支持 PNG/JPG 图像与 dot/d2/mmd/puml 文本格式，缺少层级树格式：用户无法以树形文本形式导出当前 view 的元素层级结构，用于文档、评审与分享。

## What Changes

为 view 导出新增层级树：按当前 view 呈现的元素父子层级构建树（根为视图根元素，仅包含当前 view 呈现的元素），并支持三种序列化格式——纯文本缩进树（`├──`/`└──` 树形线）、Markdown 嵌套列表、JSON 结构化层级——由用户在导出页选择；文本与 Markdown 每行内容按 `title`/`fqn`/`kind` 字段选择组合，JSON 恒包含全字段。导出页支持复制与下载（`${viewId}.tree.txt|.md|.json`）。不改变 View identity、Element 层级、Relationships、Metamodel 或语义模型本身。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: 新增"提供当前 view 的层级树导出"与"层级树多格式与字段选择"两项承诺。

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- **generators 包**：新增 `src/tree/generate-tree.ts`——`buildViewTree(view)` 构建中立树，`renderTreeText`/`renderTreeMarkdown`/`treeToJson` 三种序列化；从 `index.ts` 导出。
- **likec4-spa**：新增依赖 `@likec4/generators`（workspace）；路由 `view.$viewId.tree.tsx`（project 与 `_single` 两套）携带 `format`/`fields` search 参数；新增页面 `ViewAsTree`（格式 SegmentedControl + 字段 Checkbox + Copy + 下载）；Header 导出菜单加「Export hierarchy tree」；`routeTree.gen.ts` 由 TanStack Router 自动重生成。
- **测试**：generators 树模块单测（3 序列化 × 字段组合快照）；e2e 新增 tree 导出页格式切换与复制；playwright desktop/mobile grep 列表补充新测试名。
