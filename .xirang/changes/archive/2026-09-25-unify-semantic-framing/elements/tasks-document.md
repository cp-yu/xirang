---
entity: "element-declaration"
identity: "tasks-document"
kind: "element"
parent: "change-plan"
title: "Tasks Document"
definition: "Tasks Document 是 Change Plan 中安排执行步骤与验证检查的文档。它帮助 Agent 生产与执行 Semantic Delta，不独立定义目标语义。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: Tasks 安排执行与验证
tasks.md SHALL 安排执行步骤与验证检查。 Tasks SHALL 具体列出实施事项、依赖与验证安排，以稳定 Contract Requirement / Scenario 引用目标语义，不重复维护另一套行为定义。可观察行为缺失时先补 Contract；记录、Contract 与 Tasks 分别承担确认依据、完整规范与执行计划职责。

#### Scenario: 撰写 Tasks
- **WHEN** 形成 Change Plan
- **THEN** tasks.md 安排执行步骤与验证检查

#### Scenario: Tasks 不定义目标语义
- **WHEN** Change Plan 与 Semantic Delta 冲突
- **THEN** 以 Semantic Delta 为准

#### Scenario: 具体安排引用规范
- **WHEN** 同一行为涉及 CLI、模板、生成面和测试
- **THEN** 明确各实施事项与验证依赖，引用适当 Contract，而不复制完整要求作为第二份权威。

### Requirement: Tasks 按 TDD 闭环组织
`tasks.md` 的每个 task SHALL 表达一个可独立实现、可独立验证的完整闭环：同一目标行为所需的生产代码、配置、生成面与测试 SHALL 归入同一 task；task 的 RED/GREEN 循环 SHALL NOT 依赖尚未完成的后续 task。 task 边界 SHALL 以独立端到端行为为准，不以文件、组件或条目数量机械分组；内部实施事项应足以发现遗漏，相关 LLM prompt 源、受管生成面及其行为检查 SHALL 与该行为同任务交付。

#### Scenario: 行为跨组件仍属同一 task
- **WHEN** 一个目标行为需要多个组件、模块或目录共同实现
- **THEN** 这些工作 SHALL 位于同一 task 内

#### Scenario: 仅独立验证或已 GREEN 依赖才拆分
- **WHEN** 每个 task 可独立达成 GREEN，或仅依赖已 GREEN 的前置 task
- **THEN** 才可拆分为多个 tasks

#### Scenario: task 不依赖后续 task
- **WHEN** task A 的验证必须依赖尚未完成的 task B
- **THEN** task 边界无效且 SHALL 重新划分

#### Scenario: Prompt 与行为同闭环
- **WHEN** 一个确认门禁需要 CLI 与 workflow prompt 共同交付
- **THEN** 将两者及受管生成面和验证安排放入同一行为闭环，不把 prompt 仅放到最后润色任务。
