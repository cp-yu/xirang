---
entity: element-declaration
identity: review
kind: element
parent: quality
title: Review
definition: Review 是 Quality 中由代码状态反复触发的正确性门禁：只要存在未经 Review 的代码变更，就必须先执行 Review。它由 Reviewer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，独立评估 Change 是否完整落实、项目行为是否正确、实现是否遵循决策与约束、必要清理是否完成，并判断当前结果是否符合 Expected Semantic Model。
---

## Specification

### Section: 在每次 Apply 修改后执行

Review SHALL 在每次 Apply 修改项目后执行。

- **项目状态被修改**

  - Apply 完成一轮写入
  - 最新状态进入 Review

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

Review SHALL 评估 Change 是否完整落实、行为是否正确、实现是否一致、项目约束是否遵循以及必要清理是否完成。

- **检查当前状态**

  - Reviewer 对照 Expected Semantic Model
  - 逐项评估完整性、正确性、一致性与清理

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

Review 通过时，当前项目状态 SHALL 有资格成为 baseline 或 successful checkpoint。

- **当前状态通过 Review**

  - 没有阻塞问题且证据充分
  - Quality 可保存该状态为 Checkpoint

### Section: 结论绑定被评估状态

Review 结论 SHALL 只适用于被评估的项目状态。

- **Review 后项目修改**

  - 当前项目状态发生任何修改
  - 旧 Review 结论不适用于新状态

### Section: 修改后重新 Review

任何项目修改 SHALL 要求修改后的状态重新执行 Review。

- **Apply 实现修正或优化**

  - 项目产生新状态
  - 该状态成为 `dirty`
  - Quality 再次进入 Review
