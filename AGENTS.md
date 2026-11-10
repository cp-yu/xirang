# 息壤（Xirang）项目定义

## Definition Hierarchy

```text
0. Project Definition

语义对象
├── 1. Semantic Model
│   ├── 2. Metamodel
│   ├── 2. Hierarchical Elements
│   │   ├── 3. Element Declaration
│   │   └── 3. Element Contract
│   │       └── 4. Section
│   │           └── 5. Acceptance Case
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
        │   │   │   ├── 6. Design Record
        │   │   │   │   └── 7. 已确认设计记录
        │   │   │   └── 6. Design Exploration
        │   │   └── 5. Propose
        │   └── 4. Implementation-first Path
        │       └── 5. Snack
        ├── 3. Change Implementation
        │   ├── 4. Apply
        │   └── 4. Quality
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
    │           ├── 5. Optimizer
    │           └── 5. Experimenter
    └── 2. Interaction Surfaces
        ├── 3. CLI
        │   ├── 4. Project and Tooling Configuration
        │   │   ├── 5. 工作区初始化与更新
        │   │   ├── 5. 项目配置管理
        │   │   ├── 5. Agent 工具集成选择与维护
        │   │   └── 5. Agent 工作面投影与同步
        │   └── 4. Deterministic Operations
        │       └── 5. Design Record Operations
        └── 3. Semantic Browser
```

## 0. Project Definition

息壤（Xirang）是面向 Agent 的项目开发框架：它以 Semantic Model 结构化表达用户意图，以 Change 承载新的演进意图，并通过 Realization 由 Agent 落实 Change、持续构建和演进项目。

Xirang 是面向 Agent 软件开发的人类意图编程框架。它持续维护“项目应该是什么、应该如何变化”，让 Agent 基于统一的项目认知完成需求探索、方案形成、代码实现、独立审查和变更收束。


## 1. Semantic Model

Semantic Model 是项目用户意图的结构化语义表达。它以帮助用户从不同抽象层级理解、讨论和决策项目为首要目标，并为 Agent 导航、验证、实现和持续演进项目提供明确的语义依据。

模型在可扩展 Metamodel 的约束下，以 Hierarchical Elements 表达任意深度的项目抽象。每个 Element 由 Element Declaration 与 Element Contract 共同表达：Element Declaration 定义其身份、类型、概要及层级位置，Element Contract 规范其职责、保证、约束与行为。Relationships 表达 Elements 之间的协作、依赖与约束；Views 面向用户组织和呈现模型，但不改变模型的规范性语义。

Semantic Model 完整持久化于 `.xirang/model/` 的 `metamodel/`、`elements/`、`relationships/` 与 `views/` 四个分区。每个 Element 单元同时承载其 Element Declaration（frontmatter）与至多一份 Element Contract（正文 `## Specification`），两者必须联合理解和验证；Authored Views 通过 View Definition Files 持久化，用于呈现模型，但不改变模型的规范性语义。

identity 是引用语义对象的唯一依据。语法位置、文件路径与目录结构都不构成 identity，也不表达 Element 的层级位置。

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

业务规格类 Element 使用声明 `contract: required` 与 `contractFormat: business-specification` 的 Kind，其 Contract 必须包含四个固定英文标题 Section：`Scope and Non-goals`、`Business Logic`、`Edge Cases and Exception Handling`、`Key Acceptance Cases`。关联机制与图示集中在 Business Logic；+N 仅承载值得独立维护的内容，名称自由。Key Acceptance Cases 必须包含非空 Acceptance Case，作为 TDD 的规范依据。CLI 根据 Kind 声明检查完整模型中的必要结构，不通过正文猜测适用范围；框架概念与组织性 Element 不自动适用。

#### 4. Section

Section 是 Element Contract 中具有稳定 identity 的规范性语义单元，用于表达宿主 Element 在自身抽象层级上的一项可独立演进的职责、保证、约束或行为。可独立演进，是指该项语义能够独立新增、修改或移除，而不要求同一 Contract 中其他 Sections 同时发生语义变化。Section 是业务规格的顶层大点，组内内容以自由载体完整表达，不限定表达形式，也不要求固定的子标题结构。

