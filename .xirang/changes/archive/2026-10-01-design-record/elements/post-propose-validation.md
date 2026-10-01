---
entity: element-declaration
identity: post-propose-validation
kind: element
parent: propose-workflow
title: Post-propose Validation
definition: Post-propose Validation 定义 Propose 收尾的一致性验证门禁：先执行计划一致性复核，对照 change-local Contracts、design.md 与 Semantic Delta 检测 tasks.md 的语义矛盾，发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时呈现给用户裁决；随后在最终制品上执行确定性校验作为收尾门禁，对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担，报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。
---

## MODIFIED Sections

### Section: 计划一致性复核

Post-propose Validation SHALL 在确定性校验前将 change-local Contracts、design.md、Semantic Delta 与 tasks.md 联合对照 Explore 及 Propose 内的用户确认，检查计划与目标的一致性；不得仅以制品相互一致代替来源忠实性。已确认来源能确定修正方式时 SHALL 自行修正；需要改变已确认承诺、扩大范围或裁决重大业务及架构权衡时 SHALL 呈现全部发现，一次请求一个决策并等待确认。既定范围与方案内合理推导的细节及配套保证 MAY 在完成时披露，无需逐项确认。新确认的行为及推导补充的可观察保证 SHALL 贯穿相关 Delta 与 Plan，不得只藏在 design 或 tasks 中。 复核 SHALL 同时检查可用当前确认记录到目标语义、需实施的目标语义到 tasks 实现安排与 Checks 两段覆盖；第一段按原子细节（条件、数值、例子、反例、时序、例外）逐项给出位置，并经 `xirang record coverage` 记录，任一细节无位置即阻塞完成；引用存在只是结构合法，不是行为覆盖证明。共同遗漏的已确认细节同样阻塞完成；缺失行为先补 Contract，再调整 Plan，未决意图交给用户。

- **检测到矛盾时自行修正**

  - 复核发现 task 间声明矛盾或 task 与 change-local 目标语义冲突
  - 已确认来源能确定修正方式时 SHALL 自行修正制品，否则先询问用户
  - SHALL 修正后继续复核

- **矛盾反映用户意图不对齐**

  - 矛盾反映与用户意图或已确认决策不对齐
  - SHALL 一次性呈现全部发现
  - SHALL 等待用户裁决后再继续

- **复核干净时无声继续**

  - 复核未发现矛盾
  - SHALL 无声继续进入确定性校验

- **复核不再由 Apply 承担**

  - apply workflow 启动实现
  - apply SHALL NOT 执行计划一致性复核
  - 复核 SHALL 由 Propose 收尾门禁在 Formation 内完成

- **有效引用不代表实际覆盖**

  - Check 引用了存在的 Section 与 Acceptance Case，但命令或证据不能验证其行为
  - 修正实现安排或验证方式后重新复核，不用引用校验通过替代语义覆盖。

- **目标到任务存在遗漏**

  - 目标 Contract 已表达条件分支，但任务与检查没有安排实现或验证
  - 补足相应行为闭环与检查，不在任务内另造规范语义。
