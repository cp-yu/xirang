---
entity: element-declaration
identity: change-sync
kind: element
parent: change-closure
title: Change Sync
definition: Change Sync 定义将 Change 的四分区 Semantic Delta 同步到正式 Semantic Model 的行为：从 immutable Formal snapshot 物化完整 Target Semantic Model、联合验证、原子写入与回滚、幂等判定、evidence fingerprint 增量刷新，以及 `xirang sync` 命令面的选择与门禁行为。
---

## ADDED Requirements

### Requirement: 保持 Target 单元完整

Sync SHALL 按 entity type 与 identity 将 Target Semantic Model 的每个单元路由到各自的存储单元；同一 identity 并存于不同实体类型时，其单元 SHALL 完整物化，MUST NOT 丢失、被覆盖或被删除。

#### Scenario: 跨类型同名 Element 与 Element Kind 保真同步

- **GIVEN** Formal Semantic Model 同时包含同名 element 与 element-kind
- **WHEN** 对任意 change 执行 sync
- **THEN** 两个单元的存储文件 SHALL 均按各自目标内容存在
- **AND** sync MUST NOT 删除仍存在于 Target Semantic Model 的实体单元

#### Scenario: 跨类型同名 Element 与 Authored View 保真同步

- **GIVEN** Formal Semantic Model 同时包含同名 element 与 authored view
- **WHEN** 对任意 change 执行 sync
- **THEN** element 单元与 view 单元 SHALL 均按各自目标内容存在

### Requirement: 拒绝目标路径冲突

当 Target Semantic Model 的两个单元映射到同一存储路径时，sync SHALL 在写入前显式失败并报告冲突路径与两个单元；Formal Semantic Model MUST NOT 被修改。

#### Scenario: 既有单元占用另一单元的目标路径

- **GIVEN** 一个既有单元存放在另一新增单元的目标路径（如 element-kind `x` 位于 `elements/x.md` 而新增 element `x`）
- **WHEN** sync 准备 Target 单元树
- **THEN** SHALL 报告冲突路径与两个单元并以非零退出失败
- **AND** Formal Semantic Model SHALL 保持不变