##### 5. Acceptance Case

Acceptance Case 是「关键验收案例」Section 内部的结构子单元，用于表达该 Section 在特定条件下的可观察验收结果，可直接交付测试团队转化为自动化测试契约。它只能具体化宿主 Section 已定义的规范承诺，不得引入可独立演进的语义；它不作为独立 Semantic Delta Entry。Acceptance Case 不是通用结构要求：它只属于承载验收用例的 Section，其它 Sections 内部不受其约束。

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

每个 Entry 自身声明其作用的 entity type，Semantic Delta 持久化于 `.xirang/changes/<change>/`，其存储形态与记法与本定义的规范对象结构一致。

Semantic Delta 使用的修改语为 ADDED、MODIFIED 与 REMOVED。

ADDED 与 MODIFIED 携带对应实体在 Expected Semantic Model 中的完整目标内容。该内容必须能够直接成为 Expected Semantic Model 的组成部分，只描述该模型状态下成立的规范性语义，不得叙述新增、修改、删除等变化过程。REMOVED 只声明需要移除实体的 identity，不携带内容。同一 identity 在一个 Semantic Delta 中不允许冲突操作。

Semantic Delta 应用后，Expected Semantic Model 只保留应用结果，不保留修改语、操作记录或变更历史。

### 3. Semantic Delta Entry

Semantic Delta Entry 是 Semantic Delta 的组成单位。每个 Entry 由修改语、entity type 与 identity 构成：修改语确定应用方式，entity type 与 identity 共同确定作用对象。

Entry 的 entity type 覆盖 Element Declaration、Section、Relationship、Element Kind、Relationship Kind 与 Authored View。同一个 Semantic Delta 中的全部 Entries 一并应用于当前 Semantic Model，共同确定 Expected Semantic Model。

Element 的稳定 identity 跨模型状态指向同一个 Element；Element Kind、概要与层级位置是该 Element 在一个确定模型状态中的声明内容，可以在 identity 保持不变的情况下发生改变。

作用于 Element Contract 的 Entry 以 Section 为对象，而不是整份 Contract。

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

Change Realization 是 Realization 推进过程中落实单次 Change 的过程。它通过 Change Formation 形成完整 Change，通过 Change Implementation 实现并经 Quality 验证，再通过 Change Closure 将经验证的 Semantic Delta 更新到 Semantic Model 并关闭 Change，使项目实现与语义模型进入新的稳定状态。

## 3. Change Formation

Change Formation 是 Change Realization 中形成完整 Change 的阶段。它在阶段内完成必要的审查与确认，并产出完整的 Semantic Delta 与 Change Plan。Change Formation 可以通过 Intent-first Path 或 Implementation-first Path 完成。

### 4. Intent-first Path

Intent-first Path 是 Change Formation 的路径之一：从用户意图出发，先形成 Change，再进入实现。该路径先通过 Explore 澄清意图、范围与影响并形成 Change 雏形，再通过 Propose 将雏形收成完整 Change，最终得到可进入 Change Implementation 的 Change。

#### 5. Explore

Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中通过 Design Record 随用户确认记录关键设计，用户的设计确认即授权记录该部分内容。适用设计已确认且记录冲突已解决后，Explore 形成不持久化的 Design Summary。

已确认设计记录存在时，Design Exploration 以其中已确认的内容为依据推进设计；记录内容发生变化时，依赖它的设计重新进入确认。完成 Design Exploration 后，已确认设计记录与 Design Summary 共同构成 Change 雏形；记录不存在时，Design Summary 独立构成 Change 雏形。Change 雏形交由 Propose 收成完整 Change；Explore 不实现项目，也不形成完整 Change。

##### 6. Design Record

