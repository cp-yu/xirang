---
entity: element-declaration
identity: tasks-document
kind: element
parent: change-plan
title: Tasks Document
definition: Tasks Document 是 Change Plan 中安排执行步骤与验证检查的文档。它帮助 Agent 生产与执行 Semantic Delta，不独立定义目标语义。
---

## Requirements

### Requirement: Tasks 安排执行与验证

tasks.md SHALL 安排执行步骤与验证检查。

#### Scenario: 撰写 Tasks

- **WHEN** 形成 Change Plan
- **THEN** tasks.md 安排执行步骤与验证检查

#### Scenario: Tasks 不定义目标语义

- **WHEN** Change Plan 与 Semantic Delta 冲突
- **THEN** 以 Semantic Delta 为准

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

### Requirement: Checks 按可观察行为组织

`tasks.md` 的 Check SHALL 作为证据单元验证一个可观察行为及其失败原因，SHALL NOT 机械对应每个 Scenario 或每句规格。Check SHALL 声明测试动作：reuse、modify、add、delete 或 one-time；one-time Check SHALL NOT 要求创建 persistent test file。

#### Scenario: 同一行为共用一个 Check

- **WHEN** 多个 Scenario 具体化同一可观察行为与同一失败原因
- **THEN** 它们 SHALL 由同一个 Check 验证
- **AND** Check 的 `Verifies` 可引用这些 Scenario

#### Scenario: 测试动作显式声明

- **WHEN** Check 需要持久化测试证据
- **THEN** Files 或 Check 正文 SHALL 标明 reuse、modify、add 或 delete 的测试路径
- **AND** Apply SHALL 按该动作执行，不得在已声明 modify 时默认新建文件

#### Scenario: one-time Check 不建测试文件

- **WHEN** Check 验证 typecheck、build、一次性 grep 或制品文本
- **THEN** Check SHALL 使用 Command 或 Evidence，且 Files SHALL NOT 新增 persistent test file
