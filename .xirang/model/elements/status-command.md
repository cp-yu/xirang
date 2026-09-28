---
entity: element-declaration
identity: status-command
kind: element
parent: deterministic-operations
title: Status Command
definition: Status Command 定义 `xirang status` 的行为：无 changes 时优雅退出，并保留既有 validateChangeExists 的错误路径行为。
---

## Specification

### Section: Status command exits gracefully when no changes exist
`statusCommand` SHALL 通过 `getAvailableChanges` 检查可用 changes，再决定是否调用 `validateChangeExists`。当未提供 `--change` 且不存在任何 change 目录时，SHALL 打印友好的提示信息并以 exit code 0 退出。

- **No changes exist, text mode**
  - 用户运行 `xirang status` 而不带 `--change` 且 `.xirang/changes/` 下没有 change 目录
  - CLI 打印 `No active changes. Create one with: xirang new change <name>` 并以 exit code 0 退出

- **No changes exist, JSON mode**
  - 用户运行 `xirang status --json` 而不带 `--change` 且没有 change 目录
  - CLI 输出 `{"changes":[],"message":"No active changes."}` 作为合法 JSON 并以 exit code 0 退出

### Section: Existing status validation behavior is preserved
`validateChangeExists` 中适用于 status 命令的其他错误路径 SHALL 继续按原样抛错；使用 `validateChangeExists` 的 status 之外命令 SHALL NOT 受影响。

- **Changes exist but --change not specified**
  - 用户运行 `xirang status` 而不带 `--change` 且存在一个或多个 change 目录
  - CLI 抛出列出可用 changes 的错误 `Missing required option --change. Available changes: ...`

- **Specified change does not exist**
  - 用户运行 `xirang status --change non-existent`
  - CLI 抛出错误 `Change 'non-existent' not found`

- **Other commands unaffected**
  - 用户运行 `xirang show` 或 `xirang instructions` 而不带 `--change` 且没有 changes
  - CLI 抛出原始 `No changes found` 错误（无行为变化）
