---
entity: change-structural-definition
explorationId: 20260816T135717Z-6eca3000
slug: candidate-as-change-selection
semanticModelFingerprint: f1af621df6a792194204bd1cfcd4bf8567a01859106e9b8b9a2f184df61e374c
---
elementKinds: []
relationshipKinds: []
elements:
  - identity: view-composition
    kind: perspective
    parent: views
    title: View Composition
    definition: View Composition 是 Views 按形成方式划分的组成维度。每个 View 要么由用户显式声明并持久化为 Authored View，要么由 Semantic Model 确定性派生为 Model View；两类 View 共同构成 Semantic Browser 的 View Selection。
  - identity: model-view
    kind: element
    parent: view-composition
    title: Model View
    definition: Model View 是由项目当前 Semantic Model 确定性派生、作为 Semantic Browser 默认 View Selection 的唯一全局浏览视角。它提供完整的模型选择边界，与 Authored Views 共同构成 View Selection；focus、导航历史、展开集合与布局属于运行时呈现状态，不产生其他 View identities。它不包含 Change Selection 与 Presentation Mode 的编排语义，那属于 Semantic Browser 的职责。
  - identity: semantic-browser
    kind: element
    parent: web
    title: Semantic Browser
    definition: Semantic Browser 是 Web 中面向用户的三维正交浏览编排层，将 View Selection、Change Selection 与 Presentation Mode 作为独立维度组合，形成统一的运行时呈现状态。View Selection 从 Model View 与 Authored Views 中选择当前视角；Change Selection 从活动 Changes 与唯一 active Candidate（若存在）中选择叠加内容，或选择 None；Presentation Mode 在 Change 或 Candidate 被选中时提供 complete、complete-with-diff 与 diff-only 三态，默认为 complete-with-diff，无 Change 与 Candidate 时锁定为 complete。Semantic Browser 不承载规范性语义，不持久化呈现状态，不负责投影计算与差异视觉表达。
  - operation: REMOVED
    identity: derived-views
  - operation: REMOVED
    identity: candidate-derived-view
  - operation: REMOVED
    identity: candidate-diff-derived-view
  - operation: REMOVED
    identity: change-derived-views
relationships: []
<!-- XIRANG:SEMANTIC_MODEL_BASELINE
elementKinds:
  - identity: element
    exists: true
    value:
      identity: element
      contract: optional
      body: "`element` 标识 Semantic Model 中承载规范性语义的普通 Element。层级位置与细化关系由 parent/children 决定，不因 Element Kind 受限；任何 Element 都可以在任意抽象层级出现。"
  - identity: perspective
    exists: true
    value:
      identity: perspective
      contract: optional
      nodePresentation:
        shape: document
        color: indigo
        border: solid
      body: "`perspective` 标识从一个独立分解角度组织 descendants 的 Element。Perspective 本身表达该分解角度的概念边界，children 构成该角度下的抽象或进一步 Perspectives；它不是 View，也不以颜色、形状或布局定义语义。Perspective 的层级位置与其 children 的 Element Kind 不受 Metamodel 白名单限制，由抽象与细化关系决定。"
  - identity: project
    exists: true
    value:
      identity: project
      contract: required
      root: true
      body: The single Project Root of the Semantic Model.
