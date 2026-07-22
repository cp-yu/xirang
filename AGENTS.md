# OPSX Project Invariant

OPSX 是可被 Agent 编译的 human intent 的结构化表述。这里的“编译”描述 Agent 类似编译器的操作：Agent 直接读取、理解并实现 OPSX Semantic Model。

## OPSX Semantic Model

**OPSX Semantic Model** 是 human intent 的唯一权威表达，由同一模型的两类 source modules 共同构成：

- `.opsx/architecture/**/*.c4` 使用 OPSX LikeC4 Profile 表达 metamodel、elements、containment、semantic relationships 与 views。
- `.opsx/specs/**/*.md` 表达 elements 的 typed contracts。
- LikeC4 modules 与 Spec modules 不是两套并列模型；必须联合理解、联合验证。


## Change and Reconciliation

工作流保持 `Explore → Propose → Apply → Verify → Sync → Archive`：

- Explore 澄清 human intent。
- Propose 将 intent 结构化为 change-local Semantic Delta，并生成 compilation scaffolding。
- Apply 按 Target Semantic Model 实现代码。
- Verify 校验实现与 Target Semantic Model 一致。
- Sync 将已批准、已验证的 Semantic Delta 原子合并到 formal OPSX Semantic Model。
- Archive 封存 change、决策与证据，不再改变 formal semantics。

```text
Target Semantic Model
  = Formal OPSX Semantic Model
  + Approved Semantic Delta
```


## Model Completeness

OPSX Semantic Model 完整，当且仅当 Agent 能直接依据它忠实实现目标代码，无需猜测任何会改变 human intent 的关键决策。

- 每个 Spec 的 `element` 必须解析到 formal model 或同一 Semantic Delta 中的 element。
- 删除 element 时必须同时 reconcile 其 Specs、children 与 Semantic Relationships。
- required-contract elements 在 Target Semantic Model 中必须至少拥有一个 Spec。
- 同一语义事实只能在一个权威 source location 中定义；其他位置只能引用或派生。

## Agent as Compiler

- 忠实翻译，不发明未定义的 intent、guarantee、contract、element 或 relationship。
- 遇到 undefined decision 时停止猜测，返回 human intent 澄清或 change artifacts。
- 先从 Project Root Element 理解整体，再沿 abstraction/refinement hierarchy 按需下钻。
- 先理解 file definition，再消费 `instruction` 与 `template`。
- 保留 parser 所需的 canonical headings、IDs、schema keys、normative keywords、paths 与 commands。
- 将 `opsx validate`、reviewer、optimizer、seal、sync 与 archive 视为 Agent compilation workflow 的组成部分。

