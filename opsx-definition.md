# OPSX Definition

## Definition Hierarchy

```text
0. Project Definition
├── 1. OPSX Semantic Model
│   ├── 2. Metamodel
│   ├── 2. Hierarchical Elements
│   │   ├── 3. Element Declaration
│   │   └── 3. Element Contract
│   ├── 2. Relationships
│   └── 2. Views
└── 1. Change
```

## 0. Project Definition

OPSX 是面向 Agent 的项目开发框架：它以 OPSX Semantic Model 结构化表达 human intent，并把新的 human intent 转为可被 Agent 实现的 Change，从而持续构建和演进项目。

## 1. OPSX Semantic Model

OPSX Semantic Model 是项目 human intent 的结构化语义表达。它以帮助人从不同抽象层级理解、讨论和决策项目为首要目标，并为 Agent 导航、验证、实现和持续演进项目提供明确的语义依据。

模型在可扩展 Metamodel 的约束下，以 Hierarchical Elements 表达任意深度的项目抽象。每个 Element 由 Element Declaration 与 Element Contract 共同表达：Element Declaration 定义其身份、类型、概要及层级位置，Element Contract 规范其职责、保证、约束与行为。Relationships 表达 Elements 之间的协作、依赖与约束；Views 面向人组织和呈现模型，但不改变模型的规范性语义。

在存储结构上，Metamodel、Element Declarations 和 Relationships 存储于 `.opsx/architecture/`，Element Contracts 以 Specs 存储于 `.opsx/specs/`。Element Declarations 与 Element Contracts 共同表达 Elements，必须联合理解和验证。Views 通过 View Definition Files 存储，用于呈现模型，但不改变模型的规范性语义。

## 2. Metamodel

Metamodel 定义 OPSX Semantic Model 使用的语义记法。它声明用于表达 Hierarchical Elements 的 Element Kinds，以及用于表达 Elements 之间关系的 Relationship Kinds，并可为每种 Kind 定义其所有实例共享的语义。

## 2. Hierarchical Elements

Hierarchical Elements 是以层级结构组织的项目抽象。每个 Element 表达项目在某一抽象层级上可独立理解的语义单元，并由 Element Declaration 与 Element Contract 共同表达。父 Element 表达较高层抽象，子 Element 对其进一步精化，由此形成从 Project Root 开始、可任意深入的抽象结构。

## 1. Change

OPSX 通过连续的 Changes 演进项目。每个 Change 将新的 human intent 与当前 Formal OPSX Semantic Model 对照，把需要新增、修改或移除的语义表达为 Semantic Delta。Semantic Delta 与当前模型共同构成 Target OPSX Semantic Model，Agent 依据该目标模型实现和验证可运行项目的新状态。Change 完成后，经确认的 Semantic Delta 更新 Formal OPSX Semantic Model，项目实现与语义模型一同进入新的稳定状态。
