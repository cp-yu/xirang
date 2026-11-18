---
entity: element-declaration
identity: post-propose-validation
kind: element
parent: propose-workflow
title: Post-propose Validation
definition: Post-propose Validation 定义 Propose 收尾的一致性验证门禁：先执行计划一致性复核，对照 change-local Contracts、design.md 与 Semantic Delta 检测 tasks.md 的语义矛盾，发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时呈现给用户裁决；随后在最终制品上执行确定性校验作为收尾门禁，对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担，报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。
---

## MODIFIED Sections

### Section: 收尾确定性校验门禁

Post-propose Validation SHALL 在计划一致性复核与用户裁决后的最终制品上执行确定性校验作为收尾门禁：对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担；报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。格式修复 SHALL 仅重述已有承诺，不得为了满足校验器而新增限制或行为；修复后 SHALL 重新核对受影响的语义结论。

- **报错阻塞 Apply 就绪声明**

  - 确定性校验返回报错
  - SHALL 阻塞 Apply 就绪声明
  - SHALL 最多修复一轮并复检一次

- **修复后报错残留**

  - 修复一轮并复检后仍有报错
  - SHALL 保持阻塞并报告残留报错

- **仅警告不阻塞**

  - 确定性校验仅有警告且语义就绪已满足
  - 警告本身 SHALL 不阻塞 Apply 就绪声明
  - SHALL 在汇总中披露警告

Propose 的工作流提示 SHALL 只引导只读预览，不调用归档或写入正式模型。
