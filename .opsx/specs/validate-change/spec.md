---
element: project.root/domain.validation/cap.validation.semantic-contract
---

# validate-change Specification

## Purpose
Define the reviewed Semantic Contract Validation contract for validate change SHALL 支持 architecture-delta.c4.
## Requirements
### Requirement: validate change SHALL 支持 architecture-delta.c4

Change validation SHALL 从一个 immutable Formal snapshot 联合解析 change-local Specs 与可选 `architecture-delta.c4`，materialize 完整 Target Semantic Model，执行 integrity validation，并派生 concise effective-change preview。

#### Scenario: Graph no-op 不要求 delta 文件
- **GIVEN** change 只有 contract operations
- **WHEN** 运行 `opsx validate --change <name>`
- **THEN** SHALL 接受缺失 `architecture-delta.c4`
- **AND** preview SHALL 显示 Architecture 无 semantic changes

#### Scenario: 验证 delta dialect
- **WHEN** change 包含 `architecture-delta.c4`
- **THEN** SHALL 使用 OPSX Architecture delta parser 验证 identity-level operations
- **AND** MUST NOT 将文件直接复制为 additive formal LikeC4 module

#### Scenario: 联合 Target Semantic Model
- **WHEN** graph operation 新增 element 且 change-local Spec 绑定该 element
- **THEN** validation SHALL 在同一 target 中解析 element 与 binding
- **AND** SHALL 联合验证 Metamodel、containment、relationships 与 contracts

#### Scenario: Validation 保持只读
- **WHEN** change validation 成功或失败
- **THEN** SHALL NOT 修改 Formal source、change-local Specs、Architecture delta 或 `effective-change.md`

#### Scenario: Partial diagnostics
- **WHEN** Specs 或 Architecture 一侧失败而另一侧可计算
- **THEN** validation SHALL 保留可计算侧的 concise preview
- **AND** overall result SHALL 为 invalid

