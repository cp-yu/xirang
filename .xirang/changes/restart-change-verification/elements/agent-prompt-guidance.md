---
entity: element-declaration
identity: agent-prompt-guidance
kind: element
parent: agent-workbench-projection
title: Agent Prompt Guidance
definition: Agent Prompt Guidance 定义共享 quality gate 指引片段的契约：代码状态流程图、JSON 结构速查表与错误恢复决策树，供 archive、quality、apply 三个 skill 模板复用，并包含未收口恢复路径与简单变更快速路径的强制委托语义。
---

## MODIFIED Sections

### Section: Archive 模板未收口恢复路径

archive skill 模板 SHALL 在检测到 Optimization 尚未收口时提供具体的恢复指引而非仅输出 STOP。

- **尚未收口且存在可优化方向**

  - `xirang quality status` 报告 Optimization 尚未收口
  - 已记录的方向数未达 `optimization.directionLimit`
  - 模板 SHALL 指导 Agent 执行 Optimization 分析
  - 若无满足条件的方向，SHALL 以 `stopReason: NO_ACTIONABLE` 收口
  - 收口后终态变为 `NOT_NEEDED` 或 `IMPROVED`，archive 门禁通过

- **ABORTED_UNSAFE 保持 STOP**

  - `xirang quality status` 报告 Optimization 终态为 `ABORTED_UNSAFE`
  - 模板 SHALL 停止自动推进并指向 Apply、Archive 共享的恢复 reference
  - 未获用户明确重启授权时 SHALL 保持停止；用户已明确要求重启且原流程停止时，按该 reference 受控轮换后重新执行 fresh Review

### Section: Quality 模板 CLI 错误恢复指南

quality skill 模板 SHALL 包含显式的 CLI 错误恢复指南，指导 Agent 在 CLI 返回非零退出码时如何诊断和恢复。

- **入口条件不满足时按 allowedNextOperations 恢复**

  - Agent 调用 `review` 或 `optimize` 且 CLI 以 exit 1 返回
  - 错误恢复指南 SHALL 要求读取输出中的 `code` 与 `allowedNextOperations`
  - SHALL 指导 Agent 执行其中声明的下一步操作，而不是改写输入重试

- **输入形状非法时按诊断修正**

  - CLI 以 exit 2 返回 `code: INVALID_INPUT`
  - 错误恢复指南 SHALL 要求按 `diagnostics` 中的字段路径、期待值与修正方式修改输入
  - SHALL NOT 要求 Agent 阅读实现源码推断字段

- **保留 fail-closed 条目**

  - 错误恢复指南被渲染
  - SHALL 保留"记录缺失时不得推断代码状态"与"baseCommit 缺失或无效时 fail closed"等条目

- **终态需要重新验证**：对 `ABORTED_UNSAFE` 保持当前台账的优化与 Closure 阻塞，指向共享恢复 reference；对其他终态保留正常 seal/archive 路径，同时说明用户明确重验可按同一 reference 处理。`allowedNextOperations` 为空不表示必须创建接续 Change。
- **受控轮换边界**：指引 SHALL 禁止任意改写、截断或删除质量记录，但允许用户授权且流程串行时按恢复 reference 完整保存、校验和轮换整组记录。普通失败修正与续跑不适用该例外；恢复不通过伪造 CLI 输入或修改终态来完成。
