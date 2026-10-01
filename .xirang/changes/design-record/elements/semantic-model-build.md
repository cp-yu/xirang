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

Semantic Model Build SHALL 使用统一 Design Record 随用户确认记录已确认设计：用户的设计确认即授权记录，写入后只报告变更，实例与 Change 形成记录隔离，并遵循相同的条目写入标准与结构部分。存在记录时 SHALL 重载、调和冲突，按 Design Record 的写作规则编写 Candidate，并对记录每条 normative 条目按原子细节执行覆盖检查：每个细节给出其在 Candidate 中的位置（Declaration、Section、Acceptance Case、Relationship、Metamodel 或 Authored View），结果经 `xirang record coverage --candidate` 记录；任一条目缺结果或细节无位置 SHALL 阻塞 source handoff。用户确认的例子写成验收内容，条件、数值、例外、时序进入适当 Contract 而不泛化；记录结构部分由 CLI 与 Candidate 逐字段比对；说明材料进入构建依据或 provenance。无记录时 SHALL 要求授权范围在 `build.md` 上携带记录决策——用户明确授予的豁免或本次无 normative 内容的声明——未声明即阻塞 promotion readiness；SHALL NOT 自行建立空记录。本流程 SHALL 保持 Candidate review / digest / promotion，不增加 Design Summary 门禁。

- **记录驱动完整 Candidate**

  - 存在记录且其 normative 条目的每个原子细节都在 Candidate 中有位置
  - 按记录形成完整 Candidate
  - 覆盖结果经 CLI 记录，结构部分与 Candidate 逐字段一致

- **无记录但已声明决策**

  - 授权范围在 `build.md` 上声明豁免或本次无 normative 内容
  - 沿用既有 Build 门禁继续，不建立空记录
  - promotion readiness 以该声明为前提

- **无记录且未声明决策**

  - 授权范围既无记录也未在 `build.md` 上声明记录决策
  - 阻塞 promotion readiness 并向用户请求该决策
  - 不将未声明当作默认覆盖

- **规范细节遗漏阻止确认**

  - 记录某条目中用户确认的例子未落入任何 Candidate 目标
  - CLI 拒绝记录覆盖结果并阻塞 source handoff

### Section: 交接记录后确认精确 Candidate

Build SHALL 在覆盖结果经 CLI 记录有效、结构比对一致与适用校验通过后经 `xirang record consume --candidate` 向 active Candidate 交接精确记录来源，再验证带来源的最终 Candidate 并执行既有独立审查与用户 digest 确认。源或目标变化使受影响覆盖与确认失效。豁免或无记录时 SHALL 跳过 consumption 并在 promotion readiness 前核对已声明的记录决策，SHALL NOT 跳过确定性校验或独立语义审查本身。来源快照与覆盖结果 SHALL 进入 history 而不进入正式模型。

- **确认最终带来源版本**

  - 覆盖复核与校验通过且来源可消费
  - 交接精确来源，验证带来源的最终 Candidate 并以其 digest 完成确认

- **来源交接失败**

  - `xirang record consume` 返回失败
  - 保留来源与既有目标，阻塞 promotion readiness

- **豁免时跳过消费但不跳过校验**

  - 来源已声明豁免或无记录
  - 跳过 consumption 并在 promotion readiness 前核对 `build.md` 上的记录决策
  - 确定性校验与独立语义审查仍照常执行
