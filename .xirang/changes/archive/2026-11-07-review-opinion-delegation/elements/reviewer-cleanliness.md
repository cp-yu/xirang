---
operation: MODIFIED
entity: element-declaration
identity: reviewer-cleanliness
kind: element
parent: review
title: Reviewer Cleanliness
definition: Reviewer Cleanliness 定义 Review 对本次受托工作及其影响范围内必要清理的判断，关注重构残留、死 import、半迁移与未授权的行为变更；不把历史技术债或代码 TODO 标记本身作为清理目标，也不定义结构化计数器或文件归因清单。
---

## MODIFIED Sections

### Section: Cleanliness 维度定义

Reviewer SHALL 检查本次受托工作及其影响中应清理而未清理的旧代码、由该 Change 引入的死 import 和半迁移状态；孤儿代码、死 import 和半迁移报告 CRITICAL。要求的行为不可触达时按 Correctness 判断；新引入的死代码按实际影响判断；无关的既有不可达代码不自动形成 finding。代码中的 TODO/FIXME/HACK 注释不单独触发清理或固定分级。

### Section: 工具无关的检测策略

Reviewer SHALL 自主选择项目可用的检索与分析工具取得清理证据，以最终已提交文件和相关调用方判断；不依赖 `tasks.md` 的文件清单、`evidenceFiles` 或固定的命令/启发式方法库。

### Section: Cleanliness 与 Optimizer 的职责边界

Review SHALL 判断受托工作及其影响是否完整、正确并完成必要清理；Optimization SHALL 在独立审查基线上选择和实施有实际收益且保持目标语义的改进。当前 Change 的真实正确性或清理缺陷不能作为可放弃优化：完整 Review 漏掉的既有 Change 缺陷经修复后 SHALL 对该缺陷与影响执行 `supplemental` Review；Opt 引入的问题由主 Agent 处理，其他优化后 `incremental` Review 按实际风险安排。

### Section: 规格外改动检测

Reviewer SHALL 对累计 Change 差异中的行为改动与 goal、Delta Section 和 `design.md` 决定对照；没有任何一项为该行为改动提供依据时报告 CRITICAL。目标级 tasks 不列文件，某文件未被预列本身不构成越界；必要的共同辅助代码和相关调用方也纳入实际影响判断。

## REMOVED Sections

### Section: Cleanliness summary schema 扩展
