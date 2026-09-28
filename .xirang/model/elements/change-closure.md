---
entity: element-declaration
identity: change-closure
kind: element
parent: change-realization
title: Change Closure
definition: Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以 Change Implementation 的有效验证结果为入口，先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再通过 Archive 原样保存已完成的 Change 及其最终证据，并结束 Change 的活动状态。
---

## Specification

### Section: 仅接受有效验证结果

Change Closure SHALL 以仍然有效的 Change Implementation 验证结果为入口，SHALL NOT 基于未验证或已过期的项目状态同步或归档。

- **验证结果不再有效**

  - Closure 无法确认当前项目状态仍由该验证结果覆盖
  - Closure 拒绝推进并要求重新验证

### Section: 先同步后归档

Closure SHALL 先通过 CLI Sync 将 Semantic Delta 原子应用于 Semantic Model，使 Expected Semantic Model 成为新正式模型；再由 Archive 保存已完成 Change 与最终证据并结束活动状态。

- **完成 Change Closure**

  - Sync 与 Archive 均成功
  - 项目实现和 Semantic Model 进入一致的新稳定状态

### Section: 原样归档 Change 制品

Archive SHALL 在适用门禁通过后原样移动 active Change directory，SHALL NOT 创建、重算、校验或覆盖任何 View presentation artifact。

- **Change 不含持久化呈现结果**

  - 一个通过归档门禁的 active Change 不含 View presentation artifact
  - Archive 成功移动该 Change 且不创建额外呈现文件

- **Change 含已有 legacy 文件**

  - 一个通过归档门禁的 active Change 含已有 legacy presentation file
  - Archive 随目录移动该文件并保持其内容字节不变
