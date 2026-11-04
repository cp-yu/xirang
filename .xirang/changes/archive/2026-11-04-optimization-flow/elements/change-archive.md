---
entity: "element-declaration"
identity: "change-archive"
kind: "element"
parent: "change-closure"
title: "Change Archive"
definition: "Change Archive 定义归档已完成 Change 的行为：在 quality、sync、task 与 final validation gates 通过后将 active change directory 原样移动到 date-prefixed archive path、输出 git handoff 提醒，并由 Agent 在 CLI 完成后继续 git 流程；Archive 不创建、重算或覆盖任何 presentation artifact，也不执行 git 写操作。"
---

## MODIFIED Sections

### Section: Archive quality freshness routing

Archive SHALL 根据 quality status 的实际证据关联和缺口路由：缺基线则委托独立 Review；已有基线而委托未完或中断则按共享恢复协议继续原委托；最终验证缺失或过期则由主 Agent 重判并补足。优化后的代码变化不自动意味着整 Change Review 重跑。内容及证据关联不变时，HEAD informational 差异不触发重审。明确不支持旧格式时保留历史并报告，不自动迁移或删除。

### Section: Display Output

archive 命令 SHALL 提供清晰的 gate 状态反馈。

- **显示 gate 状态**

  - 执行 archive
  - 依次显示每个 gate 的通过/跳过/失败状态
  - 显示 task 完成状态
  - 归档完成后显示最终确认消息和 git handoff 提醒

- **Archive summary reports sync prerequisite status**

  - archive completes
  - the summary SHALL report whether the Sync prerequisite is satisfied（pending delta 会阻止 archive）
  - SHALL distinguish synced from blocked

- **摘要报告字段**

  - archive CLI 完成归档
  - 摘要 SHALL 包含以下字段：
  - change name
  - schema
  - archive location
  - quality gate result
  - sync 前置状态（已同步 / 因 pending delta 被阻塞）
  - next git responsibility（agent 继续处理）

- **Archive blocked by pending delta**

  - change 仍存在未同步的 Semantic Delta
  - archive SHALL 被阻止
  - 摘要 SHALL 指引先完成 `xirang sync` 后重试
  - change 保持 active

- **Archive complete with warnings**

  - archive completes with incomplete artifacts or tasks
  - include note about what was incomplete
  - suggest reviewing if archive was intentional

- **不报告 CLI merge 结果**

  - archive CLI 完成归档
  - 摘要 SHALL NOT 声称 CLI 创建了 archive commit
  - SHALL NOT 声称 CLI 执行了 merge
  - SHALL NOT 声称 CLI 删除了 feature branch

质量摘要 SHALL 区分基线 Review、实际追加 Review 及经主 Agent 判断无需追加 Review，报告最终所需验证和成功 checkpoint；有放弃优化时告知事项、原因及处理结果，不伪造未执行的 Review PASS。
