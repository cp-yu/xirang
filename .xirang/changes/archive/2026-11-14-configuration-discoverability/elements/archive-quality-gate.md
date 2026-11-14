---
entity: "element-declaration"
identity: "archive-quality-gate"
kind: "element"
parent: "change-closure"
title: "Archive Quality Gate"
definition: "Archive Quality Gate 是 Change Closure 在归档前消费 Quality Seal 的门禁，只确认新 Quality JSON 中 Seal commit 对象仍存在。它不重新判断 Review/Opt 意见、不执行测试、不比较 HEAD 或工作区；归档移动、Sync、validation 与 task 门禁属于各自能力。"
---

## MODIFIED Sections

### Section: 归档前必须具备新鲜的完整验证记录

Archive SHALL 通过 CLI 校验当前完整质量证据后才能正常复用结果，不能退回 inline conformance check。完成条件 SHALL 关联优化前通过的独立基线 Review、已完整交付的委托或主 Agent 决定不执行 Opt 的明确理由、实际成功测试、主 Agent 的最终验证范围与理由、所有已声明必需的增量 Review，以及当前 Change 基线缺陷修复后必需的针对性独立 Review；所需验证全部通过且证据适用当前状态、无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。未追加 Review 的风险判断不记为 Reviewer PASS，基线 PASS 不声称覆盖优化后代码。 缺口返回非零并说明具体所需行动；明确跳过可以满足优化处置，不免除基线或适用测试。仅 HEAD 推进且内容/证据关联不变时不重跑质量流程。
