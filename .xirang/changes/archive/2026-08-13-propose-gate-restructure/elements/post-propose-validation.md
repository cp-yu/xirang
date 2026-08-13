---
operation: ADDED
entity: element-declaration
identity: post-propose-validation
kind: element
parent: propose-workflow
title: Post-propose Validation
definition: Post-propose Validation 定义 Propose 收尾的一致性验证门禁：先执行计划一致性复核，对照 change-local Contracts、design.md 与 Semantic Delta 检测 tasks.md 的语义矛盾，发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时呈现给用户裁决；随后在最终制品上执行确定性校验作为收尾门禁，对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担，报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。
---

## ADDED Requirements

### Requirement: 计划一致性复核

Post-propose Validation SHALL 在确定性校验前对照 change-local Contracts、design.md 与 Semantic Delta 复核 tasks.md 的计划一致性，检测 task 间声明矛盾以及 task 与 change-local 目标语义的冲突；发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时，一次性呈现全部发现并等待用户裁决。

#### Scenario: 检测到矛盾时自行修正

- **WHEN** 复核发现 task 间声明矛盾或 task 与 change-local 目标语义冲突
- **THEN** SHALL 自行修正制品
- **AND** SHALL 修正后继续复核

#### Scenario: 矛盾反映用户意图不对齐

- **WHEN** 矛盾反映与用户意图或已确认决策不对齐
- **THEN** SHALL 一次性呈现全部发现
- **AND** SHALL 等待用户裁决后再继续

#### Scenario: 复核干净时无声继续

- **WHEN** 复核未发现矛盾
- **THEN** SHALL 无声继续进入确定性校验

#### Scenario: 复核不再由 Apply 承担

- **WHEN** apply workflow 启动实现
- **THEN** apply SHALL NOT 执行计划一致性复核
- **AND** 复核 SHALL 由 Propose 收尾门禁在 Formation 内完成

### Requirement: 收尾确定性校验门禁

Post-propose Validation SHALL 在计划一致性复核与用户裁决后的最终制品上执行确定性校验作为收尾门禁：对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担；报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。

#### Scenario: 报错阻塞 Apply 就绪声明

- **WHEN** 确定性校验返回报错
- **THEN** SHALL 阻塞 Apply 就绪声明
- **AND** SHALL 最多修复一轮并复检一次

#### Scenario: 修复后报错残留

- **WHEN** 修复一轮并复检后仍有报错
- **THEN** SHALL 保持阻塞并报告残留报错

#### Scenario: 仅警告不阻塞

- **WHEN** 确定性校验仅有警告
- **THEN** SHALL 不阻塞 Apply 就绪声明
- **AND** SHALL 在汇总中披露警告
