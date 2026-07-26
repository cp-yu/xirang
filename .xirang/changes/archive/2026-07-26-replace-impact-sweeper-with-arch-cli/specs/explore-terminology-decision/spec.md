---
element: cap.ai.explore-terminology-decision
---

## REMOVED Requirements

### Requirement: Explore 执行四态术语判断
**Reason**: 四态判断完全依赖已退役的 `terminologyObservations` report。

**Migration**: Explore 根据 `arch search` 的空结果或多个候选执行普通的一次一问澄清。

### Requirement: 术语问题服从 Explore 提问纪律
**Reason**: Sweeper report questions 与术语优先队列不再存在。

**Migration**: 一般性术语问题继续遵循 `explore-brainstorming` 的一次一问纪律。

### Requirement: 术语提问保持用户可读
**Reason**: 专用 terminology report presentation protocol 被删除。

**Migration**: Explore 的所有普通澄清继续遵循用户语言与 canonical token 规则。

### Requirement: 长术语列表正确截断
**Reason**: 不再展示 `foundInSpecs` 术语统计列表。

**Migration**: `arch search --limit` 控制候选 Elements 数量。

### Requirement: 用户术语决策仅记录于当前对话
**Reason**: 专用 same-concept、canonical-term 与 rejected-term group 状态不再维护。

**Migration**: Explore MAY 在 conversation-only Design Summary 中记录必要术语决策，但不使用 Sweeper 专属状态机。
