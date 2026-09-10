---
entity: element-declaration
identity: task-decomposition
kind: element
parent: apply
title: Task Decomposition
definition: Task Decomposition 定义 Apply Phase 0 如何依据 `tasks.md` 中已形成的 task-level TDD 闭环执行实现工作、收集证据、更新进度并处理失败恢复。它不定义执行主体、任务调度方式或具体实现方法。
---

## Requirements

### Requirement: Apply Phase 0 SHALL 依据 task-level TDD 处理 pending task

Apply Phase 0 SHALL 读取 `tasks.md` 中的 pending task，并按每个 task 的独立 TDD 闭环执行 Check、收集证据和更新任务进度。对于 Specs 未覆盖的实现细节，Apply SHALL 依据 Semantic Model、Change Plan、项目约束和当前 implementation evidence 作出与目标语义一致的实现判断，且 SHALL NOT 以额外的编排规则替代 Change Contract。

#### Scenario: Apply 处理独立 task-level TDD loop

- **WHEN** `tasks.md` 包含 pending task
- **THEN** Apply SHALL 按该 task 的 Goal、Files、Requirements 和 Checks 组织一个可独立验证的 TDD loop
- **AND** SHALL 在证据通过后更新对应 Check

#### Scenario: 实现纪律保持为中性指导

- **WHEN** apply skill 被加载
- **THEN** skill SHALL 以 `Implementation Discipline` 节提供适用于当前 Change 的执行指导
- **AND** 该指导 SHALL 使用中性术语，不把某一执行主体、调度方式或临时材料声明为规范要求

#### Scenario: 非隔离流程步骤指向 reference

- **WHEN** Apply 执行到 Preparation、Review、Optimization 或 seal 步骤
- **THEN** Apply SHALL 读取对应的 `.xirang/references/xirang-apply-step-<N>-<name>.md`
- **AND** skill body 中该步骤 SHALL 只提供一行描述和文件路径

#### Scenario: 隔离方法只读取一个 reference

- **WHEN** Preparation 已选择 branch、worktree 或 current-branch 方法
- **THEN** Apply SHALL 只读取所选方法的 Step 2 reference
- **AND** MUST NOT 读取另外两个互斥方法 reference

### Requirement: Checks 是任务进度源

系统 SHALL 使用 `tasks.md` 的 Checks 和 Required Corrections 记录 Apply Phase 0 的进度与恢复工作。

#### Scenario: 完成 Check 后勾选

- **WHEN** Check 的 red/green TDD 证据通过，或非运行时文本制品 Check 的最终证据通过
- **THEN** 系统在 `tasks.md` 中勾选对应 Check
- **AND** 系统 SHALL NOT 在缺少完成证据时勾选

#### Scenario: Required Corrections 优先

- **WHEN** `tasks.md` 包含未完成的 `## Required Corrections` 项
- **THEN** 系统优先处理相关 `[code_fix]` 或 `[artifact_fix]`
- **AND** 系统在证据通过后勾选已解决项

#### Scenario: 跨平台命令兼容

- **WHEN** 系统执行或生成涉及路径的命令
- **THEN** 路径 SHALL 使用 Node.js path 模块处理
- **AND** 系统 SHALL NOT 硬编码平台特定路径分隔符

### Requirement: 任务执行失败处理

系统 SHALL 在 task 执行遇到非预期失败时先诊断再修复，每次修复只改变一个变量，并在同一 task 累计 3 次修复仍未解决时停止并呈现证据。连续 2 次相同 normalized error signature SHALL 保持快速 pause。补充上下文时，Apply SHALL 使用 change artifacts、formal Contracts、Semantic Model navigation 与当前 code evidence；MUST NOT 读取或要求 code-map，也 MUST NOT 使用已移除的 query navigation options。

#### Scenario: 任务需求不明确

- **WHEN** Apply 发现 Goal 或 Requirements 过于模糊
- **THEN** SHALL 使用 proposal、design、delta Contracts、tasks、formal Contracts 与相关项目文件补足上下文
- **AND** SHALL 对已知 Element identities 使用 `xirang arch impact <element-id> --depth 1 --json` 获取 directed Relationships 与 refinement context
- **AND** SHALL 对需要完整语义的 identities 使用 batch `xirang arch query <identities...> --contract --json`
- **AND** SHALL NOT 仅因首次发现模糊点就询问用户

#### Scenario: 项目上下文不足

- **WHEN** Apply 无法找到相关现有代码或模式
- **THEN** SHALL 使用语义边界定位 Element，并使用 CodeGraph 或 `rg`/`read` 获取当前 implementation evidence
- **AND** MUST NOT 从模型读取 code paths 或 code-map
- **AND** SHALL 将缺失上下文转化为当前 task 的可验证探索或检查步骤

#### Scenario: 同一错误重复失败快速暂停

- **WHEN** 同一 task 的同一 normalized error signature 连续失败 2 次
- **THEN** 系统 SHALL pause
- **AND** pause 输出 SHALL 包含 task、check、command、failure kind、error summary 与已尝试修正事项

#### Scenario: 累计修复次数达到上限

- **WHEN** 同一 task 累计 3 次修复仍未解决
- **THEN** 系统 SHALL 停止修复并呈现已尝试路径、根因判断与怀疑方向
- **AND** SHALL 等待用户指导
