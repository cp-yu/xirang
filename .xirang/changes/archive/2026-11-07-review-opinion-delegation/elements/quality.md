---
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中以 commit 绑定的 Review 意见、可选 Opt 意见与 Seal 声明协调项目实现判断并控制进入 Change Closure 的阶段。它确保每个 Change 具有通过的独立基线 Review、明确的 Opt 处置及主 Agent 对 Seal commit 的声明；Review 负责独立判断，Optimization 负责保持目标语义的改进，CLI 负责意见关联和记录门禁，不负责代码恢复或当前工作区新鲜度判定。
---

## MODIFIED Sections

### Section: Review 通过后建立 Baseline

Quality SHALL 在 Opt 或 Seal 前要求至少一条通过的 `full-change` Review。Review opinion 绑定已提交且在审查期间 HEAD 不变的 Git commit；完整 Review 失败后的修正形成不同 Git commit 并重新审查。通过的完整 Review 是后续 Opt 的基线，不证明 Opt 以后的改动经过独立审查；Quality 不为 commit 保存代码恢复状态。

### Section: 按阶段与证据缺口推进

Quality SHALL 按 `full-change` Review、主 Agent 决定的可选 Opt、Opt 处置与 Seal 顺序推进。Review findings、WARNING 和 Required Corrections 由主 Agent 判断和处理；Quality 不自动修改 `tasks.md`。Opt 后 `incremental` Review 由主 Agent 按风险决定；发现并修复完整 Review 漏掉的原有 Change 缺陷后必须执行 `supplemental` Review。没有有效 Seal 不得进入 Change Closure。
