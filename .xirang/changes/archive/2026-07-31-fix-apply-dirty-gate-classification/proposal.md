## Why

Apply Step 1 的 dirty-state gate 在 workspace 有未提交改动时一律询问用户如何处理，无法区分 `.xirang/changes/<name>/` 下的 Change artifacts 与无关脏文件。当仅有的 dirty 文件正是本次 Change 自身的 artifacts 时，提问毫无意义且打断流程。

## What Changes

Step 1 的准备指令增加分类：`.xirang/changes/<name>/` 下的文件视为 Change 本身，始终纳入基线、不触发 gate 提问。仅当该目录外存在脏文件时，才询问用户选择 worktree isolation、一并纳入基线或停止 Apply。

## Source Impact

### Behavior Source

#### New Specs

- `apply`: 在准备阶段分类脏状态，Change artifacts 自动入基线

#### Modified Specs

- None

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

- `src/core/templates/workflows/apply-change.ts` — Step 1 第 6 条指令文案修改
- `.xirang/references/xirang-apply-step-1-preparation.md` — 随模板重新生成的投影，内容一致