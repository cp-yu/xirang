## Context

Explore 已确认问题、范围、方案、验证方式及七处精确提示词改动。来源为 Design Record `20261108T134839Z-479ee209`。现有模板生成工具工作面；Experimenter 已具备独立实验和证据交付能力。

## Goals / Non-Goals

**Goals:**

- 按已确认英文原文落实 Explore 与 Propose 的理解及判断行为，复用现有流程。
- 在承担相关职责的活动、工作流和角色层级表达完整承诺。
- 分别验证生成一致性及实际对话行为。

**Non-Goals:**

- 不增加固定问卷、强制分类表或每次必做实验。
- 不重设计 Apply、Review、Experimenter，不改变模型结构、CLI 接口或数据格式。

## Decisions

### 精确文本替换

以下英文是用户逐段确认的代码字符串内容，后续按原文修改。每组给出明确位置及替换前后文本，其他内容保留；E3 用原短语作为插入锚点。英文引用保持原样，说明采用中文。

#### E1：Design loop 第 1 项

来源：`src/core/templates/workflows/explore.ts`。

修改前：

```text
1. Ground existing-project claims in the Semantic Model, relevant Change, implementation, tests and Git evidence. Identify unknowns and affected subsystem boundaries before design. For independent subsystems, clarify scope and recommend an implementation order.
```

修改后：

```text
1. Understand the problem behind the user's input before settling an approach. The user may express an intent, a proposed approach, or both; do not assume the input is complete. Establish the current situation, desired outcome and constraints needed for this decision, distinguishing suggested approaches from explicit requirements. Ground existing-project claims in the Semantic Model, relevant Change, implementation, tests and Git evidence. Identify material unknowns and affected subsystem boundaries. For independent subsystems, clarify scope and recommend an implementation order.
```

#### E2：Design loop 第 2 项开头

来源：`src/core/templates/workflows/explore.ts`。

修改前：

```text
2. Ask one design-changing question per turn and wait. Resolve terminology before dependent choices.
```

修改后：

```text
2. Actively clarify gaps that could change the problem definition, choice of approach or judgment of success. Investigate facts available from project evidence; ask the user about unclear goals, preferences and trade-offs. When asking, explain your current understanding and the gap, ask one focused question at a time and wait. Reuse established context; continue when the relevant gaps are resolved rather than following a fixed questionnaire. Resolve terminology before dependent choices.
```

#### E3：第 2 项方案比较前插入

来源：`src/core/templates/workflows/explore.ts`。

修改前：

```text
For a key choice, compare 2–3 viable approaches
```

修改后：

```text
Assess both user-proposed and Agent-proposed approaches against the intended outcome and constraints. Distinguish established facts, reasoning and assumptions that could affect the decision. Look for constraints or counterexamples that could invalidate an approach, including your own recommendation. Adopting an approach does not establish its technical feasibility. For a key choice, compare 2–3 viable approaches
```

#### E4：第 3 项修订复查句

来源：`src/core/templates/workflows/explore.ts`。

修改前：

```text
After a revision, recheck dependent decisions.
```

修改后：

```text
A failed approach does not by itself imply misunderstood intent or an unachievable goal. Reassess the approach and its assumptions, then recheck dependent decisions after any revision.
```

#### E5：Design loop 第 4 项

来源：`src/core/templates/workflows/explore.ts`。

修改前：

```text
4. If a design depends on practical feasibility, delegate the question, constraints and decision background to Experimenter before confirming it. It independently designs and runs a minimal discriminating experiment, choosing an appropriate location with the main Agent. Inspect reproducible observations and limitations; experimental success is evidence, not user adoption. Experiment files are not formal implementation.
```

修改后：

```text
4. Use available evidence and reasoning to assess feasibility; not every design needs a new test. When a consequential feasibility question cannot be resolved adequately this way, delegate the question, constraints and decision background to Experimenter before confirming the dependent design. It independently designs and runs a minimal discriminating experiment, choosing an appropriate location with the main Agent. Inspect reproducible observations and limitations. Use partial evidence for what it establishes without treating a local success as proof of the whole approach. If execution is blocked or results are inconclusive, state what remains unknown and how it affects the decision. Experimental success is evidence, not user adoption. Experiment files are not formal implementation.
```

#### P1：Flow 3 的 Otherwise bullet 第一句

来源：`src/core/templates/workflows/propose.ts`。

