## Why

`semantic-browser` 是 `interaction-surfaces` 下唯一浏览器 Element，36 条 requirement 把两类语义压在同一 Contract：面向用户的浏览编排语义，与经 Xirang 改造的 LikeC4 的机制语义（投影、缓存、Contract 投递、diff overlay）。单一 Element 无法在 Definition 与 Contract 层面表达这条边界，机制类演进与浏览语义演进无法按维度隔离。模型需要一个与 `cli` 同维度的具体 Web 界面形态 Element，并为每处对 LikeC4 的 Xirang 改造单开 Element。

## What Changes

- `REMOVED semantic-browser`；`ADDED web`（parent `interaction-surfaces`）+ 3 个修改 child：`xirang-projection-service`、`xirang-diff-overlay`、`xirang-contract-delivery`。
- 原 36 条 requirement 按归属映射迁移：`web` 承接浏览编排语义，3 个 child 各承接一处机制语义；4 条跨边界 requirement 拆分为组合/编排与机制两部分，其中 "Contract source 热更新" 的服务端投影部分并入既有 "原子刷新基础 LikeC4 缓存" requirement（见 design.md）。
- `supports-presentation` 源端点由 `semantic-browser` 迁移为 `web`。
- 8 个 Element 的 Definition/Contract 中 "Semantic Browser" 文案统一替换为 "Web"，其中 2 条 requirement 标题改名（REMOVED 旧名 + ADDED 新名），避免旧 identity 名称残留。
- 零代码改动：代码无 hard-coded `semantic-browser` identity 引用；浏览器可观察行为不变。

## Source Impact

### Behavior Source

#### New Specs

- `web`: 面向用户的浏览编排语义（原 16 条整体 + 3 条拆分后的组合/编排部分，共 19 条）。
- `xirang-projection-service`: 服务端投影机制语义（8 条整体 + 1 条拆分后的服务端部分，共 9 条）。
- `xirang-diff-overlay`: 差异视觉表达语义（1 条整体 + 2 条拆分后的视觉部分，共 3 条）。
- `xirang-contract-delivery`: Contract 投递语义（7 条整体 + 1 条拆分后的 manifest 部分，共 8 条）。

#### Modified Specs

- `interaction-surfaces`: 组成 requirement 改为 "由 CLI 与 Web 组成"；"保持呈现方法非独占" 文案同步。
- `cli`: "配置 Semantic Browser 监听地址" 改名 "配置 Web 监听地址"。
- `derived-views`: 2 条 requirement 的 Scenario 文案同步。
- `collaboration-structure`: 1 条 requirement 的 Scenario 文案同步。
- `authored-views`: 2 条 requirement 文案同步。
- `internal-agents`: 1 条 requirement 文案同步。
- `visual-presentation`: 1 条 requirement 文案同步。

### Architecture Source

#### Added Elements

- `web`: 息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，承接面向用户的浏览编排语义。
- `xirang-projection-service`: Web 对 LikeC4 的服务端投影改造。
- `xirang-diff-overlay`: Web 对 LikeC4 的差异呈现改造。
- `xirang-contract-delivery`: Web 对 LikeC4 的 Contract 投递改造。

#### Modified Elements

- `interaction-surfaces`: Definition 文案 "Semantic Browser 支持 Visual Presentation" → "Web 支持 Visual Presentation"。
- `model-view`: Definition 文案 "作为 Semantic Browser 默认 View Selection" → "作为 Web 默认 View Selection"。

#### Removed Elements

- `semantic-browser`: 抽象浏览器 Element 由具体 Web 界面形态 Element 取代，其 Contract 全部迁移至新 Elements。

#### Architecture Relations

- `supports-presentation`: 源端点 `semantic-browser` → `web`（target `visual-presentation` 不变；`cli → text-presentation` 不变）。

## Impact

- 语义结构：Element hierarchy、Contract 归属、Relationship 端点（`.xirang/model/`）。
- 模型文案：`.xirang/model/` 内全部 "Semantic Browser" 引用清理。
- 代码：零改动（已证实 `src/` 与 `likec4/` 源码无 `semantic-browser` identity 引用）。
- 运行时：`xirang view` 浏览器行为不变。
