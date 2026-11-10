---
entity: element-declaration
identity: snack-workflow
kind: element
parent: snack
title: "Snack Workflow"
definition: "Snack Workflow 定义 snack 从已写代码反向 reconcile proposal、delta Contracts、design 与 Semantic Delta 的 code-first workflow：条件式 artifact reconcile、多源代码证据、独立判断 Behavior/Architecture Source impact、制品定义先行写作、不生成 `tasks.md` 与自检流程。"
---

## MODIFIED Sections

### Section: Snack 使用 Source Impact reconcile Proposal

Snack SHALL 按需读取共享 proposal 制品定义与指导，并使用 canonical `## Source Impact` 独立记录 Behavior Source 与 Architecture Source。Behavior Source 使用 Element 稳定 identity（全局寻址 `<element identity>#<Section name>`），与 graph 使用的 identity 属于同一 identity 空间。

- **Current proposal 保持不变**

  - proposal 已与 evidence 和 source impact 一致
  - snack SHALL 不修改该 artifact

- **Behavior Source 驱动 Specs**

  - snack reconcile proposal
  - New/Modified Contracts SHALL 使用宿主 Element 的稳定 identity 声明
  - 同一列表 SHALL 驱动后续 delta Contracts
  - MUST NOT 使用 Xirang capability ID 作为 Contract 目录名

### Section: Snack 执行一次自检

Snack SHALL 运行 full change validation，并通过 validate --change <name> --preview 显式请求并审阅统一 effective semantic diff。出现 ERROR/WARNING 时 SHALL 修复一轮并复检一次；validation 无 ERROR 后 SHALL 审阅 effective diff。

- **输出 reconciliation result**

  - self-check 与 diff review 完成
  - summary SHALL 披露 validation pass 或 remaining issues
  - SHALL 汇总 effective Contract 与 Architecture operations
  - SHALL 提供 quick sync、sync-and-archive（Sync 完成后 Archive）与 continue-development paths

- **Unexpected effective operation**

  - Diff IR 包含 evidence 与 authorized intent 无法支持的 operation
  - Snack SHALL 修正 proposal、Contracts、design 或 Semantic Delta source
  - SHALL NOT 通过编辑只读 preview 输出解决
