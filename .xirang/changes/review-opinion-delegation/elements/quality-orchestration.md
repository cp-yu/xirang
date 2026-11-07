---
entity: element-declaration
identity: quality-orchestration
kind: element
parent: quality
title: Quality Orchestration
definition: Quality Orchestration 是 Quality 的 Review、可选 Opt 与 Seal 提示协议，独立承载主 Agent 的范围、等待、后续投入、Git-based recovery 和最终声明编排。它区分实现、独立审查与确定性记录责任，供 Apply 和 Archive 共用；不替 Reviewer 作独立结论，不定义 CLI 自主优化决策。
---

## MODIFIED Sections

### Section: Coordinator 角色声明

Quality 提示词 SHALL 区分主 Agent、Optimizer、Reviewer 与 CLI：主 Agent 在委派前确保待审实现已提交且受托工作所需测试已运行通过，选择 `reviewKind` 与非冲突质量维度、处理输入错误和修正、等待并合并 Reviewer 结论、决定 Opt 和最终 Seal；Opt 修改与局部测试；Reviewer 自主从受托 checkout 的 HEAD 独立只读审查，判断测试及其他证据是否充分而不必重复运行测试；CLI 只负责 v4 opinion、Opt disposition、Seal 的确定性记录和门禁。主 Agent 和 Opt 的判断不能代替必需独立 Review。

### Section: 显式 subagent delegation 指令

主 Agent SHALL 给 Reviewer 提供 `changeName`、实际 checkout 的绝对 `projectRoot`、`reviewKind`，并以自然语言指定必要的质量维度或受影响行为；不传 `reviewId`、单独的 `changeDir` 或目标 commit。可并行委派多个维度，但同轮委派 SHALL 分工不冲突、每个 `full-change` 维度覆盖整个累计 Change；收齐有效结果后由主 Agent 合并为一条 Review opinion，保留重要结论与修正，任一必需维度失败或未解决时不能 PASS。Pi Reviewer 在后台运行以获取环境扩展工具，主 Agent 等待完整结果；错误委派或 HEAD 变化交回重新委派，不写 FAIL opinion。Opt 委派仍由其原有范围与 `baseCommit`/`resultCommit` 交付规则约束。

### Section: Git recovery 与 Seal 顺序

Quality workflow SHALL 依次要求通过的 `full-change` Review、主 Agent 决定的可选 Opt、Opt opinion 或不做 Opt 的理由、必要的 `incremental` 或 `supplemental` Review，再由主 Agent记录 Seal。失败 Review 的修正形成新 Git commit 并针对相应类别复审；既有 Change 缺陷修复必须接受补充 Review。Seal 声明绑定存在的 commit，CLI 不要求工作区 clean、对比 HEAD/工作区或执行测试；Archive 仅检查 Seal commit 存在。
