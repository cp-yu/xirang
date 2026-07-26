# 息壤（Xirang）定义

## Definition Hierarchy

```text
0. Project Definition

语义对象
├── 1. Semantic Model
│   ├── 2. Metamodel
│   ├── 2. Hierarchical Elements
│   │   ├── 3. Element Declaration
│   │   └── 3. Element Contract
│   ├── 2. Relationships
│   └── 2. Views
│       ├── 3. Authored Views
│       └── 3. Derived Views
│           ├── 4. Element-derived Views
│           └── 4. Change-derived Views
└── 1. Change
    ├── 2. Semantic Delta
    │   ├── 3. Element Declaration Delta
    │   ├── 3. Element Contract Delta
    │   ├── 3. Relationship Delta
    │   └── 3. Metamodel Delta
    └── 2. Change Plan

Realization（落实过程）
└── 1. Realization

    推进过程
    ├── 2. Semantic Model Build
    └── 2. Change Realization
        ├── 3. Change Formation
        │   ├── 4. Intent-first Path
        │   │   ├── 5. Explore
        │   │   └── 5. Propose
        │   └── 4. Implementation-first Path
        │       └── 5. Snack
        ├── 3. Change Implementation
        │   ├── 4. Apply
        │   └── 4. Verify
        │       ├── 5. Review
        │       └── 5. Optimization
        └── 3. Change Closure

    协作结构
    ├── 2. Participants
    │   ├── 3. 用户
    │   └── 3. Agents
    │       ├── 4. Agent
    │       │   ├── 5. Project Build
    │       │   ├── 5. Explore
    │       │   ├── 5. Propose
    │       │   ├── 5. Snack
    │       │   ├── 5. Apply
    │       │   └── 5. Archive
    │       └── 4. Internal Agents
    │           ├── 5. Reviewer
    │           └── 5. Optimizer
    └── 2. Interaction Surfaces
        ├── 3. CLI
        │   ├── 4. Project and Tooling Configuration
        │   └── 4. Deterministic Operations
        └── 3. Semantic Browser
```

## 0. Project Definition

息壤（Xirang）是面向 Agent 的项目开发框架：它以 Semantic Model 结构化表达用户意图，以 Change 承载新的演进意图，并通过 Realization 由 Agent 落实 Change、持续构建和演进项目。

## 1. Semantic Model

Semantic Model 是项目用户意图的结构化语义表达。它以帮助用户从不同抽象层级理解、讨论和决策项目为首要目标，并为 Agent 导航、验证、实现和持续演进项目提供明确的语义依据。

模型在可扩展 Metamodel 的约束下，以 Hierarchical Elements 表达任意深度的项目抽象。每个 Element 由 Element Declaration 与 Element Contract 共同表达：Element Declaration 定义其身份、类型、概要及层级位置，Element Contract 规范其职责、保证、约束与行为。Relationships 表达 Elements 之间的协作、依赖与约束；Views 面向用户组织和呈现模型，但不改变模型的规范性语义。

在存储结构上，Metamodel、Element Declarations 和 Relationships 存储于 `.xirang/architecture/`，Element Contracts 存储于 `.xirang/specs/`。Element Declarations 与 Element Contracts 共同表达 Elements，必须联合理解和验证。Views 通过 View Definition Files 存储，用于呈现模型，但不改变模型的规范性语义。

## 2. Metamodel

Metamodel 定义 Semantic Model 使用的语义记法。它声明用于表达 Hierarchical Elements 的 Element Kinds，以及用于表达 Elements 之间关系的 Relationship Kinds，并可为每种 Kind 定义其所有实例共享的语义。

每个 Element Kind 与 Relationship Kind 都具有稳定 identity。相同 identity 跨模型状态表示同一个 Kind，其共享语义可以发生改变；Kind identity 发生变化则表示旧 Kind 与新 Kind，而不是同一个 Kind 的名称变化。

## 2. Hierarchical Elements

Hierarchical Elements 是以层级结构组织的项目抽象。每个 Element 表达项目在某一抽象层级上可独立理解的语义单元，并由 Element Declaration 与 Element Contract 共同表达。父 Element 表达较高层抽象，子 Element 对其进一步精化，由此形成从 Project Root 开始、可任意深入的抽象结构。

