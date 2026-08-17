## Why

Candidate 的 `complete-with-diff` 没有独立审查场景：大重构时它近似整图 ADDED 且看不到删除，小改用 `diff-only` 即可。继续与 Change 共用三态，会使默认入口名不副实。

## What Changes

- **BREAKING**：Candidate 的 Presentation Mode 从三态收为 `complete` / `diff-only`，默认 `complete`。
- **BREAKING**：首页 Candidate 入口与规范默认 URL 从 `change=candidate&mode=complete-with-diff` 改为 `change=candidate`（省略 mode 即 `complete`）。
- **BREAKING**：`change=candidate&mode=complete-with-diff` 深链确定性收敛为 `complete`。
- Change 三态与 target-only `complete-with-diff` 保持不变。
- 删除 Candidate 对 `complete-with-diff` 的可达状态与对应测试，不删除 Change 共享的 `complete-with-diff` 实现。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: Candidate 仅两态、默认 `complete`；非法 `complete-with-diff` 收敛；首页入口不再携带 `mode=complete-with-diff`
- `web`: 三维控件、首页入口与 Candidate 呈现不再声称与 Change 相同三态
- `xirang-diff-overlay`: Candidate 仅在 `diff-only` 叠加差异标记，不再有 Candidate `complete-with-diff` 场景

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `semantic-browser`: Definition 将 Presentation Mode 从「Change 与 Candidate 共用三态、默认 complete-with-diff」改为「Change 三态默认 complete-with-diff，Candidate 两态默认 complete」

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`：`defaultMode`、Mode 选项、状态收敛、URL 编解码
- `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.spec.ts`：Candidate 默认与非法 mode 用例
- `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`：首页 Candidate 卡片 URL
- `likec4/packages/likec4-spa/src/searchParams.ts` 与 `searchParams.spec.ts`：仅在默认 mode 编解码受影响时调整
- `test/e2e/semantic-browser-candidate-views.spec.ts`：删除 Candidate `complete-with-diff` 用例，改写默认 `complete` 与 `diff-only` 深链
