---
element: cap.ai.sweeper-terminology-reporting
---

## REMOVED Requirements

### Requirement: terminologyObservations 字段结构
**Reason**: Sweeper canonical report 与 `terminologyObservations` 字段被删除。

**Migration**: `arch search` 返回 Element candidates 与具体 match evidence。

### Requirement: 向后兼容性保证
**Reason**: 本变更不保留旧 Sweeper 报告兼容入口。

**Migration**: Explore 直接消费新 CLI 输出。

### Requirement: foundInSpecs 数组排序规则
**Reason**: 不再生成 `foundInSpecs`。

**Migration**: `arch search` 使用确定性字段优先级和 stable `elementId` 排序。

### Requirement: specs 数组去重与排序
**Reason**: 不再生成 terminology report 的 Spec 分布数组。

**Migration**: 新 CLI 通过 Spec Registry 返回去重且稳定排序的 owned Contracts。

### Requirement: 字段省略规则
**Reason**: `terminologyObservations` 字段及其失败状态被整体删除。

**Migration**: `arch search` 无匹配时返回空 `matches`。

### Requirement: JSON Schema 扩展文档
**Reason**: 旧 Sweeper TypeScript report interface 与 JSON schema 被退役。

**Migration**: 新命令分别维护 `arch search` 与 `arch impact` 的 canonical result types。
