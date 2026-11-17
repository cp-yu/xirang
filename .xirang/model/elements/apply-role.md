---
entity: element-declaration
identity: apply-role
kind: element
parent: agent
title: Apply Role
definition: Apply 是 Agent 落实 Change 所描述项目改动的工作身份，独立表达写入普通实现、遵循任务安排与处理修正的责任。它以 Expected Semantic Model 为目标，结合 Change Plan 和当前状态推进；在优化集成中由主 Agent 委托 Opt 执行、判断后续投入与最终验证，不替代独立 Reviewer 或执行模型同步归档。
---

## Specification

### Section: 写入项目实现

Apply Role SHALL 在 Change Implementation 范围内修改项目文件。

- **Apply 识别待落实改动**
  - 当前状态不符合 Expected Semantic Model
  - Agent 写入实现所需修改

### Section: 接收 Verify 返回事项

Apply Role SHALL 接收普通实现 Required Corrections 并再次执行 Apply。优化中由主 Agent 安排范围和修正，Opt 受托执行优化与局部验证；主 Agent 可委托 Opt 或自行修复当前 Change 基线缺陷，修复后安排针对问题及其影响的独立 Review。

### Section: 交付状态与证据

Apply Role SHALL 将普通实现及可复现证据交付独立 Review；通过后默认委托干净上下文 Opt 只读发现，再决定授权组实施、重新独立检查或停止。协调者检查每批实际结果并提交保留改动，记录真实交付；累计未审改动必须独立 Review，按影响选择全量或增量，风险不免审。所需验证通过且证据适用后才完成 Seal。
