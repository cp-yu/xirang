---
entity: element-declaration
identity: snack-workflow
kind: element
parent: snack
title: Snack Workflow
definition: Snack Workflow 定义 snack 从已写代码反向 reconcile proposal、delta Contracts、design 与 Semantic Delta 的 code-first workflow：条件式 artifact reconcile、多源代码证据、独立判断 Behavior/Architecture Source impact、制品定义先行写作、不生成 `tasks.md` 与自检流程。
---

## MODIFIED Sections

### Section: Snack 执行一次自检

Snack SHALL 运行 full change validation，并通过 validate --change <name> --preview 显式请求并审阅统一 effective semantic diff。出现 ERROR/WARNING 时 SHALL 修复一轮并复检一次；validation 无 ERROR 后 SHALL 审阅 effective diff。

- **输出 reconciliation result**

  - self-check 与 diff review 完成
  - summary SHALL 披露 validation pass 或 remaining issues
  - SHALL 汇总 effective Contract 与 Architecture operations
  - SHALL 提供一条快速收束指引 `xirang archive <change> --quick`，以及继续开发选项；不把指引当作执行授权

- **Unexpected effective operation**

  - Diff IR 包含 evidence 与 authorized intent 无法支持的 operation
  - Snack SHALL 修正 proposal、Contracts、design 或 Semantic Delta source
  - SHALL NOT 通过编辑只读 preview 输出解决
