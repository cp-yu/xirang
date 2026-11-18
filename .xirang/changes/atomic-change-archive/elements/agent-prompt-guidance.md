---
entity: element-declaration
identity: agent-prompt-guidance
kind: element
parent: references-home
title: 质量协作指导
definition: 质量协作指导是 Apply、Quality 与 Archive 共用的工作协议表达。它独立承载基于证据的角色委派、Review/Opt/Seal 交付、诊断消费及 Git 恢复指引，使主 Agent 和内部角色按各自职责协作；角色完整定义由内部 Agent 制品承担，CLI 记录格式由确定性操作约束。
---

## MODIFIED Sections

### Section: 共享 quality gate 指引片段

质量协作指导 SHALL 从统一协议源交付 Review、Opt 与 Seal 的 schema、委派及持久化边界。通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

Reviewer、Optimizer 的完整角色与判断标准由内部 Agent 制品承担。Apply 进行质量委派时 SHALL 委派独立角色、提供真实依据并等待完整结果，不以内联或主 Agent 自评代替独立委派。工具 API 语法由适配承担；示例与实际 schema 一致。

- 用户不执行 Opt：如实记录未运行理由，仍满足基线、适用后续 Review、验证与 Seal 门禁；默认流程不得以实现者自评省略独立发现。
- 交付仍有未解决问题：协调者处理修正或恢复，不推断已完成。
- 默认交付的 Archive 只确认有效 Quality 记录中 Seal commit 对象存在；其他归档门禁独立。明确 quick 时不伪造证据，放弃时不进入此质量流程。

### Section: Archive 模板未收口恢复路径

普通归档缺少 Seal 或其 commit 不可解析时，Archive SHALL 给出具体诊断并指引主 Agent 返回 Apply，不能代做质量审查或推断中断的 Opt 已完成。显式 quick 或放弃不以缺少 Seal 阻塞，结果不得声称 Quality 通过。
