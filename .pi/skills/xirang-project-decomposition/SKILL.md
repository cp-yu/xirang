---
name: xirang-project-decomposition
description: 使用本项目 Perspective 维度与 MECE 精化树纪律形成 Xirang Semantic Model hierarchy。
---

# Xirang Project Decomposition

本 skill 只指导 Element hierarchy 的拆分，不覆盖用户明确意图、Formal Semantic Model、Element Contracts、Relationships、证据权威或调用 workflow 的读写边界。

本方法由两层组成，缺一不可：**Perspective 定维度**（沿什么维度切），**MECE 精化树管纪律**（怎么切——横向同层 MECE、纵向父子精化、整体单根树形）。

## 顶层边界

Project Root 的直接 children SHALL 区分两个项目定义维度：

- `semantic-objects`：项目持久表达和演进的语义对象，包括 Semantic Model 与 Change。
- `realization`：Agent 与用户如何构建、落实、验证和收束这些语义对象。

不得把 CLI、代码模块、文件目录或单次 workflow 步骤提升为第三个顶层维度。

## Realization Perspectives

`realization` SHALL 通过两个互补 Perspective 继续分解：

- `realization-process`：只按推进过程拆分，表达 Semantic Model Build、Change Formation、Change Implementation 与 Change Closure 等阶段及其细化活动。
- `collaboration-structure`：只按协作结构拆分，表达 Participants、Agents、Internal Agents 与 Interaction Surfaces 等职责和交互边界。

Perspective 是观察同一 Realization 的分解角度，不是重复 ownership。跨 Perspective 的调用、产出、约束、验证或职责协作 SHALL 使用类型化 Relationships 表达，不得通过复制 Element 或混合 sibling 维度表达。

Perspective 是 kind 为 `perspective` 的树内 Element，承载规范性语义（Declaration 与 Contract）；它不是 View/呈现投影层，也不以颜色、形状或布局定义语义。

## 分解纪律：MECE 精化树

1. **单维度**：每个 sibling set 只沿一个维度分解、只回答一个分解问题。
2. **MECE**：同一 sibling set 在该维度下保持相互独立、完全穷尽（不重、不漏）。
3. **精化**：parent 表达高层抽象，child 对其作语义精化；精化产出的是语义 Element，不是任务、构件或目录分解。
4. **BFS**：按 BFS 顺序确认完整 sibling set，再进入下一层。
5. Definition 表达稳定概念身份与边界；Contract 表达职责、保证、约束与行为。
6. 文件、symbol、import、call 与目录布局只作为实现证据，不直接决定 Element、parent 或 Relationship。
7. 当既有 Formal Semantic Model、用户意图与本方法冲突，或证据不足以唯一确定 identity、parent 或 sibling set 时，停止相关结构形成并请求用户裁决。