### 3. Element Declaration

Element Declaration 定义 Element 在 Semantic Model 中的结构身份。它声明 Element 的稳定身份、Element Kind、作者定义的概要以及其在 Hierarchical Elements 中的层级位置。

### 3. Element Contract

Element Contract 定义 Element 在一个确定模型状态中的规范性语义。它以该模型状态自身为视角，描述 Element 在其抽象层级上承担的职责、提供的保证、遵循的约束与表现的行为，只包含在该状态下成立的语义，不包含相对于其他模型状态的新增、修改、删除等变更叙述。

当某项语义被移除时，更新后的 Element Contract 直接不再包含该项语义，而不是保留“删除某项语义”“某项语义已被删除”或其他描述变更过程的内容。

## 2. Relationships

Relationships 是 Elements 之间显式的、类型化的语义联系。每个 Relationship 连接 source Element 与 target Element，并使用由 Metamodel 声明的 Relationship Kind，表达 Elements 之间的协作、依赖或约束。Relationships 的方向与 Kind 共同表达其语义，并补充 Hierarchical Elements 无法表达的联系。

Relationship 的稳定 identity 由 source Element identity、Relationship Kind identity 与 target Element identity 按方向共同确定。任一组成发生变化，都表示一个不同的 Relationship。

## 2. Views

Views 是 Semantic Model 的呈现层。View 从模型中选择并组织 Elements 与 Relationships，形成面向用户的特定视角；View 不引入任何规范性语义，模型的语义不因 View 的变化而改变。Views 由 Authored Views 与 Derived Views 组成。

### 3. Authored Views

Authored Views 是用户显式声明并持久化的 View，存储于 View Definition Files。

### 3. Derived Views

Derived Views 由模型或 Change 自动推导，无需用户声明，不持久化。当前包括 Element-derived Views 与 Change-derived Views。

#### 4. Element-derived Views

Element-derived Views 由 Element 及其 children 确定性推导，形成该 Element 的下钻视图。

#### 4. Change-derived Views

Change-derived Views 由 Semantic Model 与 Semantic Delta 推导，以 diff 视图呈现该 Change 新增、修改或移除的语义。

## 1. Change

息壤通过连续的 Changes 演进项目。每个 Change 由 Semantic Delta 与 Change Plan 组成：Semantic Delta 将新的用户意图规范化为针对 Semantic Model 的新增、修改或移除语义集合，与 Semantic Model 共同推导 Expected Semantic Model；Change Plan 记录该 Change 的意图、决策与执行安排。

## 2. Semantic Delta

Semantic Delta 是 Change 的规范性组成，由一组相对于当前 Semantic Model 声明的规范性语义差量条目构成。它与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

按照作用对象，Semantic Delta 分为 Element Declaration Delta、Element Contract Delta、Relationship Delta 与 Metamodel Delta。在存储结构上，Element Declaration Delta、Relationship Delta 与 Metamodel Delta 存储于 `.xirang/changes/**/architecture-delta.c4`，Element Contract Delta 存储于 `.xirang/changes/**/specs/`。

每个差量条目由修改语、实体与稳定 identity 构成。修改语确定应用方式，实体与稳定 identity 确定作用对象。Semantic Delta 使用的修改语为 ADDED、MODIFIED 与 REMOVED。

ADDED 与 MODIFIED 携带对应实体在 Expected Semantic Model 中的完整目标内容。该内容必须能够直接成为 Expected Semantic Model 的组成部分，只描述该模型状态下成立的规范性语义，不得叙述新增、修改、删除等变化过程。REMOVED 只声明需要移除实体的 identity，不携带内容。同一 identity 在一个 Semantic Delta 中不允许冲突操作。

Semantic Delta 应用后，Expected Semantic Model 只保留应用结果，不保留修改语、操作记录或变更历史。

### 3. Element Declaration Delta

Element Declaration Delta 是 Semantic Delta 中作用于 Element Declarations 的组成。它表达当前 Semantic Model 与 Expected Semantic Model 在 Element 集合及其结构声明上的规范性语义差量，并与当前 Element Declarations 共同确定 Expected Semantic Model 中的目标 Element Declarations。

