---
entity: element-declaration
identity: explore
kind: element
parent: intent-first-path
title: Explore
definition: Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中通过 Design Record 随用户确认记录关键设计，用户的设计确认即授权记录该部分内容。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。
---

## MODIFIED Sections

### Section: 识别语义影响面

Explore SHALL 结合 Semantic Model 的 Elements、Relationships、Element Contracts 与授权项目证据识别影响面。普通探索 SHALL 按明确问题渐进读取：先用 `arch search --limit` 定位候选，再用层级或影响 projection 缩小范围，再查询选定 identity 的完整 Declaration，只有需要判断完整规范语义时才查询完整 Contract。Explore 不得自动读取影响分析返回的全部 Elements Contracts。

- **逐步确定语义范围**

  - 用户意图涉及尚未定位的模型概念
  - Explore 按 `arch search`、`arch outline`/`arch impact`、`arch query`、`arch query --contract` 顺序按需展开
  - 每次扩大读取都回答一个明确的设计问题

- **保留完整语义读取**

  - 选定 Element 的 Definition 或 Contract 影响判断
  - Explore 查询该 stable identity 的完整语义
  - 未加载的 Definition、impact identity、旧摘要或实现证据不得代替该读取

- **全局恢复有明确触发条件**

  - 整体模型理解已丢失、上下文压缩或需要全局结构诊断
  - Explore 使用 `arch outline` 显式展开所需结构，必要时使用无 Contract 的完整 `arch snapshot`
  - snapshot 不是普通探索的默认入口

### Section: 按确认即记录使用 Design Record

发现相关记录、需保存影响设计的 pending 问题/假设、产生未豁免的设计确认、用户要求记录或修订、Summary 前发现记录缺口时，Explore SHALL 加载共享 Design Record reference。按协议主动维护 pending 内容，用户确认后立即通过 `xirang record` 局部更新；不等待用户要求记录，不另行索要持久化授权。修改已确认内容须用户允许，写入后只报告变化与概况。

Explore SHALL 在每个阶段入口先运行 `xirang list --json` 发现当前记录，并读取必要的完整基础状态；完整 show/status/validate 用于入口、恢复和收尾门禁，不用于普通讨论或每次局部更新前的重复仪式。有效上下文未发生相关变化时，SHALL 复用最近成功操作返回的 `sourceVersion`、summary 与已知 identity；局部设计问题使用 `record show --entry`，update 使用最近有效 `sourceVersion` 并检查返回的 diff 与 summary。

发生上下文压缩、session 切换、sourceVersion 冲突、相关模型 drift 或无法确认当前状态时，SHALL 重新读取完整记录与状态，并重建受影响的模型或项目证据。记录变化使受影响设计与 Summary 需重查。交接前仍须完成完整覆盖检查，并落定已持久化记录、用户明确豁免或无 normative 内容声明之一；不创建空记录，不默认豁免。
