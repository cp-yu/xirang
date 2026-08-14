---
entity: change-structural-definition
explorationId: 20260814T054809Z-088fa4bc
slug: web-likec4-split
semanticModelFingerprint: 46abcada394c7009b91194a1b6956ef5804cb9452e18744219e29e88cc610208
---
elementKinds: []
relationshipKinds: []
elements:
  - identity: web
    kind: element
    parent: interaction-surfaces
    title: Web
    definition: Web 是息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，与 CLI 并列作为 Interaction Surface，向用户呈现 Semantic Model、active Candidate 与 active Changes 的层级浏览与差异审查。它独立建模以承接面向用户的浏览编排语义；不包含 CLI 的配置维护与确定性操作，不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 与 Change Closure。
  - identity: xirang-projection-service
    kind: element
    parent: web
    title: Xirang Projection Service
    definition: Xirang Projection Service 是 Web 对 LikeC4 的服务端投影改造：将受管 Semantic Model、active Candidate 与活动 Change 的语义内容确定性转换为原生 LikeC4 base model，并经官方 parser、validator、compute-view 与 Graphviz layout 生产 runtime projection。它独立建模以隔离投影机制与差异呈现、Contract 投递及浏览编排的边界；包含 base model 生成与原子缓存发布、runtime manifest 与 fingerprint 失效、当前层 Relationship 聚合与 Xirang→LikeC4 内容映射，不包含语义差异的视觉表达与 Element Contract 的按需投递。
  - identity: xirang-diff-overlay
    kind: element
    parent: web
    title: Xirang Diff Overlay
    definition: Xirang Diff Overlay 是 Web 对 LikeC4 的差异呈现改造：在投影节点与关系上以 outline、计数徽标与差异标记分层叠加 Element 级与 Requirement 级语义差异，并在 Element Details 中呈现 Requirement 级 before/after diff。它独立建模以隔离差异视觉表达与投影计算、Contract 投递的边界；不改变 base model 与 runtime projection，不承担浏览编排语义。
  - identity: xirang-contract-delivery
    kind: element
    parent: web
    title: Xirang Contract Delivery
    definition: Xirang Contract Delivery 是 Web 对 LikeC4 的 Contract 投递改造：按稳定 Element identity 构建 identity→content 索引，经受控 HTTP 端点向浏览器按需安全提供 Semantic Model、active Candidate 与活动 Change 目标中的 Element Contract，并以只读方式渲染。它独立建模以隔离 Contract 内容获取与投影计算、差异呈现的边界；不负责 projection 计算与差异视觉表达，不构成规范性语义来源。
  - operation: REMOVED
    identity: semantic-browser
relationships:
  - source: web
    kind: supports-presentation
    target: visual-presentation
  - operation: REMOVED
    source: semantic-browser
    kind: supports-presentation
    target: visual-presentation
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
relationshipKinds:
  - identity: supports-presentation
    exists: true
    value:
      identity: supports-presentation
      body: "`supports-presentation` 从 Interaction Surface 指向其支持的 View Presentation，表示该交互界面能够通过目标呈现方法向用户传达 Views。该关系不表示排他归属，也不改变 View 的组成方式、呈现视角或规范性依据。"
elements:
  - identity: collaboration-structure
    exists: true
    value:
      identity: collaboration-structure
      kind: perspective
      parent: realization
      title: 协作结构
      definition: 协作结构是按谁授权、判断、编排和操作的协作角度组织 Participants 与 Interaction Surfaces 的 Perspective。它包含用户、Agents 及其使用的界面结构，不包含落实工作的阶段顺序、入口或过程结果。
  - identity: interaction-surfaces
    exists: true
    value:
      identity: interaction-surfaces
      kind: element
      parent: collaboration-structure
      title: Interaction Surfaces
      definition: Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information；CLI 支持 Text Presentation，Semantic Browser 支持 Visual Presentation。
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
    exists: true
    value:
      identity: semantic-browser
      kind: element
      parent: interaction-surfaces
      title: Semantic Browser
      definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
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
  - identity: view-presentation
    exists: true
    value:
      identity: view-presentation
      kind: perspective
      parent: views
      title: View Presentation
      definition: View Presentation 是 Views 按语义信息如何传达给用户划分的呈现维度。View 可以采用 Visual Presentation、Text Presentation，或者同时提供两种呈现方法；呈现方法不改变 View 的呈现视角、组成方式或所依据的规范性语义。
  - identity: views
    exists: true
    value:
      identity: views
      kind: element
      parent: semantic-model
      title: Views
      definition: Views 是 Semantic Model 面向用户的呈现层。View 面向特定的理解、讨论、审查或决策目的，选择、组织并呈现 Semantic Model 的语义对象及与 Change 相关的派生信息；Views 不引入规范性语义，也不改变或替代 Semantic Model 与 Change 所表达的规范性语义。
  - identity: visual-presentation
    exists: true
    value:
      identity: visual-presentation
      kind: element
      parent: view-presentation
      title: Visual Presentation
      definition: Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。
  - identity: web
    exists: false
  - identity: xirang-contract-delivery
    exists: false
  - identity: xirang-diff-overlay
    exists: false
  - identity: xirang-projection-service
    exists: false
relationships:
  - source: semantic-browser
    kind: supports-presentation
    target: visual-presentation
    exists: true
    value:
      source: semantic-browser
      kind: supports-presentation
      target: visual-presentation
  - source: web
    kind: supports-presentation
    target: visual-presentation
    exists: false
-->
