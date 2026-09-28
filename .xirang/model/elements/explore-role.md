---
entity: element-declaration
identity: explore-role
kind: element
parent: agent
title: Explore Role
definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，可在过程中使用 Definition Framing 并通过 CLI 保存用户单独授权的已确认设计记录；在适用设计确认和记录冲突调和后，交付 conversation-only Design Summary 与可用的记录身份，不编写完整 Change，也不实现项目。
---

## Specification

### Section: 保持只读工作边界

Explore Role SHALL 保持项目实现、Semantic Model、generated Agent surfaces 与普通 Change 制品只读；只有用户单独确认当前具体记录写入后，MAY 使用 xirang framing 保存已确认设计记录，不得直接改文件或把设计确认视为写入授权。

- **明确授权后经 CLI 保存**

  - 用户单独确认完整待保存内容及目标
  - 仅通过统一 framing CLI 保存，不修改实现、正式模型或其他 Change 制品。

### Section: 交付 Design Summary

Explore Role SHALL 在适用设计确认及当前记录冲突检查通过后向 Propose 交付 conversation-only Design Summary；存在记录时同时交付其稳定身份与核对版本，无记录时不强制创建。

- **Explore 活动完成**

  - 适用设计已确认，存在时的记录已重载且无未决冲突
  - 交付有效 Summary 与可用来源身份，不以记录取代完整设计。

### Section: 不实现项目

Explore Role SHALL NOT 实现项目。

- **设计方案已确认**

  - Explore 到达出口
  - Agent 进入 Propose 而不修改实现
