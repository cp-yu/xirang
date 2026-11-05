## Context

Semantic Delta 保存目标状态的差量，不携带当前完整内容；`xirang show <change> --json` 也只返回差异摘要。Semantic Browser 已通过 Change 编译结果呈现 before/after，但 Neovim 尚无对应工作面。用户已确认在编辑器内按 Delta source 文件审阅完整当前／目标模型文本，并在同一列表阅读 Change Plan。

## Goals / Non-Goals

**Goals:**
- 为 `xirang show <change> --review --json` 增加只读投影，复用 Change 编译与 Semantic Model 序列化。
- 在 `integrations/nvim/` 提供可复制的 Neovim Lua 集成，以独立列表呈现 Delta 文件和 Plan。
- 复用 Neovim scratch buffers 与原生 diff 窗口呈现当前／目标文本，不写入项目或磁盘临时文件。
- 在 Change 或 Formal Semantic Model 文件变化后重算投影，避免展示过时结果。

**Non-Goals:**
- 不改变 Semantic Delta 或 Change 持久格式。
- 不新增独立 `xirang diff` 或顶层审阅命令。
- 不复用 `diffview.nvim` 的 Git adapter，也不复用或覆盖全局 quickfix 列表。
- 不在 Neovim 中解析或应用 Semantic Delta。
- 不实现 Semantic Browser 的图形视图或模型编辑。

## Decisions

- **CLI 复用 `show` 的专用模式**：仅当同时指定 `--review --json` 时生成插件投影；默认 `show` 文本和 JSON 行为不变。通过 `compileChangeDelta` 取得 Formal model、Expected Semantic Model、诊断和 Delta source 清单；有效结果再由同一个 `serializeSemanticModel` 序列化两侧。Delta parser 增加 source-file 到实体 identity 的解析来源索引，不把路径加入语义 identity 或 fingerprint。以 identity 将每个 Delta source 映射至规范化后的完整模型单元；Relationship source 映射到对应 kind 的完整关系容器。新增／删除一侧没有对应模型单元时返回空文本。只返回实际存在的 Delta 文件和 Plan 文件；Change 无效时只返回 invalid 状态及 diagnostics，不返回部分模型文本。Plan 内容按原文返回。CLI 不创建、写入或清理文件。
- **Neovim 视图布局**：仓库内 `integrations/nvim/` 提供 Lua 模块、入口命令和复制说明。`:XirangReview [change]` 打开独立 tab；未指定 Change 时从 `xirang list --json` 提供的活动 Change 中选择。左侧 scratch buffer 显示可展开的四分区 Delta 分组与 Plan 分组；右侧两个只读 scratch buffers 使用原生 diff。选择 Plan 时关闭 diff 状态并在右侧单栏显示文本。`<Tab>`／`<S-Tab>` 在条目间切换；回车展开／折叠或选中条目；单独映射跳转到当前真实 Delta／Plan 文件。
- **源文件位置与规范化**：CLI projection 的模型内容使用稳定的 identity 映射和确定性序列化，供展示与比对，不承诺复现源文件原始排版或自定义路径。跳转编辑始终使用 CLI 返回的 Change source path；不得从临时展示内容推导或写回 source。
- **刷新与并发**：Neovim 在 Change source 的 `BufWritePost` 后刷新；同时监视 `.xirang/model/` 与选定 Change 目录的文件系统变更，使其它进程写入也触发刷新。刷新通过 argv 形式调用 `xirang show <change> --review --json`。每次刷新递增 generation；响应只有在 generation 仍为最新时才可更新界面。初次返回 invalid 时不创建审阅 tab并通知；已打开后返回 invalid 时清空两侧内容与 Delta 列表、保留 Plan/diagnostics 可读状态并通知，不保留旧 diff。关闭审阅 tab 时停止 watcher 并销毁 scratch buffers。
- **独立职责关系**：`neovim consumes cli` 表达插件读取 CLI 的只读审阅投影；`neovim supports-presentation text-presentation` 表达其以文本呈现 View 信息，不改变 Web 的 Visual Presentation。

## Risks / Trade-offs

- [Change source 与模型 identity 映射错误] → parser 来源索引由实体 identity 关联，关系文件按关系三元组及 kind 映射；增加跨分区、一个关系容器含多条关系、ADDED/REMOVED 与无效 Change 的命令测试。
- [文件系统 watcher 在平台间事件表现不同] → 同时处理 Neovim 缓冲区写入事件和目录 watcher；为 watcher 封装可关闭的生命周期，并验证 Linux、macOS、Windows 路径与事件行为。
- [CLI JSON 携带完整模型单元导致输出较大] → 只返回 Delta 文件涉及的模型单元及该 Change 实际存在的 Plan 文件，不序列化无关模型单元。
- [失效或乱序响应显示旧内容] → invalid 时清除旧差异；以 generation 拒绝较早响应，测试请求并发与 Change／Formal source 先后变化。
