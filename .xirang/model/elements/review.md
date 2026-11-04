---
entity: element-declaration
identity: review
kind: element
parent: quality
title: Review
definition: Review 是 Quality 中由 clean-context Reviewer 独立评估实现正确性的活动，独立承载基于证据的结论与修正意见。每条 Review opinion 绑定一个已提交的 Git commit；Review 不修改项目、不管理代码恢复，也不替主 Agent 决定优化价值或最终验证范围。
---

## Specification

### Section: 在每次 Apply 修改后执行

普通 Apply 实现完成后 SHALL 执行覆盖完整 Change 的独立基线 Review，且被审查代码在 Review 开始前已提交为 Git commit。Review 不通过时，主 Agent SHALL 处理 Required Corrections、形成不同的修正 commit，并针对该 commit 重新执行 Review，直至取得通过的基线 Review。只有通过的基线 Review 才允许 Opt 开始或 Seal；Opt 后是否追加增量 Review 由主 Agent 按风险决定。

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

每条 Review opinion SHALL 包含其实际评估的 Git commit identity、审查范围、结果、summary 与 findings。Review 开始前目标代码 SHALL 已提交，审查期间保持该代码状态不变；保存 opinion 时 SHALL 保留原 commit identity，不因之后的代码修改重绑结论。通过的基线 Review 是 Opt 和 Seal 的必要前置条件。

### Section: 修改后重新 Review

基线 Review 失败后的修正 SHALL 提交为不同 Git commit，并针对该 commit 重新 Review；重复此过程直至基线通过。Opt 修改本身不自动要求 Review；是否进行 Opt 后 Review 由主 Agent 决定。已执行且失败的增量 Review 所指问题由主 Agent 处理，后续 Review 仍须准确关联其实际审查的 commit。
