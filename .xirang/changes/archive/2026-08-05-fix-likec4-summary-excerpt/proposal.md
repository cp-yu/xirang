## Why

Semantic Browser 的 LikeC4 视图投影把 Element Definition 摘录到 120 Unicode code points 作为节点标签正文，节点过宽且宽度分布不均；经 graphviz `unflatten` 重排后底部 cluster 包围盒退化（不含其子节点），指向这些 cluster 的复合边无法路由，导致整个 `model` 视图布局失败（"layouted 0 of 1 views"），浏览器呈现空白。

## What Changes

将 `definitionExcerpt` 的摘录上限从 120 调整为 25 Unicode code points，使 LikeC4 视图节点标签变窄，规避 graphviz `unflatten` 布局退化，保证 `model` 视图可成功布局并渲染。Element Contract 的完整 Definition 仍通过 `description` 字段与浏览器详情面板完整呈现，不损失语义内容。不改变 Element 层级、Relationships、Metamodel、Views 或 Semantic Model 本身。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: "确定性派生 Definition Excerpt" 的摘录上限由 120 调整为 25 Unicode code points。

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

- **`src/core/likec4/definition.ts`**：`EXCERPT_LIMIT` 由 120 调整为 25，是 `definitionExcerpt` 的唯一行为参数。
- **LikeC4 缓存与浏览器投影**：`generateLikeC4` 产出的 `model.c4` 节点标签正文与 `projectBrowserDeclaration` 的 summary 同步变短（≤25 码点 + `...`），节点宽度变窄，`view model` 布局成功。
- **测试**：`test/core/likec4/generator.test.ts` 的 excerpt 用例同步更新为 25 边界，并新增“生成产物中每个 summary 均有界”守卫测试；`test/core/likec4/generator-validate.test.ts` 新增“项目 Semantic Model 视图可成功布局”回归测试——读取真实模型生成并布局，断言全部边均有路由点，直接覆盖本次 graphviz `unflatten` 崩溃（无缩小 fixture 可复现，仅完整项目几何触发）。
