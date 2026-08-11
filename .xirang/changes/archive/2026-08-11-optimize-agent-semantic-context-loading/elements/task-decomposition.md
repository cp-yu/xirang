---
entity: element-declaration
identity: task-decomposition
kind: element
parent: apply
title: Task Decomposition
definition: Task Decomposition 定义 Apply Phase 0 如何把 `tasks.md` 中的粗粒度任务转化为当前 Master agent 直接执行的实现工作：严格 TDD、证据收集、任务勾选、诊断优先的失败处理与累计修复上限。
---

## MODIFIED Requirements

### Requirement: 任务执行失败处理

系统 SHALL 在 task 执行遇到非预期失败时先诊断再修复，每次修复只改变一个变量，并在同一 task 累计 3 次修复仍未解决时停止并呈现证据。连续 2 次相同 normalized error signature SHALL 保持快速 pause。补充上下文时，Agent SHALL 使用 change artifacts、formal Contracts、Semantic Model navigation 与当前 code evidence；MUST NOT 读取或要求 code-map，也 MUST NOT 使用已移除的 query navigation options。

#### Scenario: 任务需求不明确

- **WHEN** Master agent 发现 Goal 或 Requirements 过于模糊
- **THEN** SHALL 使用 proposal、design、delta Contracts、tasks、formal Contracts 与相关项目文件补足上下文
- **AND** SHALL 对已知 Element identities 使用 `xirang arch impact <element-id> --depth 1 --json` 获取 directed Relationships 与 refinement context
- **AND** SHALL 对需要完整语义的 identities 使用 batch `xirang arch query <identities...> --contract --json`
- **AND** SHALL NOT 仅因首次发现模糊点就询问用户

#### Scenario: 项目上下文不足

- **WHEN** Master agent 无法找到相关现有代码或模式
- **THEN** SHALL 使用语义边界定位 Element，并使用 CodeGraph 或 `rg`/`read` 获取当前 implementation evidence
- **AND** MUST NOT 从模型读取 code paths 或 code-map
- **AND** SHALL 将缺失上下文转化为当前 task 的可验证探索或检查步骤

#### Scenario: 任务过于复杂

- **WHEN** Master agent 判断 task 过大
- **THEN** SHALL 在当前 task 内按最小可验证批次执行
- **AND** SHALL NOT 因可拆分而创建新的中间 artifacts

#### Scenario: 同一错误重复失败快速暂停

- **WHEN** 同一 task 的同一 normalized error signature 连续失败 2 次
- **THEN** 系统 SHALL pause
- **AND** pause 输出 SHALL 包含 task、check、command、failure kind、error summary 与已尝试修正事项

#### Scenario: 累计修复次数达到上限

- **WHEN** 同一 task 累计 3 次修复仍未解决
- **THEN** 系统 SHALL 停止修复并呈现已尝试路径、根因判断与怀疑方向
- **AND** SHALL 等待用户指导
