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
│   │       └── 4. Requirement
│   │           └── 5. Scenario
│   ├── 2. Relationships
│   └── 2. Views
│       ├── 3. View Composition
│       │   ├── 4. Authored Views
│       │   └── 4. Derived Views
│       │       ├── 5. Model View
│       │       └── 5. Change-derived Views
│       └── 3. View Presentation
│           ├── 4. Visual Presentation
│           └── 4. Text Presentation
└── 1. Change
    ├── 2. Semantic Delta
    │   └── 3. Semantic Delta Entry
    └── 2. Change Plan

Realization（落实过程）
└── 1. Realization

    推进过程
    ├── 2. Semantic Model Build
    └── 2. Change Realization
        ├── 3. Change Formation
        │   ├── 4. Intent-first Path
        │   │   ├── 5. Explore
        │   │   │   ├── 6. Definition Framing
        │   │   │   │   └── 7. Change Structural Definition
        │   │   │   └── 6. Design Exploration
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
        │   │   ├── 5. 工作区初始化与更新
        │   │   ├── 5. 项目配置管理
        │   │   ├── 5. Agent 工具集成选择与维护
        │   │   └── 5. Agent 工作面投影与同步
        │   └── 4. Deterministic Operations
        │       └── 5. Definition Framing Operations
        └── 3. Semantic Browser
