# Xirang Neovim Review

Copy `lua/xirang/review.lua` into your Neovim configuration and load it with:

```lua
require('xirang.review').setup()
```

The `xirang` executable must be available on `PATH`. Run `:XirangReview [change]` to review a named active Change, or omit the name to choose one. The review opens in its own tab. The left list groups Delta files by partition and lists existing Plan files; `j`/`k` and arrow keys move within the list, while `<Tab>`/`<S-Tab>` switch entries from the list or either comparison pane. Entries show `+` for added, `~` for modified, and `-` for removed content. The comparison panes are ordered current model on the left and expected target model on the right; Plan entries use a single reading pane. Press `<CR>` to expand or collapse a group, `e` to open the selected source file, and `r` to refresh.

The integration watches the selected Change and `.xirang/model/`, and refreshes after Neovim writes to either tree. The global quickfix list is not used. `closeCurrent()` closes the current tab only when it belongs to a Xirang Review session and returns `false` otherwise. Consumers with an existing close mapping can call it first and retain their existing fallback (for example, closing a managed Quickfix tab). To configure a non-default executable or project root, call `setup({ cli = { '/path/to/xirang' }, cwd = '/path/to/project' })`.

右侧 Expected Semantic Model 支持普通文本编辑。在右侧执行 `:write`，插件通过 stdin 调用 `xirang delta writeback <change> --source <source-path> --json`，由 CLI 把 Definition 与 Sections 的微调写回该 Change 的 Delta。Section 支持增删、改名及 Acceptance Case 编辑；Declaration 的 identity、title、kind、parent 等字段与其它实体内容会被忽略，状态栏提示忽略项，刷新后恢复规范值。仅修改忽略项也会成功刷新；无效目标保存失败时保留右侧草稿与原 Delta。左侧 Current Semantic Model 与 Plan 只读。

保存成功会复用当前 tab 和 buffers，保持选中文件、焦点、光标、视口、列表分组与宽度；内容缩短时光标落在有效位置。未保存的草稿按文件保留，刷新及保存期间继续输入的内容不会被覆盖。多次成功保存以最后一次为准，无版本冲突门禁。编辑写回要求 CLI 与插件同时更新到支持此命令和源文件级投影的版本。

Run the standalone headless checks from the repository root with `nvim --headless -u NONE -l integrations/nvim/tests/run.lua list|compare|refresh|close|windows-paths|save|save-race|context`.
