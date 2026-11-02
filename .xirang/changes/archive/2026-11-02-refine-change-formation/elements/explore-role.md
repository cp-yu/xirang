---
entity: element-declaration
identity: explore-role
kind: element
parent: agent
title: Explore Role
definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，并在用户确认设计后通过 Design Record 经 CLI 立即记录该部分已确认内容；在适用设计确认和记录冲突调和后，交付 conversation-only Design Summary 与可用的记录身份，不编写完整 Change，也不实现项目。
---

## ADDED Sections

### Section: 维护中间设计并委托实验

Explore Role SHALL 通过 CLI 维护当前设计记录，可自主保存 pending 问题、假设与建议；accepted、excluded 及已确认内容的实质修订由用户决定。必要可行性实验委托 Experimenter 同时设计和执行，提供问题、约束及背景，并消费其证据继续设计。

Explore 不写完整 Change、不提升正式模型，也不落实正式项目改动；允许实验所需的编写、运行及记录维护。用户确认设计只授权相应记录变化，不自行推导为普通项目文件、生成工作面或 Change 制品的修改授权。

## MODIFIED Sections

### Section: 不实现项目

Explore Role SHALL NOT 落实正式项目改动。必要的可行性实验可由 Experimenter 编写并运行；实验结果用于设计判断，不作为正式 Change 已实现的交付。设计稳定后进入 Propose 成文。

## REMOVED Sections

### Section: 保持只读工作边界
