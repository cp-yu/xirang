---
entity: element-declaration
identity: explore
kind: element
parent: intent-first-path
title: Explore
definition: Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中通过 Design Record 随用户确认记录关键设计，用户的设计确认即授权记录该部分内容。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。
---

## ADDED Sections

### Section: 委托可行性实验

必要的方案可行性实验 SHALL 在 Explore 完成，为 Propose 奠定设计基础。Explore 向专门 Experimenter 提供待回答问题、约束和决策背景；由 Experimenter 自主设计并执行最小实验，交付方法、结果、分析与限制。Explore 依据证据继续比较方案、请求用户确认，不把实验成功当作方案已获采纳。不得以统一只读能力禁令阻止实验编写与执行。

实验使用当前工作区、临时目录、项目副本或 worktree 等，由主 Agent 与 Experimenter 根据情况选择；框架不预设选择策略，也不把执行细节逐项交用户设计。实验产物不视为正式 Change 实现。

- Propose 前必须确认某 API 能力：Explore 提供问题与约束，Experimenter 设计并运行最小验证，Explore 将可行性证据和限制用于设计确认。

## MODIFIED Sections

### Section: 不形成完整 Change

Explore SHALL 使用中间设计记录完善设计，不提前展开完整 Change 草稿；整体设计接近完成后，由 Propose 组织并编写实际草稿。探索中后续发现可以使此前设计修订，记录按当前状态更新，避免每次反复都重写完整制品。Explore SHALL NOT 实现正式 Change。

- 先确定的条件因后续发现改变：取得必要用户裁决后更新中间记录，未进入 Propose 时不展开完整 Delta、Plan。

### Section: 按确认即记录使用 Design Record

发现相关记录、需保存影响设计的 pending 问题/假设、产生未豁免的设计确认、用户要求记录或修订、Summary 前发现记录缺口时，Explore SHALL 加载共享 Design Record reference；普通讨论不预加载。按协议主动维护 pending 内容，用户确认后立即通过 xirang record 局部更新为相应状态；不等待用户要求记录，不另行索要持久化授权。修改已确认内容须用户允许，写入后只报告变化与概况。

记录随设计形成，不是先行阶段；记录变化使受影响设计与 Summary 需重查。交接前对照完整确认内容补足遗漏，并落定已持久化记录、用户明确豁免或无 normative 内容声明之一；不创建空记录，不默认豁免。