Element 的稳定 identity 跨模型状态指向同一个 Element；Element Kind、概要与层级位置是该 Element 在一个确定模型状态中的声明内容，可以在 identity 保持不变的情况下发生改变。

### 3. Element Contract Delta

Element Contract Delta 是 Semantic Delta 中作用于 Element Contracts 的组成。它以 Element Contract 中具有稳定 identity 的规范性语义条目为作用对象，表达当前 Semantic Model 与 Expected Semantic Model 在 Element 的职责、保证、约束与行为上的规范性语义差量，并与当前 Element Contracts 共同确定 Expected Semantic Model 中的目标 Element Contracts。

Element Contract Delta 属于 Change，Element Contract 属于 Semantic Model。前者以差量形式确定后者的目标内容，但不成为后者的组成；目标 Element Contracts 只表达 Expected Semantic Model 状态下成立的规范性语义，不承载差量操作或变更历史。

### 3. Relationship Delta

Relationship Delta 是 Semantic Delta 中作用于 Relationships 的组成。它表达当前 Semantic Model 与 Expected Semantic Model 在 Elements 之间显式、类型化语义联系上的规范性语义差量，并与当前 Relationships 共同确定 Expected Semantic Model 中的目标 Relationships。

Relationship Delta 以 Relationship 的稳定 identity 识别不同模型状态中的同一 Relationship。source Element identity、Relationship Kind identity 或 target Element identity 任一发生变化，表示旧 Relationship 与新 Relationship 之间的差量，而不是同一 Relationship 内容的变化。

Relationship Delta 属于 Change，不成为目标 Relationships 的组成。目标 Relationships 只表达 Expected Semantic Model 状态下成立的语义联系，不承载差量操作或变更历史。

### 3. Metamodel Delta

Metamodel Delta 是 Semantic Delta 中作用于 Metamodel 的组成。它表达当前 Semantic Model 与 Expected Semantic Model 在语义记法及其共享语义上的规范性语义差量，并与当前 Metamodel 共同确定 Expected Semantic Model 中的目标 Metamodel。

Metamodel Delta 以 Element Kinds 与 Relationship Kinds 的稳定 identity 识别不同模型状态中的同一 Kind。相同 identity 的 Kind 可以具有不同的共享语义；不同 identity 表示旧 Kind 与新 Kind，而不是同一个 Kind 的名称变化。

Metamodel Delta 的影响不限于发生差量的 Kind。由于 Kind 为所有实例提供共享语义，目标 Metamodel 必须与 Expected Semantic Model 中的 Element Declarations 和 Relationships 联合理解；同一个 Semantic Delta 对 Metamodel、Element Declarations 与 Relationships 产生的结果共同构成完整目标模型。

## 2. Change Plan

Change Plan 是 Change 的辅助性组成。它通过 `proposal.md`、`design.md` 与 `tasks.md` 共同解释该 Change 的意图与路径：`proposal.md` 说明为何发起 Change 及其范围与影响面；`design.md` 记录关键决策、理由与实现策略；`tasks.md` 安排执行步骤与验证检查。Change Plan 帮助用户审查 Change，并帮助 Agent 生产与执行 Semantic Delta，但不独立定义目标语义；当它与 Semantic Delta 冲突时，以 Semantic Delta 为准。

## 1. Realization

Realization 是息壤的落实过程维。在推进过程上，它通过 Semantic Model Build 构建或重建 Semantic Model，通过 Change Realization 将已授权 Change 落实为项目新状态并收束；在协作结构上，由 Participants 承担授权、判断与编排，由 Interaction Surfaces 提供配置、呈现与确定性操作。

## 2. Semantic Model Build

Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写统一 Candidate——Architecture 与 Element Contracts 一体表达目标模型；由 CLI 对 Candidate 做只读确定性校验并给出 review digest；用户确认该版本后，由 CLI 将 Candidate 原子提升为 Semantic Model，并保留必要 history。本过程不通过 Change 的 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。临时 scaffolding 不定义 durable 语义。

## 2. Change Realization

Change Realization 是 Realization 推进过程中落实单次 Change 的过程。它通过 Change Formation 形成完整 Change，通过 Change Implementation 实现并验证，再通过 Change Closure 将经验证的 Semantic Delta 更新到 Semantic Model 并关闭 Change，使项目实现与语义模型进入新的稳定状态。

