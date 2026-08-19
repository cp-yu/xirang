---
entity: element-declaration
identity: apply-workflow
operation: MODIFIED
kind: element
parent: apply
title: Apply Workflow
definition: Apply Workflow 定义 `xirang-apply-change` 如何处理工作流状态，并由 Master agent 串行完成 Phase 0 后进入 clean-context 验证阶段；它处理 `needs_verify` 与 `needs_seal` 状态分支，并要求 Master agent 直接执行实现而不委托 implementer。
---

## MODIFIED Requirements

### Requirement: Apply Phase 0 SHALL 由 Master agent 直接执行

`xirang-apply-change` workflow SHALL 要求 Master agent 在 Phase 0 通过严格 TDD 执行 `tasks.md` 中的 pending Checks。对行为或代码 Check，Master SHALL 先检查已有测试并决定 modify、add 或 delete，再进入 RED → 最小实现 → GREEN；RED 必须来自目标行为缺失。Workflow SHALL NOT 生成或读取 `.apply-steps`，也 SHALL NOT 委托 implementer subagent 执行编码。

#### Scenario: Master agent 串行执行任务

- **WHEN** `xirang instructions apply --change "<name>" --json` 返回多个 pending tasks
- **THEN** Apply workflow SHALL 指示 Master agent 串行执行 task
- **AND** Master agent SHALL 完成当前 task 的全部 Checks 后再进入下一 task
- **AND** Master agent SHALL NOT 并行处理多个 task

#### Scenario: Master agent 严格 TDD 实现 pending Check

- **WHEN** `xirang instructions apply --change "<name>" --json` 返回待实现工作
- **THEN** Apply workflow SHALL 指示 Master agent 对每个行为或代码 Check 先检查已有测试，再修改、新增或删除 targeted test
- **AND** Master agent SHALL 在实现前运行声明的 Check 命令并确认因目标行为缺失而失败
- **AND** Master agent SHALL 做最小实现后再次运行同一 Check 确认通过
- **AND** Master agent SHALL NOT 用语法错误、错误路径或损坏 fixture 制造 RED

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
- **AND** Master agent SHALL NOT 替代 reviewer 或 optimizer 的判定

#### Scenario: apply workflow 不 dispatch implementer

- **WHEN** Master agent 执行 apply Phase 0
- **THEN** 系统直接实现 pending task
- **AND** 系统 SHALL NOT dispatch coding subagent

#### Scenario: clean-context gate 保持不变

- **WHEN** Phase 0 实现完成
- **THEN** 系统仍 SHALL 使用 reviewer subagent 进行 Phase 1 判断
- **AND** 系统仍 SHALL 使用 optimizer subagent 判断 Phase 2 优化机会
