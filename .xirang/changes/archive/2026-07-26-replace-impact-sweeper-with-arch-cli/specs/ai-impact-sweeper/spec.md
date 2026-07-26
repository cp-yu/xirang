---
element: cap.ai.impact-sweeper
---

## REMOVED Requirements

### Requirement: Evidence Protocol 使用 CLI 查询接口
**Reason**: 独立 Impact Sweeper capability 被退役，Semantic Model 查询改由 Explore 直接调用 `xirang arch search` 与 `xirang arch impact`。

**Migration**: Explore 使用新 CLI 获取 Formal semantic context，并通过独立代码工具获取实现证据。

### Requirement: 直接返回 canonical JSON report
**Reason**: Sweeper canonical report 及其影响分类协议不再存在。

**Migration**: `arch impact --json` 只返回确定性 Semantic Model slice，最终影响判断由 Explore Agent 完成。

### Requirement: Sweeper 全程只读
**Reason**: Sweeper Agent 本身被删除，不再需要独立只读权限合同。

**Migration**: `arch search`、`arch impact` 与 Explore 主代理分别遵循各自只读合同。

### Requirement: Impact sweeper description 提示 fast model
**Reason**: 不再生成或调用 Impact Sweeper subagent。

**Migration**: 无；CLI 确定性操作不依赖模型选择。
