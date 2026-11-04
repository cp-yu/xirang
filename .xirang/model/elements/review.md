---
entity: element-declaration
identity: review
kind: element
parent: quality
title: Review
definition: Review 是 Quality 中独立评估实现正确性的活动，独立承载证据判断而不负责优化价值或最终验证范围决策。它由 clean-context Reviewer 审查基线完整 Change、主 Agent 要求的优化增量范围或基线遗漏缺陷的修复及影响，输出实际范围和状态上的结论与修正事项；不修改项目或管理 checkpoint。
---

## Specification

### Section: 在每次 Apply 修改后执行

普通 Apply 实现与其 Review 修正完成后 SHALL 执行 Change 级独立 Review，作为优化前基线。优化开始后，主 Agent 按实际风险决定是否追加增量 Review；修复基线遗漏的当前 Change 正确性缺陷后 SHALL 追加针对该问题及其影响的独立 Review。

### Section: 在 Clean Context 中独立评估

Review SHALL 由 Reviewer 在不受 Apply 上下文影响的 clean context 中执行。

- **Review 开始**

  - 当前状态可供评估
  - Reviewer 使用隔离上下文

### Section: 读取完整评估依据

Review SHALL 读取 Semantic Model、Change、当前项目状态与项目证据。

- **Reviewer 形成判断**

  - Review 获取输入
  - 四类依据共同支持结论

### Section: 评估目标实现质量

Review SHALL 对实际委托范围评估完整性、正确性、一致性、项目约束和必要清理。基线 Review 评估完整 Change；增量 Review 评估指定累计改动与影响；基线缺陷修复 Review 评估缺陷、修复及其影响。不得将局部评估声明为新整 Change 审查。

### Section: 先证据后结论

Review SHALL 只以当前项目状态中独立获得的充分证据判定通过。

- **只有完成声明**

  - 当前状态缺少覆盖目标行为的证据
  - Review 不推测通过

### Section: 输出 Required Corrections 或证据缺口

证据缺失、证据矛盾或实现不符合目标时，Review SHALL 输出 Required Corrections 或明确证据缺口。

- **发现阻塞问题**

  - 当前实现未满足门禁
  - 问题返回 Apply

### Section: 通过状态具备 Checkpoint 资格

基线 Review 通过后，项目状态 SHALL 具备 baseline checkpoint 资格。优化中的 Review 通过仅满足其实际范围内的独立验证要求，最终 successful checkpoint 仍以主 Agent 确定的全部验证通过且证据当前为条件。

### Section: 结论绑定被评估状态

Review 结论 SHALL 绑定实际被评估状态与范围，不因稍后保存记录而重绑当前代码。基线 PASS 不证明后续优化已被独立审查；主 Agent 判断无需追加 Review 不构成 Reviewer PASS。

### Section: 修改后重新 Review

普通实现修正 SHALL 重新执行 Change 级 Review；优化修改 SHALL 由主 Agent 重新判断受影响验证，不强制每项追加 Review。已声明需要的增量 Review 和基线缺陷修复 Review 必须完成并通过才可收尾。
