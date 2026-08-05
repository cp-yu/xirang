### Task 1: 层级树生成器

**Goal**: `@likec4/generators` 新增树模块（`buildViewTree` + 三种序列化）与单测。

**Files**:
- Create: `likec4/packages/generators/src/tree/generate-tree.ts`
- Create: `likec4/packages/generators/src/tree/generate-tree.spec.ts`
- Modify: `likec4/packages/generators/src/index.ts`

**Requirements**:
- `buildViewTree(view)` 从 view nodes 构建中立树 `{ id, title, kind, children: ViewTree[] }`，根为 `parent` 为 null 的节点，子节点按 `children` id 关联，根与子均按标题自然序稳定排序
- `renderTreeText`（`├──`/`└──`）、`renderTreeMarkdown`（2 空格缩进 `-` 列表）、`treeToJson`（嵌套 JSON 含 title/fqn/kind/children）三种序列化
- 文本/Markdown 每行按 `title`/`fqn`/`kind` 选中字段固定顺序组合（`标题 [fqn] (kind)`）；JSON 恒含全字段且不受字段选择影响
- 树模块从 `@likec4/generators` index 导出

#### Checks

- [x] C1 验证生成器单测
  - Verifies: `elements/semantic-browser.md` / Requirement "层级树多格式与字段选择" / Scenario "选择每行字段"
  - Command: `cd likec4 && pnpm --filter @likec4/generators exec vitest run src/tree/generate-tree.spec.ts`
  - Expect: 3 序列化 × 字段组合快照断言全部通过

### Task 2: 路由与导出页

**Goal**: likec4-spa 接入 `@likec4/generators` 依赖，新增 project 与 `_single` 两套 tree 路由与 `ViewAsTree` 页面。

**Files**:
- Modify: `likec4/packages/likec4-spa/package.json`
- Modify: `likec4/pnpm-lock.yaml`（`@likec4/generators` workspace 依赖链接）
- Create: `likec4/packages/likec4-spa/src/routes/project.$projectId/view.$viewId.tree.tsx`
- Create: `likec4/packages/likec4-spa/src/routes/_single/view.$viewId.tree.tsx`
- Create: `likec4/packages/likec4-spa/src/pages/ViewAsTree.tsx`

**Requirements**:
- `likec4-spa` 新增 workspace 依赖 `@likec4/generators`
- 两套路由 `view/$viewId/tree` 携带 `format: text|markdown|json`（默认 text）与 `fields: title,fqn,kind`（默认 title）search 参数，沿用 `ExportPage` 的 `validateSearch` + `stripSearchParams` 模式
- `ViewAsTree` 用 `useCurrentView()` 取当前 view，`buildViewTree` 构建树并按 `format`/`fields` 序列化；顶部 `SegmentedControl` 选格式 + `Checkbox` 组选字段即时重渲染；正文代码展示；`CopyToClipboard` 复制；下载按钮生成 `${viewId}.tree.txt|.md|.json`
- `routeTree.gen.ts` 由 TanStack Router 在 dev/build 时自动重生成，无需手工编辑

#### Checks

- [x] C1 验证路由与页面 typecheck
  - Verifies: `elements/semantic-browser.md` / Requirement "提供当前 view 的层级树导出" / Scenario "导出当前 view 层级树"
  - Command: `cd likec4 && pnpm --filter @likec4/spa typecheck`
  - Expect: 依赖、两套路由与 ViewAsTree 页面通过 typecheck，routeTree 重生成包含 tree 路由

### Task 3: 导出菜单入口

**Goal**: Header 导出菜单新增「Export hierarchy tree」入口。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/components/view-page/Header.tsx`

**Requirements**:
- 导出菜单新增「Export hierarchy tree」项，链接到 `view/$viewId/tree`（project 与 `_single` 两套布局各自对等）
- 菜单项默认 search 为 `format=text`、`fields=title`

#### Checks

- [x] C1 验证菜单项 typecheck
  - Verifies: `elements/semantic-browser.md` / Requirement "提供当前 view 的层级树导出" / Scenario "导出当前 view 层级树"
  - Command: `cd likec4 && pnpm --filter @likec4/spa typecheck`
  - Expect: Header 菜单项改动通过 typecheck

### Task 4: e2e 验证

**Goal**: 新增 e2e 覆盖层级树导出页三格式切换与复制，并补充 playwright desktop/mobile grep 列表。

**Files**:
- Create: `test/e2e/browser-view-tree-export.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `likec4/packages/likec4-spa/src/components/CopyToClipboard.tsx`（ActionIcon 补 `aria-label="Copy"`，供复制断言定位）

**Requirements**:
- 访问 `/view/<viewId>/tree` 显示当前 view 的层级树内容，根节点为视图根元素
- 切换 text/markdown/json 格式内容按所选格式重新渲染；勾选字段后文本/Markdown 行内容变化
- Copy 按钮可复制当前内容；`playwright.config.ts` 的 desktop 与 mobile `grep` 正则各追加 `exports a hierarchy tree` 替代项

#### Checks

- [x] C1 验证层级树导出页
  - Verifies: `elements/semantic-browser.md` / Requirement "层级树多格式与字段选择" / Scenario "切换导出格式"
  - Command: `pnpm likec4:build && pnpm exec playwright test --project=desktop --project=mobile -g "exports a hierarchy tree"`
  - Expect: 三格式切换、字段选择与复制断言全部通过（desktop + mobile）
