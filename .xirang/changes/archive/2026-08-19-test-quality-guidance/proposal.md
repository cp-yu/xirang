## Why

Explore、Propose、Apply、Reviewer 把 Scenario 机械映射成持久化测试，产生大量锁结构、锁措辞、信噪比低的测试。需要把测试品质收成可泛化纪律，让后续 Change 用更少测试获得更强缺陷防护。

## What Changes

- 新增共享测试品质片段，Explore / Propose / Apply / Reviewer 共用 3+1：可重复隔离、锁行为不锁结构、单一失败原因，以及难测先改设计。
- Testing Strategy、Check 编译、TDD 与 Review 覆盖改为按可观察行为和失败原因组织，取消 Scenario 与测试文件 1:1。
- Contract Scenario 写条件行为，不写生成物排版；精确 token 仅在其本身是对外协议时才作为行为。
- 本仓库提示词锁词细则进入项目 `rules.tasks`，不进入通用片段。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `explore-brainstorming`：Testing Strategy 先应用测试品质再分类 persistent / one-time；按行为规划测试，不按 Scenario 条数。
- `propose-workflow`：编译 Check 时必须判断语义价值；同一行为的多个 Scenario 可归入一个 Check；Scenario 写可观察行为而非排版。
- `tdd-checkpoints`：按 3+1 验证测试；删除不可泛化的接口面积阈值；增加变异思考实验与优先修改已有测试。
- `apply-workflow`：Phase 0 先检查已有测试再决定修改、新增或删除；RED 必须来自目标行为缺失。
- `reviewer-protocol`：覆盖按行为证据判断；取消 Scenario 1:1 测试文件作为不可降级 CRITICAL。
- `tasks-document`：Check 是证据单元，需声明测试动作（reuse / modify / add / delete / one-time）。
- `workflow-templates`：Explore、Propose、Apply、Reviewer 复用同一测试品质片段。

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

- `src/core/templates/fragments/xirang-fragments.ts`：新增 `TEST_QUALITY_GUIDANCE`；扩展 `ELEMENT_CONTRACT_SEMANTICS`。
- `src/core/templates/workflows/explore.ts`、`propose.ts`、`apply-change.ts`、`reviewer.ts`：接入共享片段并落实阶段动作。
- `.xirang/config.yaml` `rules.tasks`：本仓库生成面锁词适配。
- 本次触及的模板测试：合并为片段接入与关键职责断言，删除对应机械锁词。
