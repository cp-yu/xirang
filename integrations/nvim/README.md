# Xirang Neovim Review

Copy `lua/xirang/review.lua` into your Neovim configuration and load it with:

```lua
require('xirang.review').setup()
```

The `xirang` executable must be available on `PATH`. Run `:XirangReview [change]` to review a named active Change, or omit the name to choose one. The review opens in its own tab. The left list groups Delta files by partition and lists existing Plan files; `<Tab>` and `<S-Tab>` move through entries, `<CR>` toggles groups, `e` opens the selected source file, and `r` refreshes. Delta entries show read-only before/after model text with native diff; Plan entries are read-only single-column text.

The integration watches the selected Change and `.xirang/model/`, and refreshes after Neovim writes to either tree. The global quickfix list is not used. To configure a non-default executable or project root, call `setup({ cli = { '/path/to/xirang' }, cwd = '/path/to/project' })`.

Run the standalone headless checks from the repository root with `nvim --headless -u NONE -l integrations/nvim/tests/run.lua list|compare|refresh|windows-paths`.
