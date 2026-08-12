## Why

Propose 倾向于按 major component 生成 task，并可能因 `Requirements` 数量机械拆分，导致 task 无法独立实现或验证；Apply 又按 task 做 TDD，在残缺的行为边界上反复收束，速度低且易产生临时不一致状态。根因在 Formation 阶段，而非 Apply 的执行批次。

## What Changes

将 task 定义为可独立实现、可独立验证的完整 TDD 闭环，由 Propose 负责形成边界；Apply 将每个 task 作为单一 TDD loop 连续执行，全部 pending tasks 与 Required Corrections 完成后才进入一次 Change-level Phase 1 Review。不引入 execution batch，不改 tasks.md 结构与 CLI parser。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `tasks-document`: task 增加按 TDD 闭环组织的规范语义
- `propose-workflow`: task 划分规则改为按可独立实现与验证的完整闭环，并增加 ready-for-apply 前边界自检
- `apply-workflow`: Phase 0 阶段边界改为全部 tasks 完成后统一进入 Change-level Review

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- `task-decomposition`: definition 从"把粗粒度任务转化为实现工作"更新为"按 TDD 闭环任务连续执行实现工作"

#### Removed Elements

- None

#### Architecture Relations

- None

## Impact

- 生成源：`schemas/semantic-model/schema.yaml` tasks artifact instruction、`src/core/templates/workflows/propose.ts`、`src/core/templates/workflows/apply-change.ts`
- 测试：模板测试与 CLI instruction 断言、skill template parity hash
- 不涉及：`tasks.md` 文件结构、task parser、进度统计、Phase 2/3 与隔离协议
