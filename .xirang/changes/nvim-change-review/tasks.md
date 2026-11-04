### Task 1: 提供 Change 审阅 JSON 投影

**Goal**: 让 Neovim 获得完整、可映射且只读的当前／目标模型内容。

**Files**:
- Modify: `src/core/model/delta.ts`
- Modify: `src/commands/show.ts`
- Modify: `src/cli/index.ts`
- Test: `test/core/model/delta.test.ts`
- Test: `test/commands/show.test.ts`

**Sections**:
- 为解析结果保留 Delta source 文件到实体 identity 的来源映射，不让 source path 进入语义 identity 或 fingerprint。
- 增加 `xirang show <change> --review --json`，复用 Change 编译器及模型序列化，为每个 Delta 文件返回当前与目标完整模型内容，并返回实际存在的 Plan 原文。
- 无效 Change 只返回 invalid 状态与 diagnostics；普通 `show` 输出不变，投影过程不写文件。

#### Checks

- [x] C1 验证审阅投影与普通 Show
  - Verifies: `elements/cli.md` / Section "提供 Neovim Change 审阅投影"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/model/delta.test.ts test/commands/show.test.ts`
  - Expect: 覆盖单个 Delta source 承载多个实体、完整 Relationship 容器、ADDED/REMOVED 空侧、Plan 文件清单、无效 Change 无部分模型内容，并证明普通 `show --json` 输出保持不变

### Task 2: 实现 Neovim Change 审阅工作面

**Goal**: 在 Neovim 中提供独立、只读且会随 source 更新的 Change 文件审阅体验。

**Files**:
- Create: `integrations/nvim/lua/xirang/review.lua`
- Create: `integrations/nvim/README.md`
- Create: `integrations/nvim/tests/run.lua`
- Modify: `.github/workflows/windows.yml`

**Sections**:
- 提供 `:XirangReview [change]` 入口、活动 Change 选择及独立 tab；左侧 Delta 分组可展开并列出实际存在的 Delta 与 Plan 文件，不接触全局 quickfix。
- 用只读 scratch buffers 和原生 diff 显示两侧模型文本；Plan 使用单栏；提供跳转到真实 Change source 的操作。
- 通过 Change／模型目录 watcher 与 Neovim 写入事件触发重新投影；关闭 tab 时清理 watcher 与 buffers，generation 阻止旧响应覆盖新状态。
- 无效首次请求不建立审阅 tab；已打开会话遇到无效刷新时撤下旧内容并通知。
- 保证项目路径使用 Neovim path API 与 argv 进程调用，Linux、macOS、Windows 均不依赖 shell 拼接。

#### Checks

- [x] C2 验证 Delta 与 Plan 文件列表
  - Verifies: `elements/neovim.md` / Section "浏览 Change 内容"
  - Test action: add
  - Test: `integrations/nvim/tests/run.lua`
  - Command: `nvim --headless -u NONE -l integrations/nvim/tests/run.lua list`
  - Expect: 四分区分组可展开，Plan 文件独立列出，Tab/Shift-Tab 切换条目且全局 quickfix 不变

- [x] C3 验证完整文本对比与只读导航
  - Verifies: `elements/neovim.md` / Section "对比 Semantic Delta 对应的完整模型内容"
  - Test action: add
  - Test: `integrations/nvim/tests/run.lua`
  - Command: `nvim --headless -u NONE -l integrations/nvim/tests/run.lua compare`
  - Expect: Delta 条目显示规范化后的完整当前／目标文本并启用双栏 diff，Plan 显示单栏，展示 buffer 不可写且 source 跳转指向真实 Change 文件

- [x] C4 验证刷新与失效行为
  - Verifies: `elements/neovim.md` / Section "定位源文件并刷新审阅"
  - Test action: add
  - Test: `integrations/nvim/tests/run.lua`
  - Command: `nvim --headless -u NONE -l integrations/nvim/tests/run.lua refresh`
  - Expect: Change 与 Formal source 变化触发重算；无效结果移除旧差异；较早的异步结果不能覆盖较新 generation

- [x] C5 验证 Windows 路径与 watcher 生命周期
  - Verifies: `elements/neovim.md` / Section "定位源文件并刷新审阅"
  - Test action: add
  - Test: `integrations/nvim/tests/run.lua`
  - Command: `nvim --headless -u NONE -l integrations/nvim/tests/run.lua windows-paths`
  - Expect: Windows 分隔符下项目根、Change source 与模型 watcher 路径正确；Windows CI 安装 Neovim 并执行此检查
