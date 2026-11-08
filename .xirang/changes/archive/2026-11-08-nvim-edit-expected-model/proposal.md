## Why

Neovim 当前只能在审阅会话中暂存 Expected Semantic Model 文本，无法把用户发现的局部问题安全地写回 Change Delta。用户需要直接微调目标内容，同时保留 CLI 对 Semantic Delta 的结构化管理与完整 Change 校验。

## What Changes

- 让 CLI 按 Delta 源文件聚合审阅投影，并提供结构化目标文本写回。
- 让 Neovim 仅编辑右侧 Expected Semantic Model，通过保存委托 CLI 更新 Change Delta，并在写回后刷新且保留当前审阅位置。
- 将写回范围限定为 Element `definition` 与 Contract Sections；其它 Declaration 字段忽略并提示。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `cli`: 为 Neovim 提供按 Delta 源文件聚合的完整模型投影与结构化目标内容写回；校验 Change 后原子更新 Delta，并报告未支持字段。
- `neovim`: 支持右侧目标模型文本微调与保存，左侧保持只读；刷新后保留文件、焦点和光标位置。

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- None

#### Removed Elements

- None

#### Architecture Relations

- None

## Impact

- CLI Change review JSON projection and a dedicated structured Expected Semantic Model writeback operation.
- Neovim review buffers, save handling, status-bar feedback, post-save refresh, and focused regression coverage.
- Delta serialization and validation across supported platforms; file-path behavior requires Windows verification.
