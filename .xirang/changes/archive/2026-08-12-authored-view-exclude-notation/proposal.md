## Why

Authored View 的 `exclude` 字段在代码实现中早已存在（`model/types.ts`、`parser.ts`、`validator.ts`、`runtime-projection.ts`、`semantic-diff.ts`），`authored-views` Element Contract 也已声明其选择语义，但 Semantic Model 的引用规则、Authored View 引用校验与规范化比较三处契约遗漏了 `exclude`；同时所有 agent 指令面（fragments 记法表、specs 指令、delta 模板、`xirang-contract.md`、生成技能）均未声明该字段，导致后续 Agent 不知道可声明 `exclude` 排除本 View 不关注的内容。

## What Changes

- MODIFIED `semantic-model` Contract：引用规则与 Authored View 引用校验补充 `exclude`
- MODIFIED `deterministic-operations` Contract：规范化集合列表补充 `exclude`
- 指令与模板面声明 `exclude` 记法：fragments、specs 指令、delta 模板、`xirang-contract.md`、`xirang-build`/`xirang-snack` 生成技能
- 无结构变更：不新增或修改 Element、Kind、Relationship、View

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `semantic-model`: Authored View 的 `exclude` 与 `of`、list-form `include` 一样只引用已声明的 Element identity，未声明引用纳入 `UNRESOLVED_VIEW_REFERENCE` 校验
- `deterministic-operations`: `exclude` 与 `include` 等集合字段一样作为无序集合规范化后比较

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

- `src/core/templates/fragments/xirang-fragments.ts`：两处记法表与 include 语义说明补充 `exclude`
- `schemas/semantic-model/schema.yaml`：specs 指令字段表补充 `exclude`
- `schemas/semantic-model/templates/delta.md`：views 单元示例补充 `exclude`
- `xirang-contract.md`：字段表、语义说明、引用规则、规范化列表补充 `exclude`
- `.pi/skills/xirang-build/SKILL.md`、`.pi/skills/xirang-snack/SKILL.md`：生成技能同步
- 测试 pin 更新：`notation-consistency.test.ts`、`skill-templates-parity.test.ts`、`instruction-loader.test.ts`
