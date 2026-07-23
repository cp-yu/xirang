# OPSX Definition

## Definition Hierarchy

```text
0. Project Definition
├── 1. OPSX Semantic Model
└── 1. Change
```

## 0. Project Definition

OPSX 是面向 Agent 的项目开发框架：它以 OPSX Semantic Model 结构化表达 human intent，并把新的 human intent 转为可被 Agent 实现的 Change，从而持续构建和演进项目。

## 1. OPSX Semantic Model

OPSX Semantic Model 是项目 human intent 的结构化、规范性表达。它以帮助人理解、讨论和决策项目为首要目标，并为 Agent 导航、验证、实现和持续演进项目提供明确的语义依据。

模型在可扩展 Metamodel 的约束下，以 Elements 表达任意深度的抽象，以 Element Contracts 规范每个抽象的职责、保证、约束与行为，并以 Relationships 表达 Elements 之间的协作、依赖与约束。

因此，项目在每一个抽象层级上都具有明确、可独立理解、可继续精化、可导航、可验证且可持续演进的规范语义。

在持久化形式上，Architecture modules 表达 Metamodel、Elements 及其层级和 Relationships，Specs 表达绑定到 Elements 的 Element Contracts；两类 source modules 必须作为同一个 OPSX Semantic Model 联合理解和验证。

## 1. Change

OPSX 通过连续的 Changes 演进项目。每个 Change 将新的 human intent 与当前 Formal OPSX Semantic Model 对照，把需要新增、修改或移除的语义表达为 Semantic Delta。Semantic Delta 与当前模型共同构成 Target OPSX Semantic Model，Agent 依据该目标模型实现和验证可运行项目的新状态。Change 完成后，经确认的 Semantic Delta 更新 Formal OPSX Semantic Model，项目实现与语义模型一同进入新的稳定状态。

