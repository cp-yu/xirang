---
entity: element-declaration
identity: change-implementation
kind: element
parent: change-realization
title: Change Implementation
definition: Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过独立评估与可复现证据确认项目结果与 Expected Semantic Model 一致；验证通过后，Change 可进入 Change Closure，本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。
---

## Specification

### Section: 实现并独立验证目标状态

Change Implementation SHALL 由 Apply 依据 Expected Semantic Model 落实项目，并由 Verify 使用独立判断与可复现证据确认完整性、正确性和一致性。普通实现及基线 Review 修正完成后 SHALL 接受 Change 级独立 Review；优化由受托 Opt 执行，主 Agent 负责范围、后续投入及最终验证。优化前实现 SHALL 先通过独立 Review。主 Agent SHALL 根据累计优化改动、行为保持依据与测试覆盖确定最终验证范围并简短说明理由；测试必需，全量测试和优化后增量 Review 按实际风险决定，不增加固定风险审批。已确认的当前 Change 基线正确性缺陷 SHALL 修复并通过针对问题及其影响的独立 Review。只有所需验证全部完成且通过、证据对应当前状态、交付完整且无未解决的正确性或恢复问题时，才可保存最终 successful checkpoint 并完成。基线 Review 不证明后续改动经过独立审查；无需追加 Review 的判断不记为 Reviewer PASS。后续代码变化 SHALL 重新判断受影响的验证。

### Section: 不在本阶段更新正式模型

Change Implementation SHALL NOT 将 Semantic Delta 应用于正式 Semantic Model，也 SHALL NOT 关闭 Change。

- **Verify 完成**：基线独立 Review、优化交付或明确跳过、主 Agent 选择的当前所需验证及最终 successful checkpoint 均成立；Change 获得进入 Closure 的资格，尚未同步或归档。
