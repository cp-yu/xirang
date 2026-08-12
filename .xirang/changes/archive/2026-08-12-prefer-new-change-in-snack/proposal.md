## Why

Snack 当前在未指定 Change 时默认复用唯一 active Change，容易把一次独立的 code-first reconciliation 混入无关的进行中 Change。默认新建可保持 Change 边界清晰，同时仍允许用户明确要求续写已有 Change。

## What Changes

- Snack 默认从实现证据拟定未占用的 Change ID 并创建新 Change。
- 仅当用户明确要求修改当前或已有 Change 时进入更新模式。
- 新建模式遇到已存在的 ID 时停止并要求不同 ID，不自动转为更新。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `snack-workflow`: 修改 Snack 的 Change 选择默认值及新建、更新模式边界。

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

- `src/core/templates/workflows/snack.ts`
- `.pi/skills/xirang-snack/SKILL.md`
- Snack 模板与安装集成测试
