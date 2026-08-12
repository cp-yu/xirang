---
entity: element-declaration
identity: apply-workflow
kind: element
parent: apply
title: Apply Workflow
definition: Apply Workflow 定义 `xirang-apply-change` 如何处理工作流状态，并由 Master agent 串行完成 Phase 0 后进入 clean-context 验证阶段；它处理 `needs_verify` 与 `needs_seal` 状态分支，并要求 Master agent 直接执行实现而不委托 implementer。
---

## Requirements

### Requirement: Apply 模板 SHALL 处理中间验证状态

`xirang-apply-change` 技能模板 SHALL 对 `needs_verify` 和 `needs_seal` 状态提供正确分支，无缝进入对应验证阶段。

#### Scenario: needs_verify 状态进入 Phase 1

- **WHEN** `instructions apply --json` 返回 `state: 'needs_verify'`
- **THEN** 模板 SHALL 指示 Agent 进入 Phase 1 验证流程并启动 reviewer subagent
- **AND** SHALL NOT 中断流程或要求用户手动触发 verify

#### Scenario: needs_seal 状态进入 Phase 2/3

- **WHEN** `instructions apply --json` 返回 `state: 'needs_seal'`
- **THEN** 模板 SHALL 指示 Agent 进入 Phase 2/3 流程
- **AND** SHALL NOT 中断流程或要求用户手动触发

#### Scenario: Dashboard 分类标签不声称完成

- **WHEN** Dashboard 展示 task 全部完成的 change
- **THEN** 分类标签 SHALL 显示为 "Tasks Done" 而非 "Completed Changes"

### Requirement: Apply Phase 0 SHALL 由 Master agent 直接执行

`xirang-apply-change` workflow SHALL 要求 Master agent 在 Phase 0 通过严格 TDD 执行 `tasks.md` 中的 pending Checks。Workflow SHALL NOT 生成或读取 `.apply-steps`，也 SHALL NOT 委托 implementer subagent 执行编码。

#### Scenario: Master agent 串行执行任务

- **WHEN** `xirang instructions apply --change "<name>" --json` 返回多个 pending tasks
- **THEN** Apply workflow SHALL 指示 Master agent 串行执行 task
- **AND** Master agent SHALL 完成当前 task 的全部 Checks 后再进入下一 task
- **AND** Master agent SHALL NOT 并行处理多个 tasks

#### Scenario: Master agent 严格 TDD 实现 pending Check

- **WHEN** `xirang instructions apply --change "<name>" --json` 返回待实现工作
- **THEN** Apply workflow SHALL 指示 Master agent 对每个行为或代码 Check 先新增或更新 targeted test
- **AND** Master agent SHALL 在实现前运行声明的 Check 命令并确认预期失败
- **AND** Master agent SHALL 只实现该 Check 所需的最小改动
- **AND** Master agent SHALL 重跑同一命令并确认通过后，才更新 checkbox

#### Scenario: 非运行时文本制品不伪造 RED failure

- **WHEN** pending Check 只修改非运行时文本或非运行时制品
- **THEN** Apply workflow SHALL NOT 要求人为制造失败测试
- **AND** Master agent SHALL 运行声明的验证命令或检查 `Evidence:` / `Expect:`
- **AND** Master agent SHALL 只在最终证据通过后更新 checkbox

#### Scenario: Config、Schema 与模板默认按行为变更处理

- **WHEN** pending Check 修改 config、schema、generated template、workflow template 或 agent instruction template
- **THEN** Apply workflow SHALL 默认将其归类为行为或代码 Check
- **AND** 只有 Check 明确证明编辑内容不存在运行时或生成 surface consumer 时，才 SHALL 允许按非运行时文本处理

#### Scenario: Apply workflow 不生成 apply-steps

- **WHEN** Apply workflow 进入 Phase 0 implementation
- **THEN** SHALL NOT 在 change 目录下创建 `.apply-steps/` 文件
- **AND** 实现计划 SHALL 保留在当前 Master agent context 或 `tasks.md` Required Corrections entries 中

#### Scenario: Apply workflow 不委托 implementer

- **WHEN** pending task 已可实现
- **THEN** Apply workflow SHALL NOT 启动 implementer subagent
- **AND** SHALL NOT 指示任何 subagent 调用 implementer

#### Scenario: Clean-context verify gate 保持不变

- **WHEN** Phase 0 implementation 与 Required Corrections 全部完成
- **THEN** Apply workflow SHALL 在 Phase 1 继续启动 `xirang-reviewer`
- **AND** optimization 启用时 SHALL 在 Phase 2 继续启动 `xirang-optimizer`
- **AND** Master agent SHALL NOT 替代 reviewer 或 optimizer 的判断

#### Scenario: apply workflow 不 dispatch implementer

- **WHEN** Master agent 执行 apply Phase 0
- **THEN** 系统直接实现 pending task
- **AND** 系统 SHALL NOT dispatch coding subagent

#### Scenario: clean-context gate 保持不变

- **WHEN** Phase 0 实现完成
- **THEN** 系统仍 SHALL 使用 reviewer subagent 进行 Phase 1 判断
- **AND** 系统仍 SHALL 使用 optimizer subagent 判断 Phase 2 优化机会

### Requirement: Apply 完成时输出 archive 指引

Apply 阶段在所有 task 完成且 seal 通过后，SHALL 显式输出下一步操作指引，引导用户进入归档。

#### Scenario: seal 通过后输出 call-to-action

- **WHEN** Phase 3 seal 返回 valid
- **THEN** apply SHALL 在汇总输出末尾显式给出 archive-ready call-to-action
- **AND** call-to-action SHALL 引用 archive workflow 的工具适配 invocation
- **AND** SHALL NOT 仅报告 sealed 状态而省略操作指引
- **AND** SHALL NOT 在 workflow 模板 source text 中硬编码特定工具的 archive 调用语法

### Requirement: Apply 完成全部 Tasks 后统一进入 Change 级 Review

`xirang-apply-change` workflow SHALL 将每个 task 作为单一 TDD loop 连续执行；单个 task 完成 SHALL NOT 触发 Phase 1、Phase 2 或 workflow handoff。全部 pending tasks 与 Required Corrections 完成后，SHALL 进入一次 Change-level Phase 1 Review；此后 Review 或 Seal 产生的修正 SHALL 在 recovery 完成后重新接受 Change-level Review。

#### Scenario: 普通 task 完成不切换阶段

- **WHEN** 一个 pending task 的 Checks 全部通过
- **THEN** Apply SHALL 直接继续下一 task
- **AND** SHALL NOT 触发 Phase 1、Phase 2 或 workflow handoff

#### Scenario: 全部完成后统一 Review

- **WHEN** 所有 pending tasks 与 Required Corrections 完成
- **THEN** Apply SHALL 进入一次 Change-level Phase 1 Review

#### Scenario: 修正后重新 Review

- **WHEN** Phase 1 或 Phase 3 失败产生 Required Corrections
- **AND** recovery 完成
- **THEN** 修改后的 Change 状态 SHALL 重新接受 Change-level Review
