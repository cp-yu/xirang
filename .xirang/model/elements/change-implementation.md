---
entity: element-declaration
identity: change-implementation
kind: element
parent: change-realization
title: Change Implementation
definition: Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过独立评估与可复现项目证据确认实现完整、正确且一致；Quality 以 Review、可选 Opt 和主 Agent 的 Seal 声明完成其门禁，之后 Change 可进入 Change Closure。本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。
---

## Specification

### Section: 实现并独立验证目标状态

Change Implementation SHALL 由 Apply 依据 Expected Semantic Model 落实项目，并由 Verify 使用独立判断与可复现项目证据确认完整性、正确性和一致性。普通实现完成后 SHALL 取得绑定已提交代码的独立基线 Review；Opt 只能在该 Review 通过后由主 Agent 选择执行。Seal 前 SHALL 记录 Opt opinion 及其 `baseCommit`、`resultCommit`，或主 Agent 不做 Opt 的简短理由。主 Agent SHALL 通过 CLI 将 Seal 绑定一个 Git commit，并声明该版本可运行且预期通过适用测试。Quality 不保存代码快照、测试输出或当前工作区 fingerprint，不要求 Seal commit 匹配 HEAD 或工作区。只有基线 Review 已通过、Opt 已明确处置且 Seal 有效时，Change 才具备进入 Closure 的 Quality 资格；Sync、Delta validation 与 task gates 仍各自独立。

### Section: 不在本阶段更新正式模型

Change Implementation SHALL NOT 将 Semantic Delta 应用于正式 Semantic Model，也 SHALL NOT 关闭 Change。

- **Verify 完成**：基线独立 Review 已通过，Opt 已记录意见和 commit 关联或主 Agent 已明确记录不做 Opt，Seal 已记录主 Agent 对绑定 commit 的声明；Change 获得进入 Closure 的资格，尚未同步或归档。