Design Record 是项目意图形成过程中随设计确认记录用户已确认意图的方法，为 Semantic Model Build 与 Explore 提供共同的记录方式，并为 Propose 与 Build 的编译提供确认依据。用户的设计确认即构成记录授权：Agent 在确认后立即记录，只报告本次变更与记录概况，修改已确认内容时单独标出，冲突先由用户裁决。每条记录须让下游不看会话即可写出 Contract 与 Acceptance Case，保留条件、数值、例外、时序与原样的正反例；已确认的组件结构写入记录的结构部分。交接前落定记录、豁免或无 normative 内容三者之一。消费方按写作规则编译记录，并把每条 normative 条目拆成原子细节逐项给出目标位置，经 CLI 门禁记录后才能交接。结构形成由可配置的分解指导负责，不属于 Design Record。

###### 7. 已确认设计记录

已确认设计记录由 Design Record 形成，是独立承载下游须遵循的用户确认内容的精简中间制品。它由两部分组成：以自由文本记录细节的条目，以及与 Semantic Model 同形、按语义 identity 定位、表达目标状态的结构部分（`removed: true` 表示确认删除，未提及即未确认）；并保存用于识别 Semantic Model 相关变化的基准快照。它不独立确定 Expected Semantic Model，也不是 Semantic Delta。

形成期间，记录以受 CLI 管理的文件持久化于 `.xirang/records/`，按部分更新并只保留最新确认状态。交接后保留在目标中的 `record-source.md` 与 `record-coverage.json` 只记录形成历史，不参与后续语义解析、validation、sync 或 Change Closure。

##### 6. Design Exploration

Design Exploration 是 Explore 中澄清和确认设计的阶段。它基于 Semantic Model 与项目证据，通过一次一问和方案比较推进设计；复杂变更分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks，窄变更至少确认 problem、impact scope、approach 与 verification method。

Explore 在发现相关记录、产生未豁免的规范性确认、用户要求记录或修订、或 Summary 前发现记录决策缺口时加载 Design Record 协议；普通讨论不预加载。用户确认设计内容后立即记录，不另行请求写入授权，除明确豁免外不等待用户要求记录。交接前对照完整确认内容检查记录覆盖，已有部分记录不代表后续确认已保存。Explore 主动发现行为、异常、竞争与时序等决策点，说明选项、后果与推荐理由，由用户确认；关键条件与可观察验收结果随设计确认，不仅确认技术方案或测试工具。交接前通过适用的边界或竞争序列自查设计；Design Summary 保留已确认决策的条件、数值、例外、时序与验收结果，区分推荐、未决与用户明确排除的范围。影响当前目标的未决决策阻塞交接，不由 Agent 自行延期；完整 Contract、Acceptance Cases 与 tasks 留给 Propose。

已确认设计记录存在时，Design Exploration 将其中已确认的内容作为设计依据；记录不存在时，Design Exploration 直接基于 Semantic Model 与项目证据完成设计。Design Record 随设计进行，不是设计的先行阶段。适用设计内容全部确认后，Design Exploration 形成不持久化的 Design Summary，交由 Propose 使用。

#### 5. Propose

Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录；缺少 Design Summary 时，Propose 先确认 problem、impact scope、approach 与 verification method 已足够清晰。

Propose 以忠实文档化已确认设计为主，允许展开补齐及表达、推导修正。既定范围与方案内合理推导的细节和配套保证，不改变已确认承诺且不实质改变业务结果、用户义务或架构权衡时，无需逐项确认，完成时告知依据和位置即可，不要求唯一推导；改变已确认承诺、扩大范围或重大业务及架构决策先询问用户。孤立缺口可在 Propose 内确认，大幅重做设计或修订已持久化记录时返回 Explore。自查联合对照确认来源、Delta 与 Plan，推演适用事件序列的初始状态、顺序和结果，并从每个 Check 实际需要的实现反推任务依赖；每项 Check 应仅依赖已有实现、此前已完成任务及当前任务。格式修复不新增语义。完成时在会话中区分沿用确认、Propose 补充及其依据和位置、Propose 内新确认决策与未决事项，并区分实际 CLI 结果、语义检查发现和证据缺口；重大决策的披露不替代事先确认，合理推导细节不因缺少单独确认而阻塞；制品齐全或 CLI 通过不等于语义就绪。

