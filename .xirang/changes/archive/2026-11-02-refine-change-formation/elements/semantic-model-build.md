---
entity: element-declaration
identity: semantic-model-build
kind: element
parent: realization-process
title: Semantic Model Build
definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
---

## MODIFIED Sections

### Section: 复用确认记录形成 Candidate

Semantic Model Build SHALL 使用统一中间设计记录格式及共享写作、确认权和覆盖规则，实例与 Change 记录隔离。用户确认即授权记录，只报告局部变更；记录容纳当前设计及显式决策状态，不将旧格式或 pending 当作确认。

存在记录时重载、调和冲突，仅将已采纳且适用的规范内容编写为 Candidate；拆出条件、数值、例外、时序与原样正反例的原子细节，给出 Candidate 中的位置与摘录，经 xirang record coverage --candidate 记录。影响目标的 pending 问题先解决，不适用项说明理由；excluded 与 informative 保留必要依据，不强造义务。结构部分与 Candidate 逐字段比对。用户例子写为具体验收内容，不能泛化。

无记录时 build.md 的授权范围须声明用户豁免或本次无 normative 内容，未声明阻塞 promotion readiness，不创建空记录。沿用 Candidate review、digest、promotion 与 history，不增加 Design Summary 门禁；覆盖及结构门禁通过后才允许来源交接。
