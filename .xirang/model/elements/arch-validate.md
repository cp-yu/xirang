---
entity: element-declaration
identity: arch-validate
kind: element
parent: deterministic-operations
title: Arch Validate
definition: Arch Validate 定义 `xirang arch validate` 的行为：验证当前 Semantic Model 的四分区记法与语义、支持 `--delta` 选项对 change-local delta 做目标模型校验，且不修改 Formal source。
---

## Specification

### Section: arch validate 命令 SHALL 验证模型记法

`xirang arch validate` SHALL 运行模型的记法解析与语义验证，报告语法与语义错误。

- **验证语法正确的模型**

  - 模型四分区语法正确
  - 运行 `xirang arch validate`
  - 成功且无问题时 SHALL 保持 stdout/stderr 为空，--json 同样适用
  - 退出码 SHALL 为 0

- **验证失败时显示错误**

  - 模型语法错误
  - 运行 `xirang arch validate`
  - SHALL 在 stderr 显示具体错误，--json 时使用结构化 JSON
  - 退出码 SHALL 为非零

### Section: arch validate SHALL 执行语义验证

arch validate SHALL 在记法验证后执行语义检查，包括 containment（恰有一个 parent、无环）、precedes cycle 与 Metamodel 约束。

- **检查 precedes cycle**

  - 模型包含 precedes cycle: A → B → C → A
  - 运行 `xirang arch validate`
  - SHALL 检测到 cycle
  - SHALL 输出错误 "Precedes cycle detected: A → B → C → A"
  - precedes relations MUST 形成 DAG

- **检查 containment cycle**
  - 一个非根 Element 的 parent chain 形成 cycle
  - SHALL 检测到 containment cycle 并输出错误

- **检查非根 Element 恰有一个 parent**
  - 一个非根 Element 没有 parent
  - SHALL 输出 "Element <id> has no parent" 类错误

### Section: arch validate SHALL 支持 --delta 选项

`xirang arch validate --delta <path>` SHALL 解析 change-local Semantic Delta，在 immutable Formal snapshot 上 materialize Target Model，并验证 declared operations 与完整 target integrity。

- **验证合法 delta 文件**
  - change 包含四分区 Semantic Delta
  - 运行 `xirang arch validate --delta <path>`
  - SHALL 验证 operations、identity preconditions、完整 target payloads、containment、Metamodel、relationships 与 strict removals
  - validation 成功时 exit code SHALL 为 0

- **Empty delta 被拒绝**
  - delta 不含任何真实 identity operation
  - SHALL 返回 structured ERROR
  - SHALL 指引在无变化时省略 delta

- **Partial target 失败**
  - MODIFIED element 缺少必填完整 target fields
  - SHALL 返回包含 identity、field 与 source location 的 ERROR

- **Formal snapshot 不被修改**
  - 执行任意 `arch validate --delta`
  - command SHALL NOT 写入 Formal model、Contracts 或 change artifacts

- **Raw extend delta 被拒绝**
  - delta 使用 raw LikeC4 `extend` 作为 reconciliation operation
  - SHALL 返回 unsupported delta syntax ERROR
  - SHALL NOT 将 additive merge 当作 target replacement