已确认设计记录存在时，Propose 按 Design Record 的写作规则把条目与结构部分编译为完整 Semantic Delta，并根据 Design Summary 形成其余目标语义；再按原子细节检查覆盖并经 `xirang record coverage` 与 `xirang record consume` 交接。记录不存在时，Propose 根据 Semantic Model 与已确认设计直接形成完整 Semantic Delta。两条路径均由 Propose 写出完整 Change Plan，并在 Formation 内完成必要审查与确认，使 Change 可进入 Change Implementation。Propose 不实现项目，也不将 Semantic Delta 更新到 Semantic Model。

### 4. Implementation-first Path

Implementation-first Path 是 Change Formation 的路径之一：从已发生的项目实现出发，再形成完整 Change。该路径通过 Snack 对照 Semantic Model 与实现证据，形成完整 Change。

#### 5. Snack

Snack 是 Implementation-first Path 的形成阶段。它从已发生的项目实现出发，对照 Semantic Model 形成完整 Change：通过 CLI 查询 Elements、Relationships 与 Element Contracts，并结合 conversation context、working-tree / staged / HEAD 与用户指定 diff 等实现证据识别影响面；再按证据与 Semantic Model 写出或更新 Semantic Delta，以及 Change Plan 中的 `proposal.md` 与 `design.md`，已与证据和模型一致的内容保持不变；因实现已完成，不生成 `tasks.md`。它在 Formation 内完成必要审查与确认，使已发生的实现能对照完整 Change 进入后续验证与 Change Closure。

## 3. Change Implementation

Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过 Quality 以 commit 绑定的独立 Review 意见、可选 Opt 意见与主 Agent 的 Seal 声明确认项目结果与 Expected Semantic Model 一致。Quality 完成后，Change 可进入 Change Closure；本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。

### 4. Apply

Apply 是 Change Implementation 中落实项目改动的活动。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态，落实 Change 要求的全部项目改动；在 `tasks.md` 存在时，按照其中的执行与验证安排推进；在 Quality 返回 Required Corrections 或基线缺陷证据时，继续完成相应改动并形成新的修正 commit。Apply 的产出是已提交且附可复现证据的项目状态，供 Quality 独立评估。

### 4. Quality

Quality 是 Change Implementation 中确认项目结果的阶段，由 Review 与 Optimization 共同完成，以 commit 绑定的 Review 意见、可选 Opt 意见与主 Agent 的 Seal 声明协调实现判断，并控制 Change 进入 Change Closure。Quality 按 full-change Review、主 Agent 决定的可选 Opt、Opt 处置与 Seal 顺序推进；Review opinions、Opt 处置与 Seal 持久化在每个 Change 的一个 Git-tracked Quality JSON 文档中，由 CLI 原子写入并做 revision 比对。代码修改、成功提交与恢复历史由 Git 承载；Quality 不保存代码快照、测试输出或执行进度。

实现先提交为 Git commit 并由主 Agent 运行本次所需测试后，才能执行基线 Review；至少一条通过的 full-change Review 是 Opt 与 Seal 的前置条件，但它不证明其后的改动经过独立审查。主 Agent 负责委托范围、后续投入、最终验证范围与风险判断，可自行读取代码与证据，但不替代必需的基线 Review 或基线缺陷修复后的针对性 Review。优化前先保存可恢复基线；Opt 按需保存中间状态，主 Agent 所需验证全部通过且证据仍适用当前状态时保存最终 successful checkpoint。优化引入的问题依据实际证据局部修正或撤销并验证，保留其他可靠优化，不整批回滚；无法确认局部恢复可靠时恢复到可确认基线，仍无法确认则停止并交回主 Agent。Quality 保留 Review 意见历史、Opt opinions 与已放弃方向及其原因，供后续判断并避免重复尝试。

