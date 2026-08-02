---
entity: change-structural-definition
explorationId: 20260802T084417Z-6c6bdc77
slug: candidate-derived-views
semanticModelFingerprint: 7201a40c69deb47012205e0d39bc35206234b77bf54a0e394d3d706b0a74ade5
---
elementKinds: []
relationshipKinds: []
elements:
  - identity: derived-views
    kind: domain
    parent: view-composition
    title: Derived Views
    definition: Derived Views 是由 Semantic Model、active Candidate 或 active Change 确定性推导、无需用户声明且不作为 durable artifact 持久化的 Views。它们独立建模以区别用户声明的 Authored Views；包含每个项目唯一的 Model View、active Candidate 存在时唯一的 Candidate View 与 Candidate Diff View，以及按 active Change 形成的 Change-derived Views，不包含运行时 focus projection、布局状态或 Authored Views。
  - identity: model-view
    kind: capability
    parent: derived-views
    title: Model View
    definition: Model View 是由一个项目当前 Semantic Model 确定性派生、作为 Semantic Browser 默认入口的唯一模型浏览 View。它为当前模型提供连续的层级浏览视角；当前 focus、导航历史与布局属于运行时呈现状态，不产生其他 Views。它不替代 Candidate View、Candidate Diff View、Change-derived Views 或 Authored Views，也不承担 Candidate 或 Change 的差异审查。
  - identity: change-derived-views
    kind: capability
    parent: derived-views
    title: Change-derived Views
    definition: Change-derived Views 是由当前 Semantic Model 与各 active Change 的 Semantic Delta 确定性推导、用于呈现对应目标模型及语义差异的 Views。它们按 Change 独立建模以支持对单次演进意图的理解与审查；包含 Change 目标模型的层级浏览和 diff，不包含当前 Semantic Model 的默认浏览、active Candidate 的完整预览或 Candidate diff，也不包含 Authored View 视角。
  - identity: candidate-derived-view
    kind: capability
    parent: derived-views
    title: Candidate View
    definition: Candidate-derived View 是由一个项目唯一的 active Candidate Semantic Model 确定性派生、用于在 promotion 前浏览完整但尚未确认的目标 Semantic Model 的唯一运行时 View。它独立建模，因为 Candidate 不是当前 Semantic Model 或 Change；包含 Candidate 四分区联合形成的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views，不包含相对当前 Semantic Model 的 diff、build.md、deterministic validation、semantic review、promotion、history 或任何持久化 Derived View artifact。
  - identity: candidate-diff-derived-view
    kind: capability
    parent: derived-views
    title: Candidate Diff View
    definition: Candidate Diff View 是由当前 Semantic Model 与一个项目唯一的 active Candidate Semantic Model 确定性派生、专门用于审查 Candidate 相对当前 Semantic Model 语义差异的唯一运行时 View。它独立建模以将完整 Candidate 浏览与 before/after 比较分离；包含四个语义分区中的 ADDED、MODIFIED 与 REMOVED 差异及理解这些差异所需的模型上下文，不包含 build.md、deterministic validation、semantic review、promotion、history 或任何持久化 Derived View artifact。
  - identity: semantic-browser
    kind: capability
    parent: interaction-surfaces
    title: Semantic Browser
    definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
relationships: []
<!-- XIRANG:SEMANTIC_MODEL_BASELINE
elementKinds:
  - identity: capability
    exists: true
    value:
      identity: capability
      contract: optional
      body: ""
  - identity: domain
    exists: true
    value:
      identity: domain
      contract: optional
      body: ""
  - identity: perspective
    exists: true
    value:
      identity: perspective
      contract: optional
      parents:
        - perspective
        - project
      children:
        - capability
        - domain
        - perspective
      body: "`perspective` 标识从一个独立分解角度组织 descendants 的 Element。Perspective 本身表达该分解角度的概念边界，children 构成该角度下的抽象或进一步 Perspectives；它不是 View，也不以颜色、形状或布局定义语义。"
  - identity: project
    exists: true
    value:
      identity: project
      contract: required
      root: true
      body: ""
relationshipKinds: []
elements:
  - identity: candidate-derived-view
    exists: false
  - identity: candidate-diff-derived-view
    exists: false
  - identity: change-derived-views
    exists: true
    value:
      identity: change-derived-views
      kind: capability
      parent: derived-views
      title: Change-derived Views
      definition: 由当前 Semantic Model 与一个活动 Change 的 Semantic Delta 确定性推导、用于呈现目标模型及语义差异的 View。它按 Change 独立建模以支持对一次演进意图的理解与审查；包含目标模型的层级浏览和 diff，不包含当前 Semantic Model 的默认浏览或 Authored View 视角。
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
      kind: domain
      parent: view-composition
      title: Derived Views
      definition: Derived Views 是由 Semantic Model 或 Change 确定性推导、无需用户声明且不作为 durable artifact 持久化的 Views。它们独立建模以区别用户声明的 Authored Views；包含每个项目唯一的 Model View 与按活动 Change 形成的 Change-derived Views，不包含运行时 focus projection、布局状态或 Authored Views。
  - identity: interaction-surfaces
    exists: true
    value:
      identity: interaction-surfaces
      kind: domain
      parent: collaboration-structure
      title: Interaction Surfaces
      definition: 供用户与 Agents 配置、理解和操作息壤的界面体系。
  - identity: model-view
    exists: true
    value:
      identity: model-view
      kind: capability
      parent: derived-views
      title: Model View
      definition: Model View 是由一个项目的完整 Semantic Model 确定性派生、作为 Semantic Browser 默认入口的唯一模型浏览 View。它为整个模型提供连续的层级浏览视角；当前 focus、导航历史与布局属于运行时呈现状态，不产生其他 Views。它不替代 Authored Views，也不承担特定 Change 的差异视角。
  - identity: project.root
    exists: true
    value:
      identity: project.root
      kind: project
      parent: null
      title: 息壤（Xirang）
      definition: 面向 Agent、以结构化用户意图驱动项目构建与持续演进的开发框架。
  - identity: realization
    exists: true
    value:
      identity: realization
      kind: perspective
      parent: project.root
      title: Realization
      definition: Realization 是将项目意图落实为项目状态的 Perspective，独立建模以从过程与协作两个互补角度组织 Semantic Model 构建和 Change 演进。它包含推进过程与协作结构，不包含 Semantic Model、Change 或其他规范语义对象本身。
  - identity: semantic-browser
    exists: true
    value:
      identity: semantic-browser
      kind: capability
      parent: interaction-surfaces
      title: Semantic Browser
      definition: 以 Views 可视化浏览 Semantic Model 与 Change-derived information 的界面。
  - identity: semantic-model
    exists: true
    value:
      identity: semantic-model
      kind: domain
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
      kind: domain
      parent: views
      title: View Composition
      definition: 按呈现视角形成方式组织 Authored Views 与 Derived Views 的组成维度。
  - identity: views
    exists: true
    value:
      identity: views
      kind: domain
      parent: semantic-model
      title: Views
      definition: 面向用户选择并组织模型信息的呈现层。
relationships: []
-->
