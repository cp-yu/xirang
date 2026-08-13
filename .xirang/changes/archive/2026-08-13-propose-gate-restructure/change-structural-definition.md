---
entity: change-structural-definition
explorationId: 20260813T085621Z-86118934
slug: propose-gate-restructure
semanticModelFingerprint: 76dfecf9b8aa4ef89e4fd4afe1f45b5adb5f61c68d63266320694a153f59dd3c
---
elementKinds: []
relationshipKinds: []
elements:
  - operation: REMOVED
    identity: preflight-scan
  - identity: artifact-authoring
    kind: element
    parent: propose-workflow
    title: Artifact Authoring
    definition: Artifact Authoring 定义 Propose 生成完整 change 制品的行为：按依赖顺序，依据每个制品的定义、指令与模板，写出 proposal、delta Contracts、design、tasks 与结构目标；在 proposal 中分离 behavior 与 architecture source impact，在生成结构目标前重新对齐架构影响范围；tasks.md 按 TDD 闭环划分 task 边界。
  - identity: post-propose-validation
    kind: element
    parent: propose-workflow
    title: Post-propose Validation
    definition: Post-propose Validation 定义 Propose 收尾的一致性验证门禁：先执行计划一致性复核，对照 change-local Contracts、design.md 与 Semantic Delta 检测 tasks.md 的语义矛盾，发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时呈现给用户裁决；随后在最终制品上执行确定性校验作为收尾门禁，对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担，报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。
relationships:
  - source: post-propose-validation
    kind: invokes
    target: deterministic-operations
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
  - identity: invokes
    exists: true
    value:
      identity: invokes
      body: ""
elements:
  - identity: apply
    exists: true
    value:
      identity: apply
      kind: element
      parent: change-implementation
      title: Apply
      definition: Apply 是 Change Implementation 中落实项目改动的活动。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态，落实 Change 要求的全部项目改动；在 `tasks.md` 存在时按其中的执行与验证安排推进；在 Verify 返回 Required Corrections 或已确认的优化事项时继续完成相应改动。
  - identity: artifact-authoring
    exists: false
  - identity: change-formation
    exists: true
    value:
      identity: change-formation
      kind: element
      parent: change-realization
      title: Change Formation
      definition: Change Formation 是 Change Realization 中形成完整 Change 的阶段。它在阶段内完成必要的审查与确认，并产出完整的 Semantic Delta 与 Change Plan；它可以通过 Intent-first Path 或 Implementation-first Path 完成。
  - identity: change-implementation
    exists: true
    value:
      identity: change-implementation
      kind: element
      parent: change-realization
      title: Change Implementation
      definition: Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过独立评估与可复现证据确认项目结果与 Expected Semantic Model 一致；验证通过后，Change 可进入 Change Closure，本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。
  - identity: change-realization
    exists: true
    value:
      identity: change-realization
      kind: element
      parent: realization-process
      title: Change Realization
      definition: Change Realization 是 Realization 推进过程中落实单次 Change 的过程。它通过 Change Formation 形成完整 Change，通过 Change Implementation 实现并验证，再通过 Change Closure 将经验证的 Semantic Delta 更新到 Semantic Model 并关闭 Change，使项目实现与语义模型进入新的稳定状态。
  - identity: cli
    exists: true
    value:
      identity: cli
      kind: element
      parent: interaction-surfaces
      title: CLI
      definition: CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
  - identity: collaboration-structure
    exists: true
    value:
      identity: collaboration-structure
      kind: perspective
      parent: realization
      title: 协作结构
      definition: 协作结构是按谁授权、判断、编排和操作的协作角度组织 Participants 与 Interaction Surfaces 的 Perspective。它包含用户、Agents 及其使用的界面结构，不包含落实工作的阶段顺序、入口或过程结果。
  - identity: deterministic-operations
    exists: true
    value:
      identity: deterministic-operations
      kind: element
      parent: cli
      title: Deterministic Operations
      definition: Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
  - identity: intent-first-path
    exists: true
    value:
      identity: intent-first-path
      kind: element
      parent: change-formation
      title: Intent-first Path
      definition: Intent-first Path 是 Change Formation 的路径之一：从用户意图出发，先形成 Change，再进入实现。该路径先通过 Explore 澄清意图、范围与影响并形成 Change 雏形，再通过 Propose 将雏形收成完整 Change，最终得到可进入 Change Implementation 的 Change。
  - identity: interaction-surfaces
    exists: true
    value:
      identity: interaction-surfaces
      kind: element
      parent: collaboration-structure
      title: Interaction Surfaces
      definition: Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information；CLI 支持 Text Presentation，Semantic Browser 支持 Visual Presentation。
  - identity: post-propose-validation
    exists: false
  - identity: preflight-scan
    exists: true
    value:
      identity: preflight-scan
      kind: element
      parent: apply
      title: Preflight Scan
      definition: Preflight Scan 定义 Apply 在实现前对 `tasks.md` 的一致性预检：检测 task 间互斥声明、task 与 change-local 目标语义的冲突，以及 task 依赖顺序问题；预检干净时无声继续。
  - identity: project.root
    exists: true
    value:
      identity: project.root
      kind: project
      parent: null
      title: 息壤（Xirang）
      definition: 面向 Agent、以结构化用户意图驱动项目构建与持续演进的开发框架。它包含表达项目应该是什么的 Semantic Model、承载新的演进意图的 Change，以及负责落实这些意图的 Realization；三者共同使 Agent 能够基于统一的项目认知完成需求探索、方案形成、代码实现、独立审查和变更收束。
  - identity: propose
    exists: true
    value:
      identity: propose
      kind: element
      parent: intent-first-path
      title: Propose
      definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的 Change Structural Definition；Change Structural Definition 存在时，它将其中已确认的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 分别编译为相应的 Semantic Delta Entries；两条路径均写出完整 Change Plan，并在 Formation 内完成必要审查与确认。
  - identity: propose-workflow
    exists: true
    value:
      identity: propose-workflow
      kind: element
      parent: propose
      title: Propose Workflow
      definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、definition-first authoring、架构范围 reconcile、post-propose validation 分级 gate 与状态输出收敛。
  - identity: realization
    exists: true
    value:
      identity: realization
      kind: perspective
      parent: project.root
      title: Realization
      definition: Realization 是将项目意图落实为项目状态的 Perspective，独立建模以从推进过程与协作结构两个互补角度组织 Semantic Model 构建和 Change 演进。在推进过程上，它通过 Semantic Model Build 构建或重建 Semantic Model，通过 Change Realization 将已授权 Change 落实为项目新状态并收束；在协作结构上，由 Participants 承担授权、判断与编排，由 Interaction Surfaces 提供配置、呈现与确定性操作。
  - identity: realization-process
    exists: true
    value:
      identity: realization-process
      kind: perspective
      parent: realization
      title: 推进过程
      definition: 推进过程是按落实工作如何发生的过程角度组织 Semantic Model Build 与 Change Realization 的 Perspective。它包含各阶段和活动的入口、顺序、约束与结果，不包含承担这些工作的 Participants、Agent 工作身份或 Interaction Surfaces。
relationships:
  - source: post-propose-validation
    kind: invokes
    target: deterministic-operations
    exists: false
-->