Quality 仅在基线 Review 已通过、Opt 处置明确（已执行时包含 opinion 及 baseCommit 与 resultCommit，未执行时记录简短理由）、且主 Agent 已记录绑定 Git commit 的有效 Seal 声明时，允许 Change 进入 Change Closure。

#### 5. Review

Review 是 Quality 中由 clean-context Reviewer 独立评估已提交实现正确性的活动。每条 Review opinion 绑定一个已提交且在审查期间 HEAD 不变的 Git commit，并按 reviewKind 区分：full-change 在每个受托质量维度内覆盖完整累计 Change；incremental 评估受托的累计 Opt 改动及其受影响行为；supplemental 评估基线 Review 漏掉的原有 Change 缺陷的修复及其影响。基线 Review 未通过时，主 Agent 处理修正、形成新的修正 commit 并重新执行完整 Review；Opt 后是否追加 incremental Review 由主 Agent 按累计改动及影响的风险决定。Review 不创建、恢复或修改 checkpoint，也不修改项目；其结论只适用于被评估的项目状态，此后任何项目修改都会要求重新判断受影响的验证。

Reviewer 的核心原则是先证据、后结论。完成声明不构成完成证据；只有从当前项目状态中独立获得足以证明 Change 已被完整、正确落实的证据，Review 才能通过。证据缺失、证据与 Change 矛盾或证据无法覆盖目标行为时，应形成 Required Corrections 或明确的证据缺口，不得基于 Apply 的实施过程、任务勾选或 Agent 的判断推测通过。

#### 5. Optimization

Optimization 是 Quality 中通过可选的受托 Opt 推进实现改进的活动。是否执行 Opt 由主 Agent 决定；不执行时在 Seal 前记录 not_performed 处置与简短理由。Optimization 只在实现通过独立基线 Review 后开始，选中事项必须具有可说明的实际收益、充分的代码证据，并保持 Expected Semantic Model 与项目行为不变；改变目标语义的建议应形成新的 Change。Opt 由 fresh-context Optimizer 在委托范围内自主发现、分组、合并并实施优化，先补缺失的行为测试再修改实现，并运行局部测试验证；它以当前 Change 目标与实际影响为界，按需追踪调用与依赖，可新增、删除或移动必要的实现与测试文件，交付一条绑定 baseCommit 与 resultCommit 的 opinion，报告实际保留改动、收益与行为保持依据、测试结果、放弃及遗留事项。优化引入的问题依据 Git 中的实际代码状态局部修正或撤销；优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷交回主 Agent 安排修复，修复后经针对问题及其影响的 supplemental Review 方可收口。Opt 之后是否继续优化、是否扩大测试与追加 Review 由主 Agent 按实际风险决定。

Optimizer 的核心原则是优先删除不需要存在的复杂度，并优化必须存在的工作。优化事项只有在当前代码已经通过 Review、收益有证据、行为与目标语义保持不变、成本和风险与收益相称且存在可执行验证方式时才成立；无法证明收益的机会应延后，改变目标语义的建议应形成新的 Change，正确性缺陷应交回主 Agent 处理，增加复杂度但没有实际收益的建议应被拒绝。

## 3. Change Closure

Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以 Change Implementation 的有效 Quality 结果为入口，`xirang archive` 在归档前校验 Quality Seal 与 Sync 状态；先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再通过 Archive 原样保存已完成的 Change 及其最终证据，并结束 Change 的活动状态。Archive 不创建、重算或覆盖任何 View presentation artifact。Change Closure 完成后，项目实现与 Semantic Model 共同进入新的稳定状态。

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

Design Record Operations（`xirang record`）管理已确认设计记录的生命周期、按部分更新与版本检查、字段级差异、结构部分校验、覆盖检查结果的记录，以及带覆盖与结构比对门禁的交接，并根据记录中的 Semantic Model 基准快照识别相关上下文是否发生变化。

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

Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，形成不持久化的 Design Summary。

用户确认设计后，Explore 通过 `xirang record` 立即记录该部分已确认内容，不直接管理记录文件。除已确认设计记录外，Explore 不写入 Change 制品；它不形成完整 Change，也不实现项目。

