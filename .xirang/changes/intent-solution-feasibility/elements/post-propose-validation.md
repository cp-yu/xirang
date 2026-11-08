---
entity: element-declaration
identity: post-propose-validation
kind: element
parent: propose-workflow
title: "Post-propose Validation"
definition: "Post-propose Validation 定义 Propose 收尾的一致性验证门禁：先执行计划一致性复核，对照 change-local Contracts、design.md 与 Semantic Delta 检测 tasks.md 的语义矛盾，发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时呈现给用户裁决；随后在最终制品上执行确定性校验作为收尾门禁，对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担，报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。"
---

## MODIFIED Sections

### Section: 完整机制自查

Propose SHALL 用适用的边界或竞争事件序列检验机制、不变量、时序及验收结果，具体推演初始状态、事件顺序与预期结果，并检查实现方案能否落实这些结果；只列出场景名称不构成机制检查。发现问题时 SHALL 区分表达或推导错误与缺失决策。前者依据已确认设计修正，后者先向用户询问；结构合法与引用有效不能证明机制正确。

SHALL 检查支持实施方案达成验收结果的证据及关键假设。用户确认不自动成为可行性证据；方案失败本身不证明意图理解错误或目标不可实现。先定位事实判断、方案或意图理解中的问题，不能因自身方案失败就要求用户重述已清楚的意图。

- **已采纳路线遇到反证**：来源已确认路线，但项目证据否定关键假设时，指出实际问题并按缺口处理规则修订或返回 Explore，不据确认宣称可行。
- **推演中的方案失败**：先复核方案及假设；只有证据暴露意图歧义或约束冲突时才请求对应裁决，不能把一个方案不成立等同目标不可能实现。
