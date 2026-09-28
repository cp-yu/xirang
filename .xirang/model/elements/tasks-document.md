---
entity: element-declaration
identity: tasks-document
kind: element
parent: change-plan
title: Tasks Document
definition: Tasks Document 是 Change Plan 中安排执行步骤与验证检查的文档。它帮助 Agent 生产与执行 Semantic Delta，不独立定义目标语义。
---

## Specification

### Section: Tasks 安排执行与验证

tasks.md SHALL 安排执行步骤与验证检查。 Tasks SHALL 具体列出实施事项、依赖与验证安排，以稳定 Contract Section 引用目标语义，需要时引用其 Acceptance Case，不重复维护另一套行为定义。可观察行为缺失时先补 Contract；记录、Contract 与 Tasks 分别承担确认依据、完整规范与执行计划职责。

- **撰写 Tasks**

  - 形成 Change Plan
  - tasks.md 安排执行步骤与验证检查

- **Tasks 不定义目标语义**

  - Change Plan 与 Semantic Delta 冲突
  - 以 Semantic Delta 为准

- **具体安排引用规范**

  - 同一行为涉及 CLI、模板、生成面和测试
  - 明确各实施事项与验证依赖，引用适当 Contract，而不复制完整要求作为第二份权威。

### Section: Tasks 按 TDD 闭环组织

`tasks.md` 的每个 task SHALL 表达一个可独立实现、可独立验证的完整闭环：同一目标行为所需的生产代码、配置、生成面与测试 SHALL 归入同一 task；task 的 RED/GREEN 循环 SHALL NOT 依赖尚未完成的后续 task。 task 边界 SHALL 以独立端到端行为为准，不以文件、组件或条目数量机械分组；内部实施事项应足以发现遗漏，相关 LLM prompt 源、受管生成面及其行为检查 SHALL 与该行为同任务交付。

- **行为跨组件仍属同一 task**

  - 一个目标行为需要多个组件、模块或目录共同实现
  - 这些工作 SHALL 位于同一 task 内

- **仅独立验证或已 GREEN 依赖才拆分**

  - 每个 task 可独立达成 GREEN，或仅依赖已 GREEN 的前置 task
  - 才可拆分为多个 tasks

- **task 不依赖后续 task**

  - task A 的验证必须依赖尚未完成的 task B
  - task 边界无效且 SHALL 重新划分

- **Prompt 与行为同闭环**

  - 一个确认门禁需要 CLI 与 workflow prompt 共同交付
  - 将两者及受管生成面和验证安排放入同一行为闭环，不把 prompt 仅放到最后润色任务。

### Section: 任务粒度对齐规范容器

`tasks.md` 的 task 边界 SHALL 与 Contract 的内容容器对齐：每个适用的 +N 大点、每条护甲层边界项、每个关键验收案例各自 SHALL 具有可独立验证的任务或 Check 单元。这样细节在生成 tasks 时即暴露为缺口，而不推迟到模型对齐才被发现。

- **适用大点各自成单元**

  - Contract 挂载了并发契约、状态生命周期或外部降级等 +N 大点
  - tasks SHALL 为每个大点安排可独立验证的实施与检查

- **护甲层项不遗漏**

  - 业务规格列出了极值、资源枯竭或安全防御项
  - tasks SHALL 覆盖这些边界项，不得只覆盖主流程

- **验收案例可被引用**

  - Contract 的关键验收案例大点包含 Acceptance Case
  - tasks 的 Check MAY 通过 `Acceptance Case "<name>"` 引用它建立验证关系

- **不按条目数量机械拆分**

  - 多个容器项共享同一实现与验证闭环
  - SHALL 归入同一 task，不按容器条数逐条拆任务

### Section: Checks 按可观察行为组织

`tasks.md` 的 Check SHALL 作为证据单元验证一个可观察行为及其失败原因，SHALL NOT 机械对应每句规格或每个 Acceptance Case。Check SHALL 通过唯一的 `Test action:` 字段声明一个测试动作：`reuse`（原样运行已有测试）、`modify`（修改已有测试）、`add`（新增测试）、`delete`（删除过时测试并验证剩余行为或缺失）或 `one-time`（一次性证据）；该字段 SHALL NOT 替代 Command、Evidence 或 Expect 等验证证据；one-time Check SHALL NOT 要求创建 persistent test file。

Check 引用目标语义时 SHALL 使用 `Section "<title>"` 锚点；验证关键验收案例时 MAY 追加 `Acceptance Case "<name>"`。

- **同一行为共用一个 Check**

  - 多条规格具体化同一可观察行为与同一失败原因
  - 它们 SHALL 由同一个 Check 验证
  - Check 的 `Verifies` 可引用这些 Section

- **测试动作显式声明**

  - Check 需要持久化测试证据
  - Files 或 Check 正文 SHALL 标明 reuse、modify、add 或 delete 的测试路径
  - Apply SHALL 按该动作执行，不得在已声明 modify 时默认新建文件

- **one-time Check 不建测试文件**

  - Check 验证 typecheck、build、一次性 grep 或制品文本
  - Check SHALL 使用 Command 或 Evidence，且 Files SHALL NOT 新增 persistent test file
