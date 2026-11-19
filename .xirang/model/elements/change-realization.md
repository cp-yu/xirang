---
entity: element-declaration
identity: change-realization
kind: element
parent: realization-process
title: Change Realization
definition: Change Realization 是形成、落实并结束单次 Change 的过程。它通过形成和实现推进目标交付，以归档完成模型应用与收束；也允许用户在不继续推进时封存活动 Change，而不把未交付意图写入正式模型。
---

## Specification

### Section: 按形成、实现、收束推进

Change Realization SHALL 在正常交付时推进形成、实现与质量评估，由一次归档完成同步与收束。显式 quick 免除交付的 Seal 门禁；任意阶段用户可放弃活动 Change，仅留档，不以此宣称实现或验证完成。

### Section: 保持实现与模型一致

正常交付 SHALL 使语义模型表达已验证实现的目标状态。quick 应用通过模型校验的目标但不证明实现已验证；放弃不改变正式模型、不回退已有实现。
