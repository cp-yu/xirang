---
entity: element-declaration
identity: agent-prompt-guidance
kind: element
parent: references-home
title: 质量协作指导
definition: 质量协作指导是 Apply、Quality 与 Archive 共用的工作协议表达。它独立承载基于证据的角色委派、Review/Opt/Seal 交付、诊断消费及 Git 恢复指引，使主 Agent 和内部角色按各自职责协作；角色完整定义由内部 Agent 制品承担，CLI 记录格式由确定性操作约束。
---

## Specification

### Section: 共享 quality gate 指引片段

质量协作指导 SHALL 以 Review、可选 Opt、Opt 处置和 Seal 表达完整质量流程，并从统一协议源交付 opinion schema、委派与持久化边界。流程表 SHALL 表达：先取得通过的 full-change Review；主 Agent 决定是否 Opt；执行时交付 opinion，未执行时记录理由；Seal 绑定 commit 并声明可运行及适用测试预期。

Reviewer、Optimizer 的完整角色定义和判断标准由其内部 Agent 制品承载。Apply/Archive 指导 SHALL 明确委派 clean-context 对应角色，传入所需模型、Change、commit、委托范围和证据，等待完整结果；主 Agent 不通过读取或内联角色制品替代独立委派。工具专属 API 语法由工具适配承担。

指引 SHALL 区分 full-change、incremental、supplemental Review，并使示例与实际 schema 一致。意见与 commit 由 CLI 关联，代码恢复由 Git 承载，Archive 的 Quality 门禁确认 Seal commit 对象存在。

- 进入 Review：委派 Reviewer，等待意见后再作汇总，不把主 Agent 判断写成 Reviewer PASS。
- 用户不执行 Opt：记录明确处置，仍满足基线 Review、适用验证和 Seal 要求。
- Opt 交付存在未解决问题：交由主 Agent 判断修正或恢复，不推断已经完成。

### Section: Archive 模板未收口恢复路径

Archive SHALL 对缺失或不可解析的 Seal commit 提供具体诊断，并指引主 Agent 返回 Apply 补齐 Quality 意见/Seal。Opt 的进度与代码恢复从 Git 判断；Archive 不将中断推断为已完成 opinion 或明确 skip。Semantic Delta、Sync、validation 和 task gate 独立处理。

### Section: Quality 模板 CLI 错误恢复指南

提示词 SHALL 根据 CLI code 与诊断修正输入或补齐真实 Review/Opt opinion 与 Seal commit，不伪造意见或删除历史。Reviewer 从实际 checkout 的 HEAD 确定审查 commit；CLI 写入时 commit identity 无效不得猜测另一提交替代已评估状态，应交回重新委派。v3 `.quality.json` 与更旧质量格式不迁移或重写，文件原样保留并明确报不支持；Seal commit 存在不表示当前 HEAD/工作区与之相同。

### Section: 提供可选失败诊断 reference

系统 SHALL 提供共享的优化失败诊断 reference，供主 Agent 与 Opt 依据 Git history 和实际证据定位问题。局部原因明确时可修正或撤销并验证；合并问题无法定位时可拆分或采用更合适方法；恢复不可靠时停止并交回主 Agent。Reference 不要求 Quality checkpoint、整批 reset/clean 或持久化方向队列，并经显式生成清单管理。
