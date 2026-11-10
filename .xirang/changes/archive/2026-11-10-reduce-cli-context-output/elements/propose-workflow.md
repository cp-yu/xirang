---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: "Propose Workflow"
definition: "Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。"
---

## MODIFIED Sections

### Section: Propose 使用制品定义先行写作

每个 artifact 写入前，workflow SHALL 读取 resolved definition，按 content boundaries 路由语义，再执行 artifact instruction 与 template。Delta Contracts SHALL 只包含 target-state 的 Sections 与 Acceptance Cases；Acceptance Case SHALL 描述特定条件下的可观察行为，SHALL NOT 规定实现结构、文档排版、说明性措辞、标题顺序或测试拆分，除非该精确表示本身就是可观察契约；完成 artifacts 后 SHALL 使用统一 change compiler 审阅 effective changes。

- **Acceptance Case operations 通过 diff 审阅**

  - Agent 已完成 delta Contracts、design、结构目标与 combined validation
  - SHALL 通过 validate --change <name> --preview 显式请求并审阅 concise preview
  - 非预期 operation SHALL 阻塞 ready-for-apply 并要求修正 source

- **Sections 按 Behavior Source 生成**

  - propose 创建 change-local Contracts
  - SHALL 只消费 proposal Behavior Source 中的 Element identities
  - SHALL 读取 Formal Contract 的 exact Section titles 后 author delta

- **Specs boundary 不重复定义**

  - workflow 生成 Contracts
  - SHALL 按需读取共享制品 reference 中的 resolved definition 与 Element-owned Contract delta authoring 指导
  - SHALL NOT 在 workflow template 维护竞争的 behavior boundary

- **Acceptance Case 写行为而非排版**

  - Propose 编写或修改 Acceptance Case
  - Acceptance Case SHALL 描述条件与可观察结果
  - SHALL NOT 把生成文档标题、段落顺序或完整例句当作行为，除非该精确 token 本身是对外协议
