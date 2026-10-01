---
operation: MODIFIED
entity: element-declaration
identity: explore-role
kind: element
parent: agent
title: Explore Role
definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，并在用户确认设计后通过 Design Record 经 CLI 立即记录该部分已确认内容；在适用设计确认和记录冲突调和后，交付 conversation-only Design Summary 与可用的记录身份，不编写完整 Change，也不实现项目。
---

## MODIFIED Sections

### Section: 保持只读工作边界

Explore Role SHALL 保持项目实现、Semantic Model、generated Agent surfaces 与普通 Change 制品只读；唯一例外是用户在对话中确认设计内容后，经 `xirang record` 记录该部分已确认内容，用户的设计确认即构成记录授权。SHALL NOT 直接改文件，SHALL NOT 记录用户未确认的内容，也 SHALL NOT 把设计确认视为其他文件或制品的写入授权。

- **确认后经 CLI 记录**

  - 用户确认一项设计内容
  - 仅通过 `xirang record` 记录该内容，不修改实现、正式模型或其他 Change 制品。

- **设计确认不授权其他写入**

  - 用户确认设计方向后，Agent 认为某个模板或 Contract 也应随之修改
  - 不写入这些文件，只在 Design Summary 中标明后续 capture target。
