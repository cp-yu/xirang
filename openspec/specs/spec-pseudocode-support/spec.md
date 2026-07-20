# spec-pseudocode-support Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: Specs SHALL 支持伪代码表达调用序列

Specs 中 SHALL 允许使用伪代码块表达调用序列和算法流程。

#### Scenario: 使用伪代码表达调用链

- **GIVEN** spec 描述 apply workflow 执行流程
- **WHEN** 编写 scenario
- **THEN** SHALL 允许包含伪代码块：
  ```markdown
  #### Scenario: 完整执行流程

  **调用序列**（伪代码）：
  ```pseudocode
  apply.task_executor.execute() {
    tasks = cli.instructions.get_tasks()
    for task in tasks {
      execute(task)
    }
  }
  ```
  ```
- **AND** 伪代码块 SHALL 标注语言为 `pseudocode`

### Requirement: 伪代码 SHALL 引用 LikeC4 element IDs

伪代码中的标识符 SHALL 使用 LikeC4 element IDs 格式。

#### Scenario: 引用 capability elements

- **GIVEN** LikeC4 模型包含 `apply.task_executor` 和 `verify.reviewer`
- **WHEN** 在伪代码中引用
- **THEN** SHALL 使用格式：`domain_name.capability_name`
- **AND** 示例：`apply.task_executor.execute()`、`verify.reviewer.review()`

#### Scenario: 引用关系语义

- **GIVEN** LikeC4 包含 `task_executor -[precedes]-> reviewer`
- **WHEN** 伪代码表达时序
- **THEN** SHALL 在注释中引用：`// task_executor precedes reviewer`

### Requirement: Specs SHALL 支持混合表达（WHEN/THEN + 伪代码）

一个 scenario SHALL 允许同时使用 WHEN/THEN 和伪代码。

#### Scenario: 混合使用

- **WHEN** 编写复杂 scenario
- **THEN** SHALL 允许结构：
  ```markdown
  #### Scenario: 任务执行流程

  **行为描述**：
  - **WHEN** apply 启动
  - **THEN** SHALL 串行执行所有 tasks

  **调用序列**（伪代码）：
  ```pseudocode
  for each task in pending_tasks {
    execute(task)
  }
  ```
  ```

### Requirement: 伪代码验证 SHALL 为可选

OpenSpec 验证 MUST NOT 强制验证伪代码语法。

#### Scenario: 伪代码语法自由

- **GIVEN** spec 包含伪代码块
- **WHEN** 运行 `openspec validate`
- **THEN** MUST NOT 解析或验证伪代码语法
- **AND** 伪代码仅作为人类和 Agent 可读文档
