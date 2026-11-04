## Why

审阅 Change 时，当前 Delta 文件只表达目标差量，用户需要来回查找当前模型内容才能判断实际结果。Semantic Browser 已能呈现模型差异，但 Neovim 用户需要在编辑器中直接完成同一审阅，并能顺手阅读 Change Plan。

## What Changes

为 Neovim 增加 Change 文件级文本审阅界面，以只读 CLI 投影取得语义编译结果，并更新 Interaction Surfaces 的界面边界。

## Source Impact

### Behavior Source

#### New Specs

- `neovim`: 提供 Change 文件列表、模型前后文本对比、Plan 阅读、源文件跳转与刷新行为。

#### Modified Specs

- `cli`: 提供 Neovim 消费的只读 Change 审阅投影。
- `interaction-surfaces`: 将 Neovim 纳入界面组成与呈现方式约束。

### Architecture Source

#### Added Elements

- `neovim`: 面向 Change 文件级文本审阅的 Neovim 交互界面。

#### Modified Elements

- `interaction-surfaces`: 将 Neovim 纳入 Interaction Surfaces，并明确它与 CLI、Web 的呈现边界。
- `cli`: 增加供 Neovim 插件消费的确定性只读投影职责。

#### Removed Elements

- None

#### Architecture Relations

- `neovim` consumes `cli` 的审阅投影，并支持 Text Presentation。

## Impact

- Xirang CLI 的 `show` JSON 审阅投影。
- Xirang 仓库中的可复制 Neovim 插件及其测试。
- Semantic Model 中的 Interaction Surfaces、CLI 与 Neovim 语义。
