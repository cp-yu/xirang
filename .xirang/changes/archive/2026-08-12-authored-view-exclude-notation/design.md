## Context

Authored View 的 `exclude` 字段在代码实现（`model/types.ts`、`model/parser.ts`、`model/validator.ts`、`likec4/runtime-projection.ts`、`semantic-diff.ts`）与 `authored-views` Element Contract 中均已存在，但 Semantic Model 的引用规则、引用校验与规范化比较三处契约以及全部 agent 指令面未声明该字段。

## Goals / Non-Goals

**Goals:**
- 契约与指令面完整声明 `exclude`，使后续 Agent 编写 Authored View 时知道可排除本 View 不关注的内容

**Non-Goals:**
- 不改变 `exclude` 的运行时选择语义
- 不新增或修改 Element、Kind、Relationship、View 结构

## Decisions

- `exclude` 语义以 `authored-views` Contract 既有声明为准：include 形成后代选择闭包后，exclude 对整个匹配后代子树剪枝，优先级高于 include，缺失或空列表等价于空集合 [INFERRED FROM CODE：`runtime-projection.ts` 的 `resolveViewSelection` 与既有测试]
- 引用规则、引用校验、规范化比较三处契约补充 `exclude`，与已实现行为对齐 [INFERRED FROM CODE：`validator.ts` 已对 `view.exclude` 报 `UNRESOLVED_VIEW_REFERENCE`，`semantic-diff.ts` 已对 `exclude` 排序规范化]
- 指令面（fragments、specs 指令、delta 模板、`xirang-contract.md`、生成技能）同步声明 `exclude` 记法
- 不生成 `tasks.md`：实现已完成

## Risks / Trade-offs

- [Low] 契约文本变更仅对齐既有实现行为，不改变 observable 语义，无迁移风险
