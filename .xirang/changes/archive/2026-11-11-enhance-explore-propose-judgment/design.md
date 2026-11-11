## Context

用户提供实际会话，指出 Agent 将方案倾向直接作为合理路线推进；随后逐项确认 Explore 与 Propose 的精简修改。设计依据保存在活动记录 `explore-decision-judgment.md`；本 Change 由 Snack 对照已发生实现补齐，不生成 `tasks.md`。

## Goals / Non-Goals

**Goals:**

- 直接复用逐句确认的提示词修改，将判断提前到方案推荐、采纳及就绪评估。
- 主动获取足以支持判断的证据，并向用户表达判断与关键理由。
- 保留已有设计与有效证据，避免重复论证和同义规则堆叠。

**Non-Goals:**

- 不修改 Apply 提示词，不重组模型层级，不增加 CLI 能力或依赖。
- 不增加固定回答格式、完整思考展示要求或封闭的证据来源清单。

## Decisions

### 原位修改 Explore 设计循环

第2步仅替换原有方案评估第一句，并紧接新增表达要求，后面的事实/推导/假设、反例、采纳不证明可行性等规则保留。最终文本：

```text
Before recommending or adopting an approach, independently assess its feasibility and ability to achieve the intended outcome within the constraints, whether proposed by the user or Agent. State your own assessment and the key reasons behind it.
```

第4步仅替换开头句，保留必要实验的触发条件、Experimenter 职责和局部证据边界：

```text
Assess feasibility using relevant evidence and reasoning; actively obtain missing evidence and check its reliability and applicability. Not every design needs a new test.
```

用户否定了较长的规则扩写及不要求格式的显式指令；取证来源示例也不能变成封闭清单。因此采用以上精简替换。

### Propose 在缺口处理处定义规则，收尾复用

在 `Documentation and gap handling` 下、现有首个条目前新增：

```text
- **Evidence and judgment**: Reuse confirmed decisions and still-applicable evidence. Before recommending an approach or treating it as ready, independently assess whether it is feasible and can achieve the intended outcome within the constraints. Obtain missing evidence and check its reliability and applicability; state your assessment and key reasons.
```

Flow 第10步仅替换原有证据与可行性两句，周围的机制推演与纠错规则保留：

```text
Apply Evidence and judgment to the assumptions supporting those outcomes. An approach failure alone does not establish an intent mismatch or an unachievable goal.
```

这避免仅在收尾发现问题，也复用仍适用的 Explore 判断依据。现有 Decision gap 继续管理重大决策、必要实验和返回 Explore 的边界。

### 通过现有受管入口刷新

[INFERRED FROM CODE] 两处源码分别经现有 Skill template 的 instructions 和 referenceFiles 投影，不新增生成器或检测规则。构建后执行仓库 CLI 的 `update --force --json`，刷新其明确登记的生成目标；实际 Git diff 仅显示对应的 Pi Skill 和 Explore reference 更新。现有更新命令提示发现未接入工具并建议重启会话，未为这些工具安装新集成。

未改变路径处理机制或平台分支；本次不涉及新的 Windows 路径行为，未执行 Windows 实机验证。

## Risks / Trade-offs

- 提示词行为存在模型和情境差异 → 文字替换、构建及模板测试通过不构成独立判断行为改善的证据。
- 取证过度或机械质疑 → 复用仍适用的证据，并以证据是否足以支持判断评估，不按工具调用次数打分。
- 已确认方案的前提失效 → 保持既有反证检查、用户决策和必要实验门禁。

### Verification

一次性检查已完成：TypeScript/项目构建；Explore、Propose 及模板投影一致性三份现有测试，共45项通过；两份源文件 LSP 无诊断；`xirang arch validate --change enhance-explore-propose-judgment --json` 与 `xirang validate --change enhance-explore-propose-judgment --preview --json` 通过。预览仅有8个既有 Section 的 MODIFIED，Declaration、层级及其他分区无变化。未新增只断言英文句子存在的持久测试。

用户已确认三类行为验证方向，尚未执行本次模型行为实验：

- 用户建议听似合理但关键前提有误：识别问题并按需取得能够支持判断的证据。
- 方案可实现却不能改善目标：指出目标适配缺口。
- 依据充分的方案：明确支持并继续推进，避免过度质疑。

每类同时观察取证是否适当、证据是否可靠且适用、结论是否得到支持。回答中的自我声明、工具调用数量或模板测试通过不能代替上述行为证据。
