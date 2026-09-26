---
entity: "element-declaration"
identity: "semantic-model-build"
kind: "element"
parent: "realization-process"
title: "Semantic Model Build"
definition: "Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 复用确认记录形成 Candidate

Semantic Model Build SHALL 使用统一 Definition Framing 持续澄清与保存已确认设计，每次保存单独授权，实例与 Change 形成记录隔离，并按设计段落聚合持久化确认。存在记录时 SHALL 重载、调和冲突并对记录的规范性条目逐条核对到 Candidate 的落位，将每条标记为已落位于 Declaration、Contract、Relationship、Metamodel 或 Authored View 目标，或报告为未覆盖并说明理由；未标记的条目 SHALL 计为未覆盖并阻塞 source handoff。条件、数值、例外、时序必须进入适当 Contract；说明材料进入构建依据或 provenance。无记录时 SHALL 要求授权范围在 `build.md` 上携带记录决策——用户明确授予的豁免或本次无 normative 内容的声明——未声明即阻塞 promotion readiness；SHALL NOT 自行建立空记录。本流程 SHALL 保持 Candidate review / digest / promotion，不增加 Design Summary 门禁。

#### Scenario: 记录驱动完整 Candidate

- **WHEN** 存在记录且其规范性条目已逐条落位到 Candidate
- **THEN** 按记录形成完整 Candidate
- **AND** 说明每条落位结果与已核对条目数

#### Scenario: 无记录但已声明决策

- **WHEN** 授权范围在 `build.md` 上声明豁免或本次无 normative 内容
- **THEN** 沿用既有 Build 门禁继续，不建立空记录
- **AND** promotion readiness 以该声明为前提

#### Scenario: 无记录且未声明决策

- **WHEN** 授权范围既无记录也未在 `build.md` 上声明记录决策
- **THEN** 阻塞 promotion readiness 并向用户请求该决策
- **AND** 不将未声明当作默认覆盖

#### Scenario: 规范细节遗漏阻止确认

- **WHEN** 记录的某条规范确认未落入任何 Candidate 目标
- **THEN** 该条目标为未覆盖并阻塞 source handoff

### Requirement: 交接记录后确认精确 Candidate

Build SHALL 在来源覆盖复核与适用校验通过后经 framing consume 向 active Candidate 交接精确记录来源，再验证带来源的最终 Candidate 并执行既有独立审查与用户 digest 确认。源或目标变化使受影响覆盖与确认失效。豁免或无记录时 SHALL 跳过 consumption 并在 promotion readiness 前核对已声明的记录决策，SHALL NOT 跳过确定性校验或独立语义审查本身。来源快照 SHALL 进入 history 而不进入正式模型。

#### Scenario: 确认最终带来源版本

- **WHEN** 覆盖复核与校验通过且来源可消费
- **THEN** 交接精确来源，验证带来源的最终 Candidate 并以其 digest 完成确认

#### Scenario: 来源交接失败

- **WHEN** framing consume 返回失败
- **THEN** 保留来源与既有目标，阻塞 promotion readiness

#### Scenario: 豁免时跳过消费但不跳过校验

- **WHEN** 来源已声明豁免或无记录
- **THEN** 跳过 consumption 并在 promotion readiness 前核对 `build.md` 上的记录决策
- **AND** 确定性校验与独立语义审查仍照常执行