## 3. Change Formation

Change Formation 是 Change Realization 中形成完整 Change 的阶段。它在阶段内完成必要的审查与确认，并产出完整的 Semantic Delta 与 Change Plan。Change Formation 可以通过 Intent-first Path 或 Implementation-first Path 完成。

### 4. Intent-first Path

Intent-first Path 是 Change Formation 的路径之一：从用户意图出发，先形成 Change，再进入实现。该路径先通过 Explore 澄清意图、范围与影响并形成 Change 雏形，再通过 Propose 将雏形收成完整 Change，最终得到可进入 Change Implementation 的 Change。

#### 5. Explore

Explore 是 Intent-first Path 的起始阶段。它基于 Semantic Model 与项目证据，澄清用户意图、范围与影响：通过 CLI 查询 Elements、Relationships 与 Element Contracts，并结合实现证据识别影响面；通过一次一问与方案比较推进设计；再分段确认设计——复杂变更逐段确认适用的 architecture、components、data flow、technology、testing 与 risks，窄变更至少确认 problem、impact scope、approach 与 verification method；最终把已确认内容收成 conversation-only 的 Design Summary 作为 Change 雏形，交由 Propose 收成完整 Change。

#### 5. Propose

Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，或在缺少 summary 时先确认 problem、impact scope、approach 与 verification method 已足够清晰；再写出完整 Change：以 Semantic Delta 表达目标语义，以 Change Plan 解释意图与实现路径，并在 Formation 内完成必要审查与确认，使 Change 可进入 Change Implementation。Propose 不实现项目。

### 4. Implementation-first Path

Implementation-first Path 是 Change Formation 的路径之一：从已发生的项目实现出发，再形成完整 Change。该路径通过 Snack 对照 Semantic Model 与实现证据，形成完整 Change。

#### 5. Snack

Snack 是 Implementation-first Path 的形成阶段。它从已发生的项目实现出发，对照 Semantic Model 形成完整 Change：通过 CLI 查询 Elements、Relationships 与 Element Contracts，并结合 conversation context、working-tree / staged / HEAD 与用户指定 diff 等实现证据识别影响面；再按证据与 Semantic Model 写出或更新 Semantic Delta，以及 Change Plan 中的 `proposal.md` 与 `design.md`，已与证据和模型一致的内容保持不变；因实现已完成，不生成 `tasks.md`。它在 Formation 内完成必要审查与确认，使已发生的实现能对照完整 Change 进入后续验证与 Change Closure。

## 3. Change Implementation

Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过独立评估与可复现证据确认项目结果与 Expected Semantic Model 一致。验证通过后，Change 可进入 Change Closure；本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。

### 4. Apply

Apply 是 Change Implementation 中落实项目改动的活动。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态，落实 Change 要求的全部项目改动；在 `tasks.md` 存在时，按照其中的执行与验证安排推进；在 Verify 返回 Required Corrections 或已确认的优化事项时，继续完成相应改动。Apply 的产出是可交由 Verify 独立评估的项目状态与可复现证据。

### 4. Verify

Verify 是 Change Implementation 中独立评估并改进项目结果的活动，由 Review 与 Optimization 共同完成。Review 在每次 Apply 修改项目后执行，由 Reviewer 评估当前项目状态是否完整、正确且一致地实现 Expected Semantic Model。Optimization 仅在 Review 通过后执行，由 Optimizer 判断当前正确实现是否存在值得执行且不改变目标语义的优化；已确认的优化事项返回 Apply 实现，项目修改后再次进入 Review。当最新项目状态通过 Review，且 Optimization 确认不存在需要继续执行的优化时，Verify 以仍然有效的验证证据确认 Change Implementation 可以进入 Change Closure。Reviewer 与 Optimizer 均作为 Internal Agents，在不受 Apply 阶段上下文影响的 clean context 中作出判断。

