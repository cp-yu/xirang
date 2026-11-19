---
entity: element-declaration
identity: change-closure
kind: element
parent: change-realization
title: Change Closure
definition: Change Closure 是结束活动 Change 的阶段：默认验证或显式免 Seal 的交付将 Delta 应用到正式模型并封存，放弃则保留未交付方案而不应用 Delta。它协调同一次调用的失败回滚，不替代质量评估或提供历史撤销。
---

## Specification

### Section: 原样归档 Change 制品

Archive SHALL 在适用门禁通过后原样移动 active Change directory，SHALL NOT 创建、重算、校验或覆盖任何 View presentation artifact。

- **Change 不含持久化呈现结果**

  - 一个通过归档门禁的 active Change 不含 View presentation artifact
  - Archive 成功移动该 Change 且不创建额外呈现文件

- **Change 含已有 legacy 文件**

  - 一个通过归档门禁的 active Change 含已有 legacy presentation file
  - Archive 随目录移动该文件并保持其内容字节不变

### Section: 收束模式与授权

Change Closure SHALL 通过同一个 archive 入口结束活动 Change。默认交付要求有效 Seal；显式 quick 仅豁免 Seal，不被报告为 Quality 通过。两种交付均完整校验 Delta、目标模型与写入基线，保留未完成任务的继续确认；放弃则在任何进度下均可确认留档，只提示文件证明的已勾选进度，默认确认一次；回车或拒绝保持活动，--yes 代替交互而不隐藏提示。放弃不应用 Delta，也不触发实现回退、合并或清理。交付位于 archive 日期目录，放弃位于 archive/abandoned 日期目录，均原样保存，无需改写制品标记结果。

### Section: 交付与失败边界

普通和 quick 交付 SHALL 在同一次调用内应用 Delta 并原样归档，模型写入后移动失败则撤回本次写入，使 Change 保持活动。不维护跨进程恢复日志；强杀后的重试不保证修复此前遗留的改动。已成功交付后，后续修改从当前正式模型发起新的 Change；即使恢复旧行为，也以新差量保留期间其他 Change 的修改及归档历史。用户侧不提供撤销归档命令。
