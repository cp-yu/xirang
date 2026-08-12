---
entity: element-declaration
identity: tasks-document
kind: element
parent: change-plan
title: Tasks Document
definition: Tasks Document 是 Change Plan 中安排执行步骤与验证检查的文档。它帮助 Agent 生产与执行 Semantic Delta，不独立定义目标语义。
---

## ADDED Requirements

### Requirement: Tasks 按 TDD 闭环组织

`tasks.md` 的每个 task SHALL 表达一个可独立实现、可独立验证的完整闭环：同一目标行为所需的生产代码、配置、生成面与测试 SHALL 归入同一 task；task 的 RED/GREEN 循环 SHALL NOT 依赖尚未完成的后续 task。

#### Scenario: 行为跨组件仍属同一 task

- **WHEN** 一个目标行为需要多个组件、模块或目录共同实现
- **THEN** 这些工作 SHALL 位于同一 task 内

#### Scenario: 仅独立验证或已 GREEN 依赖才拆分

- **WHEN** 每个 task 可独立达成 GREEN，或仅依赖已 GREEN 的前置 task
- **THEN** 才可拆分为多个 tasks

#### Scenario: task 不依赖后续 task

- **WHEN** task A 的验证必须依赖尚未完成的 task B
- **THEN** task 边界无效且 SHALL 重新划分
