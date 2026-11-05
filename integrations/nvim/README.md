# Xirang Neovim Review

Copy `lua/xirang/review.lua` into your Neovim configuration and load it with:

```lua
require('xirang.review').setup()
```

The `xirang` executable must be available on `PATH`. Run `:XirangReview [change]` to review a named active Change, or omit the name to choose one. The review opens in its own tab. The left list groups Delta files by partition and lists existing Plan files; `j`/`k` and arrow keys move within the list, while `<Tab>`/`<S-Tab>` switch entries from the list or either comparison pane. Entries show `+` for added, `~` for modified, and `-` for removed content. The comparison panes are ordered current model on the left and expected target model on the right; Plan entries use a single reading pane. Press `<CR>` to expand or collapse a group, `e` to open the selected source file, and `r` to refresh.

The integration watches the selected Change and `.xirang/model/`, and refreshes after Neovim writes to either tree. The global quickfix list is not used. To configure a non-default executable or project root, call `setup({ cli = { '/path/to/xirang' }, cwd = '/path/to/project' })`.

Run the standalone headless checks from the repository root with `nvim --headless -u NONE -l integrations/nvim/tests/run.lua list|compare|refresh|windows-paths`.
