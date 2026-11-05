## Why

Propose 当前把目标、方案与执行检查反复写进三份 Plan 文档，并在形成阶段预列文件、命令和任务依赖，增加用户审阅负担，也过早固定只有 Apply 才能根据现场判断的实施细节。

## What Changes

**BREAKING** 将 Propose 默认审阅改为完整成稿后集中审阅，用户要求时按机制交互；将 `tasks.md` 收敛为与用户确认实施目标和验证方向的文档，并区分三份 Plan 的职责。Apply 在保留用户确认次序与独立验证门禁的前提下动态安排具体实施和检查。新版本只支持目标级任务格式，不迁移或兼容旧 `Files/Checks` 格式。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `propose`、`propose-workflow`：默认审阅节奏、交互边界及目标导向的任务编写。
- `post-propose-validation`：从目标语义到任务目标与验证方向的覆盖审查。
- `change-plan`、`tasks-document`：Plan 文档去重及 `tasks.md` 的协商职责。
- `apply`、`apply-workflow`、`task-decomposition`、`reviewer-protocol`：按目标执行、现场选择测试、以实际证据更新完成状态；Reviewer 按目标与实际变更判定范围、删除与行为保持。
- `artifact-workflow-commands`、`validation-commands`：目标级任务格式的 instructions、读取、进度与校验；移除旧格式支持。
- `snack-workflow`：行为保持场景的后续验证改为对照 Contract Section 给出可观察验证方向，不再使用旧 Check 锚点。

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

- 任务制品模板、结构校验、进度统计及 Propose、Apply、Reviewer、隔离和归档的任务消费流程。
- Breaking change：不迁移历史 Change；旧式 `Files/Checks` 任务必须重写为目标级格式后才能继续经 CLI 校验或 Apply。