Verify 使用 Checkpoints 隔离已经通过 Review 的项目状态与尚未验证的优化改动。首次 Review 通过后，当前项目状态形成 baseline checkpoint；每个优化事项经 Apply 实现并重新通过 Review 后，形成新的 successful checkpoint。优化事项未通过 Review 时，项目恢复到最近的 successful checkpoint，同时保留 Review 结论、失败方向与 Optimization 历史，再基于恢复后的项目状态继续评估。只有最新项目状态已成为 successful checkpoint，Optimization 已完成且验证证据仍然有效时，Verify 才能完成并允许 Change 进入 Change Closure。

#### 5. Review

Review 是 Verify 中反复执行的正确性门禁，在每次 Apply 修改项目后进行。它由 Reviewer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行；Reviewer 独立读取 Semantic Model、Change、当前项目状态与项目证据，评估 Change 是否完整落实、项目行为是否正确、实现是否遵循 Change 的决策与项目约束，以及本次变更是否完成必要清理，并判断当前结果是否符合 Expected Semantic Model。Review 产出基于证据的结构化结论；阻塞问题形成 Required Corrections 并返回 Apply。Review 通过时，当前项目状态可以由 Verify 保存为 baseline checkpoint 或 successful checkpoint；Review 未通过时，当前项目状态不得成为 Checkpoint。Review 不创建、恢复或修改 Checkpoint，也不修改项目；其结论只适用于被评估的项目状态，此后任何项目修改都会要求重新 Review。

Reviewer 的核心原则是先证据、后结论。完成声明不构成完成证据；只有从当前项目状态中独立获得足以证明 Change 已被完整、正确落实的证据，Review 才能通过。证据缺失、证据与 Change 矛盾或证据无法覆盖目标行为时，应形成 Required Corrections 或明确的证据缺口，不得基于 Apply 的实施过程、任务勾选或 Agent 的判断推测通过。

#### 5. Optimization

Optimization 是 Verify 中对已通过 Review 并保存为 Checkpoint 的代码实现进行优化评估的阶段。它由 Optimizer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行；Optimizer 独立读取 Semantic Model、Change、最近 successful checkpoint 对应的当前代码、项目证据与既有优化记录，判断哪些不必要的复杂度可以通过删除或简化消除，以及必要工作是否可以通过更合适的算法、数据结构、控制流、I/O 或资源使用方式提高效率。每个优化事项都必须具有可说明的实际收益、充分的代码证据，并保持 Expected Semantic Model 与项目行为不变。

被选中的优化事项返回 Apply 实现；该实现在重新通过 Review 前属于 speculative state，不得推进 Checkpoint。Review 通过后，Verify 将当前项目状态保存为新的 successful checkpoint，再由 Optimization 基于该 Checkpoint 继续评估；Review 未通过时，Verify 恢复最近的 successful checkpoint，并保留该优化事项的失败结论与历史，再由 Optimization 基于恢复后的状态重新评估。当最新 successful checkpoint 不再存在需要执行的优化事项时，Optimization 完成。Optimization 不修改代码，不创建或恢复 Checkpoint；如果评估过程中发现正确性问题，则停止优化并将问题返回 Review。

Optimizer 的核心原则是优先删除不需要存在的复杂度，并优化必须存在的工作。优化事项只有在当前代码已经通过 Review、收益有证据、行为与目标语义保持不变、成本和风险与收益相称且存在可执行验证方式时才成立；无法证明收益的机会应延后，改变目标语义的建议应形成新的 Change，正确性缺陷应返回 Review，增加复杂度但没有实际收益的建议应被拒绝。

## 3. Change Closure

Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以 Change Implementation 的有效验证结果为入口，先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再通过 Archive 保存已完成的 Change 及其最终证据，并结束 Change 的活动状态。Change Closure 完成后，项目实现与 Semantic Model 共同进入新的稳定状态。

## 2. Interaction Surfaces

Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information。两种界面共同支撑 Realization，但不构成新的语义来源。

### 3. CLI

CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。

#### 4. Project and Tooling Configuration

Project and Tooling Configuration 建立和维护息壤工作区、项目配置与所选 Agent 工具集成，并持续管理息壤配置与息壤托管的 Agent 工作面。

#### 4. Deterministic Operations

Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。

### 3. Semantic Browser

Semantic Browser 是息壤的可视化语义界面。它使用 Views 呈现 Semantic Model 与 Change-derived information，使用户能够浏览不同抽象层级的 Elements、Element Contracts 与 Relationships，观察 Change 带来的语义差异，并据此理解、讨论、审查和决策项目。