```

## 0. Project Definition

息壤（Xirang）是面向 Agent 的项目开发框架：它以 Semantic Model 结构化表达用户意图，以 Change 承载新的演进意图，并通过 Realization 由 Agent 落实 Change、持续构建和演进项目。

还有一个挺好的描述：   Xirang 是面向 Agent 软件开发的人类意图编程框架。它持续维护“项目应该是什么、应该如何变化”，让 Agent 基于统一的项目认知完成需求探索、方案形成、代码实现、独立审查和变更收束。


## 1. Semantic Model

Semantic Model 是项目用户意图的结构化语义表达。它以帮助用户从不同抽象层级理解、讨论和决策项目为首要目标，并为 Agent 导航、验证、实现和持续演进项目提供明确的语义依据。

模型在可扩展 Metamodel 的约束下，以 Hierarchical Elements 表达任意深度的项目抽象。每个 Element 由 Element Declaration 与 Element Contract 共同表达：Element Declaration 定义其身份、类型、概要及层级位置，Element Contract 规范其职责、保证、约束与行为。Relationships 表达 Elements 之间的协作、依赖与约束；Views 面向用户组织和呈现模型，但不改变模型的规范性语义。

Semantic Model 完整持久化于 `.xirang/model/`。Element Declarations 与 Element Contracts 共同表达 Elements，必须联合理解和验证；Authored Views 通过 View Definition Files 持久化，用于呈现模型，但不改变模型的规范性语义。

identity 是引用语义对象的唯一依据。语法位置、文件路径与目录结构都不构成 identity，也不表达 Element 的层级位置。具体的存储形态与记法由 `xirang-contract.md` 规定。

## 2. Metamodel

Metamodel 定义 Semantic Model 使用的语义记法。它声明用于表达 Hierarchical Elements 的 Element Kinds，以及用于表达 Elements 之间关系的 Relationship Kinds，并可为每种 Kind 定义其所有实例共享的语义。

每个 Element Kind 与 Relationship Kind 都具有稳定 identity。相同 identity 跨模型状态表示同一个 Kind，其共享语义可以发生改变；Kind identity 发生变化则表示旧 Kind 与新 Kind，而不是同一个 Kind 的名称变化。

## 2. Hierarchical Elements

Hierarchical Elements 是以层级结构组织的项目抽象。每个 Element 表达项目在某一抽象层级上可独立理解的语义单元，并由 Element Declaration 与 Element Contract 共同表达。父 Element 表达较高层抽象，子 Element 对其进一步精化，由此形成从 Project Root 开始、可任意深入的抽象结构。

### 3. Element Declaration

Element Declaration 定义 Element 在 Semantic Model 中的结构身份。它声明 Element 的稳定身份、Element Kind、作者定义的概要以及其在 Hierarchical Elements 中的层级位置。

### 3. Element Contract

Element Contract 定义 Element 在一个确定模型状态中、其自身抽象层级上的完整规范性语义。它以该模型状态自身为视角，描述 Element 承担的职责、提供的保证、遵循的约束与表现的行为，只包含在该状态下成立的语义，不包含相对于其他模型状态的新增、修改、删除等变更叙述。Element Contract 可以表达由 children 进一步精化或共同实现的职责、保证、约束与行为；这种跨层语义覆盖是允许的。

完整性以 Element 自身的抽象层级为边界：用户与 Agent 无需读取 children Contracts，即可理解并判断该 Element 在该层级作出的规范承诺。Children Contracts 进一步精化这些承诺如何实现，而不用于补充父 Element 在父层级遗漏的语义。

当某项语义被移除时，更新后的 Element Contract 直接不再包含该项语义，而不是保留“删除某项语义”“某项语义已被删除”或其他描述变更过程的内容。

一个 Element 至多对应一个 Element Contract。Element 是否必须具有 Element Contract，由其 Element Kind 在 Metamodel 中声明的 contract policy 决定。

#### 4. Requirement

Requirement 是 Element Contract 中具有稳定 identity 的规范性语义条目，用于表达宿主 Element 在自身抽象层级上的一项可独立演进的职责、保证、约束或行为。可独立演进，是指该项语义能够独立新增、修改或移除，而不要求同一 Contract 中其他 Requirements 同时发生语义变化。

##### 5. Scenario

Scenario 是 Requirement 的规范性组成，用于表达该 Requirement 在特定条件下应表现的行为。Scenario 只能具体化宿主 Requirement 已定义的规范承诺，不得引入可独立演进的职责、保证、约束或行为。每个 Scenario 都具有规范约束力，但一个 Requirement 下的 Scenarios 不默认穷尽该 Requirement 的全部适用情况；未单独列出的情况仍由 Requirement 的一般规范语义约束。Scenario 从属于 Requirement，不作为独立 Semantic Delta Entry。

## 2. Relationships

Relationships 是 Elements 之间显式的、类型化的语义联系。每个 Relationship 连接 source Element 与 target Element，并使用由 Metamodel 声明的 Relationship Kind，表达 Elements 之间的协作、依赖或约束。Relationships 的方向与 Kind 共同表达其语义，并补充 Hierarchical Elements 无法表达的联系。

Relationship 的稳定 identity 由 source Element identity、Relationship Kind identity 与 target Element identity 按方向共同确定。任一组成发生变化，都表示一个不同的 Relationship。

Relationship 的 identity 即其全部内容。它不包含任何可在 identity 保持不变的前提下改变的内容，因此不存在“同一 Relationship 内容发生变化”的状态。

## 2. Views

Views 是 Semantic Model 面向用户的呈现层。View 面向特定的理解、讨论、审查或决策目的，选择、组织并呈现 Semantic Model 的语义对象及与 Change 相关的派生信息。

View 可以采用可视化、交互式或人类可读文本形式；仅供程序消费的结构化数据不属于 View。

Views 不引入规范性语义，也不改变或替代 Semantic Model 与 Change 所表达的规范性语义。Views 同时具有 View Composition 与 View Presentation 两个独立维度：前者区分 Authored Views 与 Derived Views，后者区分 Visual Presentation 与 Text Presentation。

### 3. View Composition

View Composition 是 Views 按呈现视角的形成方式划分的组成维度。每个 View 要么由用户显式声明而成为 Authored View，要么由 Semantic Model 或 Change 确定性派生而成为 Derived View。

Authored 与 Derived 共同构成 Views，并且一个 View 不同时属于两类。View 的组成方式独立于其采用的呈现方法。

#### 4. Authored Views

Authored Views 是由用户显式声明并作为 Semantic Model 组成持久化的 Views。Authored View 记录用户选择的呈现视角，规定需要选择和组织的语义信息。

Authored View 的声明可以持续存在并具有稳定 identity，但不为其呈现的语义对象增加规范性语义。

#### 4. Derived Views

Derived Views 是由 Semantic Model 或 Change 确定性派生的 Views。Derived View 无需用户声明，其内容随派生依据变化而重新确定。

Derived View 不作为 Semantic Model 或 Change 的 durable artifact 持久化，也不作为 Semantic Delta Entry 的作用对象；系统可以生成可从当前输入重建的运行时表示或缓存。当前包括 Model View 与 Change-derived Views。

##### 5. Model View

Model View 是由当前 Semantic Model 确定性派生的默认 View，稳定 identity 为 `model`。其层级 focus 与导航历史属于运行时呈现状态，不形成额外 View。

##### 5. Change-derived Views

Change-derived Views 是面向一个 Change，由当前 Semantic Model 与该 Change 确定性派生的 Derived Views。它组织并呈现该 Change 的目标语义，以及目标语义相对于当前 Semantic Model 的变化，使用户能够理解、讨论、审查和决策该 Change。

### 3. View Presentation

View Presentation 是 Views 按语义信息如何传达给用户划分的呈现维度。View 可以采用 Visual Presentation、Text Presentation，或者同时提供两种呈现方法。

呈现方法不改变 View 的呈现视角、组成方式或所依据的规范性语义。同一个 View 的不同呈现方法应表达同一呈现视角，但可以根据媒介特性采用不同的组织与交互形式。

#### 4. Visual Presentation

Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义。

图形布局、视觉样式与交互状态只服务于呈现，不构成新的规范性语义。

#### 4. Text Presentation

Text Presentation 是通过人类可读文本向用户传达 View 所组织语义信息的呈现方法。它可以使用标题、段落、列表、表格或文本差异等形式组织内容，使用户能够阅读、引用和审查 View。

文本的排版、措辞与输出载体只服务于呈现，不构成新的规范性语义。仅供程序消费的结构化数据不属于 Text Presentation。

## 1. Change

息壤通过连续的 Changes 演进项目。每个 Change 由 Semantic Delta 与 Change Plan 组成：Semantic Delta 将新的用户意图规范化为针对 Semantic Model 的新增、修改或移除语义集合，与 Semantic Model 共同推导 Expected Semantic Model；Change Plan 记录该 Change 的意图、决策与执行安排。

## 2. Semantic Delta

Semantic Delta 是 Change 的规范性组成，由一组相对于当前 Semantic Model 声明的 Semantic Delta Entries 构成。它与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

每个 Entry 自身声明其作用的 entity type，Semantic Delta 持久化于 `.xirang/changes/<change>/`，其存储形态与记法由 `xirang-contract.md` 规定。

Semantic Delta 使用的修改语为 ADDED、MODIFIED 与 REMOVED。

ADDED 与 MODIFIED 携带对应实体在 Expected Semantic Model 中的完整目标内容。该内容必须能够直接成为 Expected Semantic Model 的组成部分，只描述该模型状态下成立的规范性语义，不得叙述新增、修改、删除等变化过程。REMOVED 只声明需要移除实体的 identity，不携带内容。同一 identity 在一个 Semantic Delta 中不允许冲突操作。

Semantic Delta 应用后，Expected Semantic Model 只保留应用结果，不保留修改语、操作记录或变更历史。

### 3. Semantic Delta Entry

Semantic Delta Entry 是 Semantic Delta 的组成单位。每个 Entry 由修改语、entity type 与 identity 构成：修改语确定应用方式，entity type 与 identity 共同确定作用对象。

Entry 的 entity type 覆盖 Element Declaration、Requirement、Relationship、Element Kind、Relationship Kind 与 Authored View。同一个 Semantic Delta 中的全部 Entries 一并应用于当前 Semantic Model，共同确定 Expected Semantic Model。

Element 的稳定 identity 跨模型状态指向同一个 Element；Element Kind、概要与层级位置是该 Element 在一个确定模型状态中的声明内容，可以在 identity 保持不变的情况下发生改变。

作用于 Element Contract 的 Entry 以 Requirement 为对象，而不是整份 Contract。

作用于 Relationship 的 Entry 以 source Element identity、Relationship Kind identity 与 target Element identity 构成的 identity 识别对象。任一组成发生变化，表示旧 Relationship 与新 Relationship 之间的差量，而不是同一 Relationship 内容的变化；由于 Relationship 的 identity 即其全部内容，作用于它的 Entry 只有 ADDED 与 REMOVED。

作用于 Metamodel 的 Entry 以 Element Kinds 与 Relationship Kinds 的稳定 identity 识别对象。相同 identity 的 Kind 可以具有不同的共享语义；不同 identity 表示旧 Kind 与新 Kind，而不是同一个 Kind 的名称变化。由于 Kind 为所有实例提供共享语义，其变化的影响不限于该 Kind 自身：目标 Metamodel 必须与 Expected Semantic Model 中的 Element Declarations 和 Relationships 联合理解。

Semantic Delta Entries 属于 Change，不成为 Semantic Model 的组成。它们以差量形式确定目标内容，而目标内容只表达 Expected Semantic Model 状态下成立的规范性语义，不承载差量操作或变更历史。

## 2. Change Plan

Change Plan 是 Change 的辅助性组成。它通过 `proposal.md`、`design.md` 与 `tasks.md` 共同解释该 Change 的意图与路径：`proposal.md` 说明为何发起 Change 及其范围与影响面；`design.md` 记录关键决策、理由与实现策略；`tasks.md` 安排执行步骤与验证检查。Change Plan 帮助用户审查 Change，并帮助 Agent 生产与执行 Semantic Delta，但不独立定义目标语义；当它与 Semantic Delta 冲突时，以 Semantic Delta 为准。

## 1. Realization

Realization 是息壤的落实过程维。在推进过程上，它通过 Semantic Model Build 构建或重建 Semantic Model，通过 Change Realization 将已授权 Change 落实为项目新状态并收束；在协作结构上，由 Participants 承担授权、判断与编排，由 Interaction Surfaces 提供配置、呈现与确定性操作。

推进过程与协作结构是两个相互关联的描述维度。推进过程中的 Activity 或 Stage 在自身层级完整描述工作的入口、推进、约束与结果；协作结构中的 Participant 或 Agent 工作身份在自身层级完整描述其授权、责任、判断、操作、协调与交付。Agent 工作身份可以描述其所承担 Activity 的相关语义；这种跨维度语义覆盖是允许的，两个维度都不作为另一个维度的差量表达。

`responsible-for` 从 Participant 或工作身份指向其承担职责的 Activity 或 Stage。该关系表示职责关联，不表示 source 独占或独自执行 target，也不转移用户、CLI 或其他 Participants 在该过程中的职责。

## 2. Semantic Model Build

Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model；由 CLI 对 Candidate 做只读确定性校验并给出 review digest；用户确认该版本后，由 CLI 将 Candidate 原子提升为 Semantic Model，并保留必要 history。本过程不通过 Change 的 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。临时 scaffolding 不定义 durable 语义。

## 2. Change Realization

Change Realization 是 Realization 推进过程中落实单次 Change 的过程。它通过 Change Formation 形成完整 Change，通过 Change Implementation 实现并验证，再通过 Change Closure 将经验证的 Semantic Delta 更新到 Semantic Model 并关闭 Change，使项目实现与语义模型进入新的稳定状态。

## 3. Change Formation

Change Formation 是 Change Realization 中形成完整 Change 的阶段。它在阶段内完成必要的审查与确认，并产出完整的 Semantic Delta 与 Change Plan。Change Formation 可以通过 Intent-first Path 或 Implementation-first Path 完成。

### 4. Intent-first Path

Intent-first Path 是 Change Formation 的路径之一：从用户意图出发，先形成 Change，再进入实现。该路径先通过 Explore 澄清意图、范围与影响并形成 Change 雏形，再通过 Propose 将雏形收成完整 Change，最终得到可进入 Change Implementation 的 Change。

#### 5. Explore

Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计，并形成不持久化的 Design Summary。当用户选择先处理 Change 的结构定义时，Explore 先进入 Definition Framing，形成 Change Structural Definition。

Change Structural Definition 存在时，Design Exploration 以其中已确认的结构内容为依据推进设计；结构内容发生变化时，相关设计重新进入确认。完成 Design Exploration 后，Change Structural Definition 与 Design Summary 共同构成 Change 雏形。Change Structural Definition 不存在时，Design Summary 独立构成 Change 雏形。Change 雏形交由 Propose 收成完整 Change；Explore 不实现项目，也不形成完整 Change。

##### 6. Definition Framing

Definition Framing 是 Explore 中由用户选择进入的推荐阶段，用于在 Design Exploration 前先处理 Change 的结构定义。它以 Semantic Model 与项目证据为依据，通过因果定义、identity 与边界澄清、单维度分解和按 BFS 顺序确认同层结构，逐步确认 Change 涉及的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships。

Definition Framing 只将用户通过明确的持久化确认授权的完整当前目标持久化为 Change Structural Definition。完成 Definition Framing 后，Design Exploration 以 Change Structural Definition 中已确认的结构内容为依据推进设计；已持久化结构发生变化时，依赖原结构的设计内容重新进入确认。

###### 7. Change Structural Definition

Change Structural Definition 由 Definition Framing 形成，用于在 Propose 之前持久化表达用户已确认的当前完整结构目标。它以 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 表达结构内容，并保存用于识别 Semantic Model 相关变化的基准快照；它不独立确定 Expected Semantic Model，也不是完整 Semantic Delta。

Explore 期间，Change Structural Definition 以受 CLI 管理的隐藏文件持久化并只保留最新确认状态。Propose 将其中的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 分别编译为相应的 Semantic Delta Entries；编译完成后保留在 Change directory 中的 `change-structural-definition.md` 只记录形成历史，不参与后续语义解析、validation、sync 或 Change Closure。

##### 6. Design Exploration

Design Exploration 是 Explore 中澄清和确认设计的阶段。它基于 Semantic Model 与项目证据，通过一次一问和方案比较推进设计；复杂变更分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks，窄变更至少确认 problem、impact scope、approach 与 verification method。

Change Structural Definition 存在时，Design Exploration 将其中已确认的结构内容作为设计依据；Change Structural Definition 不存在时，Design Exploration 直接基于 Semantic Model 与项目证据完成设计，不以运行 Definition Framing 为前提。设计过程中用户选择先处理结构定义时，Explore 进入 Definition Framing，并在结构确认后继续相关设计。适用设计内容全部确认后，Design Exploration 形成不持久化的 Design Summary，交由 Propose 使用。

#### 5. Propose

Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的 Change Structural Definition；缺少 Design Summary 时，Propose 先确认 problem、impact scope、approach 与 verification method 已足够清晰。

Change Structural Definition 存在时，Propose 将其中已确认的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 分别编译为相应的 Semantic Delta Entries，并根据 Design Summary 形成其余目标语义；Change Structural Definition 不存在时，Propose 根据 Semantic Model 与已确认设计直接形成完整 Semantic Delta。两条路径均由 Propose 写出完整 Change Plan，并在 Formation 内完成必要审查与确认，使 Change 可进入 Change Implementation。Propose 不实现项目，也不将 Semantic Delta 更新到 Semantic Model。

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

Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以 Change Implementation 的有效验证结果为入口，先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再通过 Archive 原样保存已完成的 Change 及其最终证据，并结束 Change 的活动状态。Archive 不创建、重算或覆盖任何 View presentation artifact。Change Closure 完成后，项目实现与 Semantic Model 共同进入新的稳定状态。

## 2. Interaction Surfaces

Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information。CLI 支持 Text Presentation，Semantic Browser 支持 Visual Presentation；两种界面共同支撑 Realization，但不构成新的语义来源，也不表示某种呈现方法被某一界面独占。

### 3. CLI

CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。

#### 4. Project and Tooling Configuration

Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。

#### 4. Deterministic Operations

Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。

细节层面：

对 Change 的 CLI 文本差异呈现通过 `xirang validate --change` 提供只读预览与 JSON summary，不注册独立 Diff command，也不将该差异持久化为 Change artifact。

Definition Framing 相关 CLI operations 管理 Change Structural Definition 的持久化、查询、校验和生命周期转换，并根据其中记录的 Semantic Model 基准快照识别相关结构是否发生变化。

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

Project Build 是 Agent 构建或重建 Semantic Model 的工作身份。它在用户授权的探索范围与声明的权威依据下，编写完整的 Candidate Semantic Model，使用 CLI 做只读校验，向用户呈现 valid Candidate 与 review digest；仅在用户确认后，由 CLI 将 Candidate 原子提升为 Semantic Model。临时 scaffolding（如 `build.md`）不定义 durable 语义。

##### 5. Explore

Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，形成不持久化的 Design Summary；用户选择先处理 Change 的结构定义时，它先推进 Definition Framing。

Definition Framing 中，Explore 通过 CLI 持久化用户明确确认的 Change Structural Definition，不直接管理其存储文件。除 Change Structural Definition 外，Explore 不写入 Change 制品；它不形成完整 Change，也不实现项目。

##### 5. Propose

Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它以已确认设计为依据形成 Change，并复用 Explore 已形成的 Design Summary。Explore 形成了 Change Structural Definition 时，Propose 通过 CLI 将该定义纳入目标 Change，并把其中已确认的结构目标编译为相应的 Semantic Delta Entries；Explore 未形成 Change Structural Definition 时，Propose 直接依据 Semantic Model 与已确认设计形成 Semantic Delta。

Propose 写出完整 Semantic Delta 与 Change Plan，并在 Change Formation 内完成必要审查与确认，使 Change 可进入实现。它不实现项目，也不以 Semantic Delta 更新 Semantic Model。

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
