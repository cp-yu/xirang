---
entity: element-declaration
identity: explore-role
kind: element
parent: agent
title: Explore
definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，形成不持久化的 Design Summary。
---

## ADDED Sections

### Section: 按需读取并恢复当前语义

Explore 工作身份 SHALL 按当前设计问题渐进读取 Semantic Model：先定位候选与范围，再读取所选 identity 的完整 Declaration，并仅在需要判断规范承诺时读取完整 Contract。Explore SHALL 复用当前阶段内仍有效的读取结果和 record-level `sourceVersion`；不得将普通讨论或每次局部记录更新变成完整读取仪式。

当上下文压缩、会话切换、版本冲突、相关模型 drift 或无法确定当前状态时，Explore SHALL 重新建立完整记录、状态与受影响模型语义依据。未重新读取的 Definition 或 Contract 不得从 identity、title、旧摘要、残余对话或实现证据推断。每次扩大读取须对应明确问题，且读取范围不得超过回答该问题所需的 identities。