## 2. Participants

Participants 是 Realization 中参与意图授权、语义判断与项目落实的行为主体。由用户与 Agents 组成：用户保留意图与关键授权；Agents 依据 Semantic Model、Change、用户决策与项目证据推进 Realization，并通过 Interaction Surfaces 完成查询、投影与确定性操作。

### 3. 用户

用户表达并确认用户意图，裁决无法仅从 Semantic Model、Change 与项目证据确定的语义与范围问题，并授权需要用户判断的重要决策与状态转换。用户不必亲自执行项目修改或确定性 CLI 操作。

### 3. Agents

Agents 是可代表息壤推进 Realization 的执行主体。它们理解 Semantic Model 与项目证据，形成或调和 Change，实现 Change，组织独立评估，并在用户授权下推进模型构建与 Change 收束。Agents 分为 Agent 与 Internal Agents。

#### 4. Agent

Agent 是与用户交互、并端到端编排 Realization 的默认执行身份。它可写入项目与 Change 制品，消费 CLI 的查询与投影，在需要时委托 Internal Agents；不得替代用户作出需明确授权的决策，也不得自行重做 CLI 已提供的确定性操作。

##### 5. Project Build

Project Build 是 Agent 构建或重建 Semantic Model 的工作身份。它在用户授权的探索范围与声明的权威依据下，编写统一 Candidate（Architecture 与 Element Contracts 一体），使用 CLI 做只读校验，向用户呈现 valid Candidate 与 review digest；仅在用户确认后，由 CLI 将 Candidate 原子提升为 Semantic Model。临时 scaffolding（如 `build.md`）不定义 durable 语义。

##### 5. Explore

Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围与影响的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进设计确认，产出 conversation-only 的 Design Summary 作为 Change 雏形，不写入完整 Change，也不实现项目。

##### 5. Propose

Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它写出 Semantic Delta 与 Change Plan，并在 Formation 内完成必要审查与确认，使 Change 可进入实现；不实现项目，不以 Delta 更新 Semantic Model。

##### 5. Snack

Snack 是 Agent 在 Implementation-first Path 中、从已发生实现出发形成或调和 Change 的工作身份。它对照 Semantic Model 与实现证据写出或更新 Semantic Delta 以及 Plan 中的意图与决策说明；因实现已完成，不生成执行任务清单。它使已有实现能对照完整 Change 进入后续验证与收束。

##### 5. Apply

Apply 是 Agent 落实 Change 所描述项目改动的工作身份。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态修改项目；在存在执行安排时按安排推进，并处理 Verify 返回的 Required Corrections 与已确认优化事项。产出是可交由独立评估的项目状态与可复现证据。

##### 5. Archive

Archive 是 Agent 在验证有效后编排 Change Closure 的工作身份。它确认入口条件已满足，协调 CLI 将 Semantic Delta 应用于 Semantic Model，并保存已完成 Change 及其最终证据、结束 Change 的活动状态。Archive 不重新判定目标语义，也不替代 CLI 的原子状态转换。

#### 4. Internal Agents

Internal Agents 在与 Agent 隔离的 clean context 中承担无法由 CLI 确定性操作替代的独立判断。它们通常只读，输出结构化结论供 Agent 消费；不修改项目，不关闭 Change，不提升 Semantic Model。影响发现、模型导航与关系查询由 CLI 与 Semantic Browser 承担。

##### 5. Reviewer

Reviewer 评估当前项目状态是否完整、正确且一致地实现 Expected Semantic Model。它独立读取 Semantic Model、Change、项目状态与证据，先证据、后结论；阻塞问题形成 Required Corrections 返回 Apply。Review 通过时，当前状态才有资格成为 Checkpoint；Reviewer 不创建或恢复 Checkpoint，不修改项目。

##### 5. Optimizer

Optimizer 在已通过 Review 并保存为 Checkpoint 的实现上，评估是否存在值得执行且不改变目标语义的优化。它输出可说明收益与证据的优化事项，由 Apply 实现后再经 Review；不修改代码，不推进 Checkpoint。正确性问题返回 Review；改变目标语义的建议应形成新的 Change。
