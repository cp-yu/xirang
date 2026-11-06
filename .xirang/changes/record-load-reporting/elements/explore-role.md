---
entity: element-declaration
identity: explore-role
kind: work-identity
parent: agent
title: Explore Role
definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，并在用户确认设计后通过 Design Record 经 CLI 立即记录该部分已确认内容；在适用设计确认和记录冲突调和后，交付 conversation-only Design Summary 与可用的记录身份，不编写完整 Change，也不实现项目。
---

## MODIFIED Sections

### Section: 交付 Design Summary

Explore Role SHALL 在适用设计确认及当前记录冲突检查通过后向 Propose 交付 conversation-only Design Summary；存在记录时保留其稳定身份以便 Propose 确认来源，但不向用户呈现 sourceVersion；无记录时不强制创建。

- **Explore 活动完成**

  - 适用设计已确认，存在时的记录已重载且无未决冲突
  - 交付有效 Summary 与可用来源身份，不以记录取代完整设计，也不向用户播报版本。