relationshipKinds: []
elements:
  - identity: candidate-derived-view
    exists: true
    value:
      identity: candidate-derived-view
      kind: element
      parent: derived-views
      title: Candidate View
      definition: Candidate-derived View 是由一个项目唯一的 active Candidate Semantic Model 确定性派生、用于在 promotion 前浏览完整但尚未确认的目标 Semantic Model 的唯一运行时 View。它独立建模，因为 Candidate 不是当前 Semantic Model 或 Change；包含 Candidate 四分区联合形成的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views，不包含相对当前 Semantic Model 的 diff、build.md、deterministic validation、semantic review、promotion、history 或任何持久化 Derived View artifact。
  - identity: candidate-diff-derived-view
    exists: true
    value:
      identity: candidate-diff-derived-view
      kind: element
      parent: derived-views
      title: Candidate Diff View
      definition: Candidate Diff View 是由当前 Semantic Model 与一个项目唯一的 active Candidate Semantic Model 确定性派生、专门用于审查 Candidate 相对当前 Semantic Model 语义差异的唯一运行时 View。它独立建模以将完整 Candidate 浏览与 before/after 比较分离；包含四个语义分区中的 ADDED、MODIFIED 与 REMOVED 差异及理解这些差异所需的模型上下文，不包含 build.md、deterministic validation、semantic review、promotion、history 或任何持久化 Derived View artifact。
  - identity: change-derived-views
    exists: true
    value:
      identity: change-derived-views
      kind: element
      parent: derived-views
      title: Change-derived Views
      definition: Change-derived Views 是由当前 Semantic Model、一个活动 Change 的 Semantic Delta、当前 Model 或 Authored View Selection 与 Presentation Mode 确定性推导的 runtime projections。它们面向单次演进意图呈现目标模型和语义差异，但不形成独立 View source、route 或持久 identity；其选择边界来自当前 View Selection。它们不替代当前 Semantic Model 的默认浏览、Authored View 定义、Candidate View 或 Candidate Diff View。
  - identity: collaboration-structure
    exists: true
    value:
      identity: collaboration-structure
      kind: perspective
      parent: realization
      title: 协作结构
      definition: 协作结构是按谁授权、判断、编排和操作的协作角度组织 Participants 与 Interaction Surfaces 的 Perspective。它包含用户、Agents 及其使用的界面结构，不包含落实工作的阶段顺序、入口或过程结果。
  - identity: derived-views
    exists: true
    value:
      identity: derived-views
      kind: element
      parent: view-composition
      title: Derived Views
      definition: Derived Views 是由 Semantic Model、active Candidate 或 active Change 确定性推导、无需用户声明且不作为 durable artifact 持久化的 Views 与 runtime projections。它们独立建模以区别用户声明的 Authored Views；包含每个项目唯一的 Model View、active Candidate 存在时唯一的 Candidate View 与 Candidate Diff View，以及由当前 View Selection、单个 active Change 与 Presentation Mode 组合形成的 Change-derived runtime projections，不包含按 Element 生成的 View identities、运行时布局状态或 Authored View 定义。
  - identity: interaction-surfaces
    exists: true
    value:
      identity: interaction-surfaces
      kind: element
      parent: collaboration-structure
      title: Interaction Surfaces
      definition: Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information；CLI 支持 Text Presentation，Web 支持 Visual Presentation。
  - identity: model-view
    exists: true
    value:
      identity: model-view
      kind: element
      parent: derived-views
      title: Model View
      definition: Model View 是由项目当前 Semantic Model 确定性派生、作为 Web 默认 View Selection 的唯一模型浏览视角。它在单一 Browser route 中提供完整模型选择边界，并可与一个活动 Change 和 Presentation Mode 正交组合；focus、导航历史、展开集合与布局属于运行时呈现状态，不产生其他 View identities。它不替代 Authored Views、Candidate View 或 Candidate Diff View，也不成为独立的 Change source。
  - identity: project.root
    exists: true
    value:
      identity: project.root
      kind: project
      parent: null
      title: 息壤（Xirang）
      definition: 面向 Agent、以结构化用户意图驱动项目构建与持续演进的开发框架。它包含表达项目应该是什么的 Semantic Model、承载新的演进意图的 Change，以及负责落实这些意图的 Realization；三者共同使 Agent 能够基于统一的项目认知完成需求探索、方案形成、代码实现、独立审查和变更收束。
  - identity: realization
    exists: true
    value:
      identity: realization
      kind: perspective
      parent: project.root
      title: Realization
      definition: Realization 是将项目意图落实为项目状态的 Perspective，独立建模以从推进过程与协作结构两个互补角度组织 Semantic Model 构建和 Change 演进。在推进过程上，它通过 Semantic Model Build 构建或重建 Semantic Model，通过 Change Realization 将已授权 Change 落实为项目新状态并收束；在协作结构上，由 Participants 承担授权、判断与编排，由 Interaction Surfaces 提供配置、呈现与确定性操作。
  - identity: semantic-browser
    exists: false
  - identity: semantic-model
    exists: true
    value:
      identity: semantic-model
      kind: element
      parent: semantic-objects
      title: Semantic Model
      definition: Semantic Model 是项目用户意图的完整结构化规范表达，独立建模以统一声明项目是什么并为 Agent 导航、验证和演进提供依据。它包含 Metamodel、Hierarchical Elements、Relationships 与 Views，不包含单次演进的 Semantic Delta、Change Plan 或落实这些意图的 Realization 过程。
  - identity: semantic-objects
    exists: true
    value:
      identity: semantic-objects
      kind: perspective
      parent: project.root
      title: 语义对象
      definition: 语义对象是从项目规范语义构成角度组织 Semantic Model 与 Change 的 Perspective。它独立建模以将项目应该是什么及应该如何变化，与负责落实这些意图的 Realization 区分开；包含 Semantic Model 与 Change，不包含落实过程、参与者或交互界面。
  - identity: view-composition
    exists: true
    value:
      identity: view-composition
      kind: perspective
      parent: views
      title: View Composition
      definition: View Composition 是 Views 按呈现视角的形成方式划分的组成维度。每个 View 要么由用户显式声明而成为 Authored View，要么由 Semantic Model 或 Change 确定性派生而成为 Derived View。
  - identity: views
    exists: true
    value:
      identity: views
      kind: element
      parent: semantic-model
      title: Views
      definition: Views 是 Semantic Model 面向用户的呈现层。View 面向特定的理解、讨论、审查或决策目的，选择、组织并呈现 Semantic Model 的语义对象及与 Change 相关的派生信息；Views 不引入规范性语义，也不改变或替代 Semantic Model 与 Change 所表达的规范性语义。
  - identity: web
    exists: true
    value:
      identity: web
      kind: element
      parent: interaction-surfaces
      title: Web
      definition: Web 是息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，与 CLI 并列作为 Interaction Surface，向用户呈现 Semantic Model、active Candidate 与 active Changes 的层级浏览与差异审查。它独立建模以承接面向用户的浏览编排语义；不包含 CLI 的配置维护与确定性操作，不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 与 Change Closure。
relationships: []
-->
