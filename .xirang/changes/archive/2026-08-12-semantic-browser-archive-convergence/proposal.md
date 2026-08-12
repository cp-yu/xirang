## Why

当用户正在 Semantic Browser 中浏览一个活动 Change 时，若该 Change 恰好被 Agent sync & archive，浏览器仍保留该 Change：`complete-with-diff` 与 `complete` 显示相同、`diff-only` 无任何内容且不透明化，同时 `xirang view` 的基础缓存发布会把被递归 watcher 监听的 live 目录重命名后删除，导致 Node 22 递归 watcher 抛出未处理 ENOENT 使进程退出。

## What Changes

在 Semantic Browser 的运行生命周期内正确收敛活动 Change 状态：

- 活动 Change 被归档或移除时，服务端重建 manifest 使该 Change 不再出现在 Change Selection，Browser 清空 Change Selection、回到 `complete` 并清除残留的就地展开状态。
- 基础 LikeC4 缓存发布改为保留 live 目录身份的原子逐文件替换，并支持失败回滚，避免 watcher 因被监听目录被重命名删除而崩溃。

## Source Impact

### Behavior Source

#### New Specs

- `semantic-browser`: 当当前选中的活动 Change 被归档或移除时收敛 Browser 状态——清空 Change Selection、回到 `complete`、清除来自被移除 Change projection 的 expanded set。

#### Modified Specs

- `semantic-browser`: 基础 LikeC4 缓存刷新以保留 live 目录身份的方式原子发布（同目录临时文件 rename 覆盖，不整体 rename 或删除被监听目录），失败时从 last-known-good 恢复。

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

- `src/core/view.ts`：`xirang view` 对 `.xirang` 的递归 watcher 事件分类——活动 Change 目录自身事件、`changes/archive` 侧事件与缺少 filename 的事件触发 manifest 重建。
- `src/core/likec4/artifact-cache.ts`：基础 LikeC4 缓存的发布机制——live 目录内临时文件原子替换、last-known-good 备份与回滚。
- `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`：manifest 刷新时对已移除 Change 的 Controller 状态收敛。
- 测试：`test/core/view.test.ts`、`test/core/likec4/artifact-cache.test.ts`、`likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.spec.ts`。
- 运行中的 `xirang view` 进程不再因缓存目录被重命名删除而崩溃。
