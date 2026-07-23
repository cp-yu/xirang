---
element: cap.apply.change-workflow
---

# apply-change-workflow Specification

## Purpose
定义 `opsx-apply-change` 如何处理工作流状态，并由 Master agent 串行完成 Phase 0 后进入 clean-context 验证阶段。

## Requirements
### Requirement: Apply 模板 SHALL 处理中间验证状态

`opsx-apply-change` 技能模板 SHALL 对 `needs_verify` 和 `needs_seal` 状态提供正确分支，无缝进入对应验证阶段。

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

`opsx-apply-change` workflow SHALL 要求 Master agent 在 Phase 0 通过严格 TDD 执行 `tasks.md` 中的 pending Checks。Workflow SHALL NOT 生成或读取 `.apply-steps`，也 SHALL NOT 委托 `opsx-implementer` 执行编码。

#### Scenario: Master agent 串行执行任务

- **WHEN** `opsx instructions apply --change "<name>" --json` 返回多个 pending tasks
- **THEN** Apply workflow SHALL 指示 Master agent 串行执行 task
- **AND** Master agent SHALL 完成当前 task 的全部 Checks 后再进入下一 task
- **AND** Master agent SHALL NOT 并行处理多个 tasks

#### Scenario: Master agent 严格 TDD 实现 pending Check

- **WHEN** `opsx instructions apply --change "<name>" --json` 返回待实现工作
- **THEN** Apply workflow SHALL 指示 Master agent 读取 `tasks.md`、change-local specs、design、相关项目文件与测试
- **AND** 对每个行为或代码 Check，Master agent SHALL 先新增或更新 targeted test
- **AND** Master agent SHALL 在实现前运行声明的 Check 命令或等价 targeted command，并确认预期失败
- **AND** Master agent SHALL 只实现该 Check 所需的最小改动
- **AND** Master agent SHALL 重跑同一命令或等价命令并确认通过后，才更新 task 或 remediation checkbox

#### Scenario: 非运行时文本制品不伪造 RED failure

- **WHEN** pending Check 只修改非运行时文本或非运行时制品
- **THEN** Apply workflow SHALL NOT 要求人为制造失败测试
- **AND** Master agent SHALL 运行声明的验证命令或检查 `Evidence:` / `Expect:`
- **AND** Master agent SHALL 只在最终证据通过后更新 task 或 remediation checkbox

#### Scenario: Config、Schema 与模板默认按行为变更处理

- **WHEN** pending Check 修改 config、schema、generated template、workflow template 或 agent instruction template
- **THEN** Apply workflow SHALL 默认将其归类为行为或代码 Check
- **AND** 只有 Check 明确证明编辑内容不存在运行时或生成 surface consumer 时，才 SHALL 允许按非运行时文本处理

#### Scenario: Apply workflow 不生成 apply-steps

- **WHEN** Apply workflow 进入 Phase 0 implementation
- **THEN** SHALL NOT 在 `.opsx/changes/<change-name>/.apply-steps/` 下创建文件
- **AND** SHALL NOT 使用 `.apply-steps` 作为恢复或委托输入
- **AND** 实现计划 SHALL 保留在当前 Master agent context 或 `tasks.md` remediation entries 中

#### Scenario: Apply workflow 不委托 implementer

- **WHEN** pending task 已可实现
- **THEN** Apply workflow SHALL NOT 启动 implementer subagent
- **AND** SHALL NOT 指示任何 subagent 调用 `opsx-implementer`
- **AND** SHALL NOT 为编码执行请求低价 model

#### Scenario: Clean-context verify gate 保持不变

- **WHEN** Phase 0 implementation 与 remediation 全部完成
- **THEN** Apply workflow SHALL 在 Phase 1 继续启动 `opsx-reviewer`
- **AND** optimization 启用时 SHALL 在 Phase 2 继续启动 `opsx-optimizer`
- **AND** Master agent SHALL NOT 替代 reviewer 或 optimizer 的判断
