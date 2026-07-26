---
element: cap.ai.subagent-self-read
---

## REMOVED Requirements

### Requirement: Impact Sweeper 保持只读
**Reason**: `xirang-impact-sweeper` 与 legacy `opsx-impact-sweeper` 均被退役，不再生成独立 Agent artifact。

**Migration**: Formal Semantic Model impact context 由只读 `xirang arch search` 与 `xirang arch impact` 提供；Reviewer 与 Optimizer 继续遵循现有 subagent read-only contract。
