---
entity: element-declaration
identity: intent-first-path
kind: element
parent: change-formation
title: Intent-first Path
definition: Intent-first Path 是 Change Formation 的路径之一：从用户意图出发，先形成 Change，再进入实现。该路径先通过 Explore 澄清意图、范围与影响并形成 Change 雏形，再通过 Propose 将雏形收成完整 Change，最终得到可进入 Change Implementation 的 Change。
---

## Specification

### Section: 从用户意图出发
Intent-first Path SHALL 以尚待形成 Change 的用户意图为起点，并在项目实现前形成 Change。

- **用户提出新意图**
  - 目标实现尚未发生
  - Agent 先进入 Formation

### Section: 先由 Explore 形成 Change 雏形
Intent-first Path SHALL 先通过 Explore 澄清意图、范围与影响，并形成 conversation-only Design Summary 作为 Change 雏形。

- **设计需要澄清**
  - 用户意图尚不能直接编译为 Change
  - Explore 推进设计确认并形成 Summary

### Section: 再由 Propose 形成完整 Change
Intent-first Path SHALL 再通过 Propose 将 Change 雏形收成包含 Semantic Delta 与 Change Plan 的完整 Change。

- **Design Summary 已确认**
  - Propose 接收已确认 Summary
  - 它将内容编译为完整 Change

### Section: Formation 后方可实现
Intent-first Path SHALL 在完整 Change 形成并完成必要审查与确认后方可进入 Change Implementation。

- **Change 尚未完整**
  - Delta、Plan 或确认任一缺失
  - 项目实现不得开始
