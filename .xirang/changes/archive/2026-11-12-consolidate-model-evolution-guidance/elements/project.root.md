---
entity: element-declaration
identity: project.root
kind: project
parent: null
title: "息壤（Xirang）"
definition: "面向 Agent、以结构化用户意图驱动项目构建与持续演进的开发框架。它包含表达项目应该是什么的 Semantic Model、承载新的演进意图的 Change，以及负责落实这些意图的 Realization；三者共同使 Agent 能够基于统一的项目认知完成需求探索、方案形成、代码实现、独立审查和变更收束。"
---

## MODIFIED Sections

### Section: 保持稳定成功标准

息壤 SHALL 提供确定的 CLI 入口与生成的 Agent 工作流表面，保留 Explore → Propose → Apply → Verify → Sync → Archive 生命周期，校验 Semantic Delta，并仅在证据支撑的审查后提升 source。CLI 的旧版本用法不保证在新版本中继续可用，允许用户与 Agent 协作完成升级适配。

- **Change 达到稳态**
  - 一个 Change 完成
  - 其外部可观察行为 SHALL 由 Element-owned Contracts 表达
  - 其架构意图 SHALL 由稳定 Elements、refinement containment 与类型化语义关系表达
  - validation SHALL 在提升前检测不完整或矛盾的 source