修改前：

```text
Otherwise require a clear problem, impact scope, approach, verification method, and no unresolved Semantic Delta decisions across Definition, Contract, or structural scope.
```

修改后：

```text
Otherwise establish the problem, intended outcome, constraints, impact scope, approach and verification method through project evidence and focused questions, without treating a supplied approach as complete intent. Resolve material gaps, including Semantic Delta decisions across Definition, Contract and structural scope.
```

#### P2：Flow 10 的实施判断句

来源：`src/core/templates/workflows/propose.ts`。

修改前：

```text
Check that the proposed implementation can realize those outcomes; do not substitute a list of scenario names for the reasoning.
```

修改后：

```text
Check the evidence and critical assumptions supporting the proposed implementation's ability to realize those outcomes. Confirmation alone does not establish feasibility, and an approach failure alone does not establish an intent mismatch or an unachievable goal. Do not substitute a list of scenario names for the reasoning.
```

### 精简与生成边界

Explore 只修改 EXPLORE_SUPPERPOWERS_STYLE_REFERENCE 中的 Design loop；Summary gate、主入口和其他 reference 沿用。Propose 只修改 P1、P2，复用 gap handling、用户确认和实验返回 Explore 的机制。通过现有模板、显式工作流注册和 referenceFiles 同步受管工作面，不手改生成结果，不新增生成机制。文本改动没有新增平台专属行为或路径处理。

未采用逐阶段复述原则的长版；模型依据关键判断与边界推理。Experimenter 已有“设计并执行最小实验”“交付实践证据与限制”“遵守实验职责边界”，本轮复用。

### 语义落位

explore、design-exploration、explore-brainstorming、explore-role 承担主动理解、方案判断和实验消费；propose、propose-workflow、post-propose-validation、propose-role 承担入口理解及成文检查。提示词原文属于实现决策；行为承诺在 Delta 中表达，不改变 Declaration、Kind、Relationship 或 View。

既有固定六步及无条件方案数量要求，按已确认的非机械原则限定为适用职责和未确定的关键选择，不改变职责集合。精简要求在现有 reference 指导 Section 表达；父级和角色保持各自层级的完整承诺。

### 验证策略

复用 test/core/templates/explore-template.test.ts 和 test/core/templates/skill-templates-parity.test.ts 所属权威套件，检查模板集成和生成一致性。只有既有断言与已确认行为冲突时才更新，不为每句提示词新增字符串测试，保持未变行为的覆盖。执行命令和技术顺序由 Apply 根据现场决定。

#### One-time Verification

小规模多轮对话比较修改前后表现，使用相同模型、相同初始输入和可用项目证据，保留实际问答，对关键情形适度重复。模型与样本安排在实施时按成本和证据需要确定，不预设固定样本数或大规模评测。观察实际提问、取证、方案修订和就绪判断，不按措辞复述评分。

| 输入或事件 | 可观察结果 |
|---|---|
| 只说“我想更快地找到问题。” | 理解困难、情境和期望结果，不猜定路线 |
| 只说“加一个缓存。” | 理解问题并区分建议与明确约束 |
| 用户路线遭遇反证 | 保留目标，依据证据考虑替代路径 |
| Agent 路线失败 | 复核方案与假设，不无依据重开意图确认 |
| 局部实验成功 | 使用局部证据，不声明整体已证实 |
| 背景、目标与证据充分 | 继续推进，不重复提问或强制实验 |
| 明确路线要求与目标冲突 | 说明冲突和选项，由用户选择调整方向 |

对话覆盖 Explore、直接进入 Propose 及成文发现反证的情形。模板测试通过不证明行为有效；行为结果披露成功、失败和局限，有限样例不证明普遍稳定性。这是本 Change 的一次性验证，不变成每次 Explore 的固定流程。核对七处原文及必要构建、类型检查同属一次性证据，不新增持久测试文件。

## Risks / Trade-offs

- 提示词遵循受模型与任务影响 → 通过实际对话取得证据并限定结论，不预设新措辞必然更好。
- 充分理解被执行成重复提问 → 覆盖信息充分时直接推进的反例。
- 语义承诺与英文原文处于不同表达层级 → 行为按 Contracts 检查，实现按已确认原文核对，不将所有案例重复写入提示词。
- 实验成本超过判断价值 → 按关键不确定性选择方法，保留局部证据价值并限制结论。
