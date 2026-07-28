---
entity: element-declaration
identity: change-derived-views
kind: capability
parent: derived-views
title: "Change-derived Views"
definition: "由当前模型与 Semantic Delta 推导的变更差异视图。"
---

## Requirements

### Requirement: 从模型与 Delta 确定性推导
Change-derived View SHALL 由当前 Semantic Model 与该 Change 的 Semantic Delta 确定性推导。

#### Scenario: 重建 Change View
- **WHEN** 系统以相同模型和 Delta 再次生成视图
- **THEN** 得到语义等价的 Change-derived View

### Requirement: 呈现 Change 语义差异
Change-derived View SHALL 以 diff 视角呈现该 Change 新增、修改或移除的语义。

#### Scenario: 审查 Change
- **WHEN** 用户查看一个活动 Change
- **THEN** 视图区分 ADDED、MODIFIED 与 REMOVED 语义
