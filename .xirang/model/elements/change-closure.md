---
entity: element-declaration
identity: change-closure
kind: element
parent: change-realization
title: Change Closure
definition: Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以有效 Quality Seal 与独立的 Sync、validation、task 门禁为入口，先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再由 Archive 按门禁保存已完成的 Change 并结束活动状态。
---

## Specification

### Section: 仅接受有效验证结果

Change Closure SHALL 要求 Change 已具有通过的独立基线 Review、Seal 前的明确 Opt 处置，以及绑定 Git commit 的主 Agent Seal 声明。Seal 声明只表示主 Agent 判断该 commit 可运行且预期通过适用测试，不是 CLI 执行测试的证明。Sync 与 Archive 分别执行既有 Semantic Delta、validation 和 task 门禁；Quality 不比较 Seal commit 与 HEAD 或工作区内容，也不要求工作区 clean。Archive 的 Quality 门禁只确认 Seal commit 对象仍存在。质量意见或 Seal 的缺失、格式错误或 commit 对象不存在时，不得通过 Quality 门禁。

### Section: 先同步后归档

Closure SHALL 先通过 CLI Sync 将 Semantic Delta 原子应用于 Semantic Model，使 Expected Semantic Model 成为新正式模型；再由 Archive 保存已完成 Change 并结束活动状态。Sync 与 Archive 的 Semantic Delta、validation 和 task 门禁独立于 Quality Seal。

- **完成 Change Closure**

  - Quality Seal 有效且所绑定 commit 对象仍存在
  - Sync 与 Archive 各自门禁均成功
  - 项目实现和 Semantic Model 进入一致的新稳定状态

### Section: 原样归档 Change 制品

Archive SHALL 在适用门禁通过后原样移动 active Change directory，SHALL NOT 创建、重算、校验或覆盖任何 View presentation artifact。

- **Change 不含持久化呈现结果**

  - 一个通过归档门禁的 active Change 不含 View presentation artifact
  - Archive 成功移动该 Change 且不创建额外呈现文件

- **Change 含已有 legacy 文件**

  - 一个通过归档门禁的 active Change 含已有 legacy presentation file
  - Archive 随目录移动该文件并保持其内容字节不变