##### 5. Propose

Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它以已确认设计为依据形成 Change，并复用 Explore 已形成的 Design Summary。存在已确认设计记录时，Propose 按写作规则把记录编译为 Semantic Delta，经 CLI 记录原子细节覆盖结果后将该记录交接给目标 Change；不存在记录时，Propose 直接依据 Semantic Model 与已确认设计形成 Semantic Delta。

Propose 写出完整 Semantic Delta 与 Change Plan，并在 Change Formation 内完成必要审查与确认，使 Change 可进入实现。它不实现项目，也不以 Semantic Delta 更新 Semantic Model。

##### 5. Snack

Snack 是 Agent 在 Implementation-first Path 中、从已发生实现出发形成或调和 Change 的工作身份。它对照 Semantic Model 与实现证据写出或更新 Semantic Delta 以及 Plan 中的意图与决策说明；因实现已完成，不生成执行任务清单。它使已有实现能对照完整 Change 进入后续验证与收束。

##### 5. Apply

Apply 是 Agent 落实 Change 所描述项目改动的工作身份。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态修改项目；在存在执行安排时按安排推进，并处理 Quality 返回的 Required Corrections 与基线缺陷证据。产出是已提交且附可复现证据的项目状态，供 Quality 独立评估。

##### 5. Archive

Archive 是 Agent 在 Quality 完成（Seal 成立）后编排 Change Closure 的工作身份。它确认入口条件已满足，协调 CLI 将 Semantic Delta 应用于 Semantic Model，并保存已完成 Change 及其最终证据、结束 Change 的活动状态。Archive 不重新判定目标语义，也不替代 CLI 的原子状态转换。

#### 4. Internal Agents

Internal Agents 在与主 Agent 隔离的上下文中接受委托、独立取得依据并交付结构化结论，由只读的 Reviewer、受托可写的 Optimizer 与 Experimenter 组成；它们不承担用户设计确认，不关闭 Change，不提升 Semantic Model。能力边界由角色指令约束而不是工具白名单或硬只读沙箱：Reviewer 的工具可用范围与主 Agent 相同，但工具能力不构成写入授权。影响发现、模型导航与关系查询由 CLI 与 Semantic Browser 承担。

##### 5. Reviewer

Reviewer 在 clean context 中评估已提交的项目状态是否完整、正确且一致地实现 Expected Semantic Model。它独立读取 Semantic Model、Change、已提交实现与证据，先证据、后结论；阻塞问题形成 Required Corrections 返回主 Agent 处理。每条 Review opinion 绑定其实际审查且审查期间 HEAD 不变的 Git commit。Reviewer 可使用与主 Agent 相同的工具获取证据（包括运行测试与检查），但工具能力不构成写入授权：它不修改项目、Change、Quality 记录或 Git history，也不创建或恢复 checkpoint。

##### 5. Optimizer

Optimizer 是受托优化执行者：在通过基线 Review 的实现上，于委托范围内自主发现、分组并实施行为保持的优化，先补缺失的行为测试再修改实现，并运行局部测试验证。它实际修改相关实现与测试并按恢复需要形成 Git commits，交付一条绑定 baseCommit 与 resultCommit 的 opinion，报告实际收益、行为保持依据与测试结果。优化引入的问题局部修正或撤销；基线 Review 漏掉的当前 Change 正确性缺陷交回主 Agent 安排修复与针对性 Review；改变目标语义的建议应形成新的 Change。

##### 5. Experimenter

Experimenter 是受 Agent 委托、通过设计和执行实验回答方案可行性问题的 Internal Agent。它独立设计并执行足以回答问题的最小实验——可在当前工作区、临时目录、项目副本或 worktree 中编写实验代码与文件并运行命令——返回方法、可复现证据、观察结果、分析及适用限制。结果供 Explore 判断可行性并继续确认设计；实验成功不等于用户采纳，它不承担用户设计确认、正式 Change 实现或模型提升。
