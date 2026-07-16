## Context

当前 Explore 的实际生成源是 `src/core/templates/workflows/explore.ts`，由 update 管线物化为 Pi Skill 与 shared reference。旧模板同时保留两份主流程；`BRAINSTORMING_GUIDANCE` 未被引用。术语 helper 仅被三个测试文件调用，没有生产入口，实际行为由生成后的 prompt 承载。

## Goals / Non-Goals

**Goals:**

- 让主 Explore instructions 只承载 OpenSpec-specific orchestration，并保留一个可执行 checklist。
- 将术语决策和 Sweeper failure fallback 放入真实运行的 prompt surface。
- 让正式 Specs、模板测试、生成 Skill 和 reference 对同一 target state 一致。
- 删除已断开生产链的 terminology helper 与 helper-only tests。

**Non-Goals:**

- 不修改 OPSX capability、domain、ownership 或 semantic relations。
- 不重命名 `explore-supperpowers-style.md`。
- 不增加运行时 prompt parser、术语决策服务或新依赖。
- 不直接编辑生成制品。
- 不创建 `tasks.md`；实现已经完成。

## Decisions

1. **保留一个主 checklist，删除死常量和重复流程**
   - 主 instructions 保留只读边界、Required Context、Impact Sweeps、Simplicity Awareness、唯一 `Brainstorming Checklist` 和 active-change capture boundary。
   - 展开的 brainstorming discipline 继续由 `referenceFiles` 承载。
   - 不采用仅删除死常量的方案，因为它无法消除两份 live flow 的语义漂移。

2. **让 Explore 拥有术语决策，Sweeper 只拥有事实提取**
   - Sweeper 返回 `terminologyObservations` 事实；Explore 按四态表决定静默、提问和当前对话内去重。
   - 术语问题先于 report `questions`，每轮最多一个问题，使用用户主要语言，最多展示五个术语并报告剩余数量。
   - 删除无生产入口的 `src/core/ai/terminology-decision.ts` 与 `terminology-extractor.ts`，不以孤立 runtime helper 替代 prompt 行为。

3. **由 Explore Spec 单独声明 named Sweeper delegation**
   - `explore-brainstorming` 是 Explore 委托行为的唯一 formal owner。
   - `ai-workflow-templates` 只约束模板结构，不重复 Explore/Sweeper 的具体触发和消费协议。
   - 委托失败只产生 evidence gap；main agent 不猜测缺失影响证据。

4. **窄修改采用最小确认集合**
   - 复杂变更按适用性确认 architecture、components、data flow、technology stack、testing 和 risks/trade-offs。
   - 窄修改可省略无独立决策的章节，但必须确认 problem、impact scope、approach 和 verification method。

5. **保留历史 reference path**
   - `references/explore-supperpowers-style.md` 与物化的 `openspec-explore-supperpowers-style.md` 已进入生成和 formal Spec 合同。
   - 本次不引入 rename/migration/stale-file cleanup，避免扩大无关兼容范围。

## Risks / Trade-offs

- prompt contract 测试替代 helper 单元测试后，行为验证从确定性 TypeScript 函数转为生成文本合同；这是因为 helper 已无生产调用，测试真实运行 surface 更可靠。
- terminology 的最终问法由 Agent 根据用户语言生成，Spec 固定决策边界和不得暴露的内部字段，而不固定某一种语言的整句文案。
- archive history 仍可能保留旧 terminology 或 `BRAINSTORMING_GUIDANCE` 文本；本次只验证 active source，不修改 `openspec/changes/archive/**`。
