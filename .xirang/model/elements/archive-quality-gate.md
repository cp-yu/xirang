---
entity: element-declaration
identity: archive-quality-gate
kind: element
parent: change-closure
title: Archive Quality Gate
definition: Archive Quality Gate 是 Change Closure 在归档前消费完整质量证据的门禁，独立验证基线 Review、优化交付或明确跳过、主 Agent 最终结论、所需通过验证与当前成功状态的关联。缺口恢复复用 Apply 的执行协议，不另行判断优化价值或将无需追加 Review 当 PASS；归档移动、Git 交接及 Sync 事务属于各自能力。
---

## Specification

### Section: 归档前必须具备新鲜的完整验证记录

Archive SHALL 通过 CLI 校验当前完整质量证据后才能正常复用结果，不能退回 inline conformance check。完成条件 SHALL 关联优化前通过的独立基线 Review、已完整交付的委托或配置禁用/用户拒绝的明确跳过、实际成功测试、主 Agent 的最终验证范围与理由、所有已声明必需的增量 Review，以及当前 Change 基线缺陷修复后必需的针对性独立 Review；所需验证全部通过且证据适用当前状态、无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。未追加 Review 的风险判断不记为 Reviewer PASS，基线 PASS 不声称覆盖优化后代码。 缺口返回非零并说明具体所需行动；明确跳过可以满足优化处置，不免除基线或适用测试。仅 HEAD 推进且内容/证据关联不变时不重跑质量流程。

### Section: Freshness 基于显式验证证据判定

Archive SHALL 基于实际测试与 Review 的状态、范围、结果、当前代码集合及主 Agent 结论判断适用性，不以记录时哈希冒充执行时状态。tasksFileHash 和仅 HEAD 差异不单独决定代码新鲜度；实现新增、删除或内容变化须进入比较。基线 Review 不覆盖后续优化；过期/失败测试、未交付和恢复不确定均不能完成。

### Section: Archive rerun 使用 quality 执行模型

Archive SHALL 复用 Apply 的 subagent-orchestrated 模型及同一优化/恢复 references，根据具体缺口补基线 Review、继续原委托或重新判断最终验证，不建立单独审查骨架，也不因任意优化修改强制 full quality 重跑。优化中断后 SHALL 在主 Agent 确认旧写入者已停止后核对原委托、最近进度与磁盘差异，默认继续同一委托；意外中断可能没有最终保存。记录 A 已完成而磁盘有半成品 B 时，检查 B 和相互影响后继续、修正或撤销，不直接判 B 完成或自动丢弃 A/B。未记录、未验证或过期证据需补查；归属或恢复可靠性不明时停止并交回主 Agent。只有主 Agent 主动开始新探索才建新委托。 配置未禁用且用户未拒绝时，缺失的初次优化仍须委托 Opt，不因 archive-time 未提交改动自动跳过。不支持的旧质量格式、旧命令输入和退役优化配置 SHALL 给出明确诊断，不静默解释、自动迁移或启用兼容执行路径。旧活动记录不自动转换为新完成结论；既有代码、commits/checkpoints、归档和历史记录 SHALL 保留，由主 Agent 与用户判断旧 Change 如何继续。

### Section: Archive 与 Sync 双重门禁

`xirang archive` 命令 SHALL 在执行归档前校验 quality 和 sync 状态。默认强制执行，`--no-verify` 标志提供显式用户授权绕过通道。

- **双重门禁通过，继续 archive**

  - agent 执行 `xirang archive <change-name>`
  - quality gate 通过（基线、交付/明确跳过、主 Agent 结论、当前所需通过验证及最终 successful checkpoint 完整）
  - sync 已完成
  - 系统 SHALL 继续执行 archive 逻辑

- **门禁不通过，合并询问**

  - agent 执行 `xirang archive <change-name>`
  - quality gate 或 sync gate 任一不通过
  - 系统 SHALL 输出两个门禁的合并状态
  - SHALL 以 exit 1 退出
  - agent SHALL 向用户展示合并选项：先运行 quality+sync / 仅 sync / 强制继续 / 放弃

- **用户显式授权绕过门禁**

  - agent 执行 `xirang archive <change-name> --no-verify`
  - 用户未同时使用 `--yes` 标志
  - 系统 SHALL 显示风险警告并要求交互式确认
  - 用户拒绝确认
  - archive SHALL 取消并提示使用标准 quality gate
  - 用户确认授权
  - 系统 SHALL 记录 `[AUTHORIZED]` 审计日志
  - SHALL 跳过 quality 和 sync 门禁检查
  - SHALL 继续执行 archive 逻辑

- **--yes 模式下的 --no-verify 静默绕过**

  - agent 执行 `xirang archive <change-name> --no-verify --yes`
  - 系统 SHALL 跳过交互式确认
  - SHALL 记录 `[AUTHORIZED]` 审计日志
  - SHALL 直接跳过 quality 和 sync 门禁检查
