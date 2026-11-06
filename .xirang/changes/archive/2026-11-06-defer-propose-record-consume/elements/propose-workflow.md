---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
---

## MODIFIED Sections

### Section: 按复杂度组织交互审阅

Workflow SHALL 默认引导 Propose 在材料决策齐备时连续编写完整 Change 后集中审阅；只有用户明确要求交互推进时 SHALL 按一项机制或一组相关 Elements 的实际草稿及其目标、验证方向分段审阅，反馈后继续。简单变更可只有一组，不按 Element 数量或 artifact 写作顺序机械停顿。两种模式下，新发现的重大缺口都 SHALL 及时提出并等待裁决，批量模式不授予 Agent 猜测未确认决策的权力。

Workflow SHALL 在最终校验后、请求用户接受 Change 前运行适用的 `record coverage`，并在审阅期间保持活动记录；用户反馈改变记录或目标时重新校验并记录覆盖结果。只有用户接受与当前覆盖结果对应的最终 Change 后，Workflow 才 SHALL 执行 `record consume` 并报告 Formation 完成；无记录时仍须等待用户接受，不将 CLI 通过视为接受。
