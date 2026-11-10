---
entity: element-declaration
identity: show-command
kind: element
parent: deterministic-operations
title: Show Command
definition: Show Command 是活动 Change 的只读展示入口。它支持无参数时交互选择活动 Change，文本呈现 proposal.md，JSON 呈现编译后的身份、概况和 entries，显式 review 模式交付完整审阅投影；执行诊断通过 stderr 提供。它不提供 Element 或 Contract 选择，也不将展示结果作为新的规范来源。
---

## Specification

### Section: Top-level show command

CLI SHALL 提供顶层 `show` 命令，用于展示活动 Changes。

- **Interactive show selection**

  - 执行 `xirang show` 而不带参数且 stdin 为 TTY
  - 列出活动 Changes 供用户选择，然后展示选中 Change

- **无活动 Changes**

  - 执行 `xirang show` 而不带参数
  - 不存在活动 Change
  - 显示 "No changes found." 并以 exit code 1 退出

- **Non-interactive environments do not prompt**

  - stdin 不是 TTY 或提供了 `--no-interactive` 或设置了 `XIRANG_INTERACTIVE=0`
  - 执行 `xirang show` 而不带参数
  - 不提示并打印示例提示（`xirang show <change>`）
  - 以 exit code 1 退出

### Section: 直接展示仅接受活动 Change

`xirang show <change>` SHALL 只接受活动 Change 名称；非活动 Change 或任何其他名称 SHALL 被拒绝并给出 not-found 提示。

- **展示活动 Change**

  - 执行 `xirang show <change>` 且 `<change>` 是活动 Change
  - 展示该 Change

- **未知或非活动 Change 被拒绝**

  - `<change>` 不是活动 Change（不存在或已归档）
  - 打印 `Unknown item '<change>'` 错误
  - 给出最近匹配建议（如有）
  - 以 exit code 1 退出

### Section: 文本输出返回 proposal.md

`xirang show <change>` 的文本输出 SHALL 读取并输出该活动 Change 的 `proposal.md` 内容。

- **文本展示 proposal**

  - 用户不带 `--json` 执行 `xirang show <change>`
  - CLI 读取 `.xirang/changes/<change>/proposal.md` 并输出其内容

### Section: JSON 输出返回编译结果

show <change> --json SHALL 编译指定活动 Change，成功时向 stdout 返回 id、title、valid、实体级 summary 与以 entity kind 和稳定 identity 表达的 concise entries。compiler 警告 SHALL 在 stderr 返回；编译失败 SHALL 非零退出并在 stderr 返回具体结构化诊断，不将部分 entries 声称为有效目标。完整 review projection 由显式 --review 获取。
