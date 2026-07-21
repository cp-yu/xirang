# OPSX Project Invariant

OPSX 是面向 Agent 软件开发的 human-intent programming layer。Agent 将人类可读、机器可验证的高层语义编译为项目代码。

## Durable Semantic Source

OPSX 的持久语义源码是 **Specs + LikeC4**：

- Specs 定义完整、可验证、外部可观察的行为。
- `.opsx/architecture/**/*.c4` 定义 project intent、domain、capability、ownership、boundary 与 semantic relations。
- Specs 回答“程序必须做什么”；LikeC4 回答“能力属于哪里以及如何协作”。
- LikeC4 不是 code map。源码路径、import、call 与 symbol 只能作为当前实现证据，不能替代架构语义。

理想的 OPSX compiler 只需 Specs 与 LikeC4 即可忠实编译项目代码。

## Compilation Scaffolding

- `proposal.md`：修改动机、范围与 source impact。
- `design.md`：Agent 不应自行猜测的 lowering decisions。
- `tasks.md`：可执行、可验证的局部编译批次。

这些文件是编译脚手架，不得覆盖 Specs 或 LikeC4。外部行为事实属于 Specs；architecture intent、ownership、boundary 或 semantic relation 事实属于 LikeC4。

## Change and Reconciliation

- change-local `specs/**/spec.md` 是 behavior-source delta。
- `architecture-delta.c4` 是 architecture-source delta。
- sync 将已批准的 delta 合并到 formal Specs 与 `.opsx/architecture/`；archive 建立生命周期与历史边界。

```text
Target Behavior Source
  = Formal Specs
  + Change-local Delta Specs

Target Architecture Source
  = Formal LikeC4
  + architecture-delta.c4
```

Agent 编译这两个目标模型，而不是把 proposal、design 或 tasks 当作最终语义真相。

## Source Completeness

OPSX source 完整，当且仅当 Agent 能依据 Specs 与 LikeC4 忠实编译目标代码，无需猜测任何会改变行为或架构的关键决策。

- 未声明但会改变外部行为的决策必须回到 Specs。
- 未声明但会改变架构语义的决策必须回到 LikeC4。
- Specs 与 LikeC4 无法共同成立时，必须先修正 source compilation error。
- Existing code 是上一次编译产物与当前实现证据，不得静默覆盖 human intent。
- 同一语义事实只在一个权威 artifact 中定义。

## Agent as Compiler

- 忠实翻译，不发明未定义的行为或架构。
- 遇到 undefined decision 时停止猜测，回到对应 semantic source。
- 先理解 file definition，再消费 `instruction` 与 `template`。
- 保留 parser 所需的 canonical headings、IDs、schema keys、normative keywords、paths 与 commands。
- 将 `opsx validate`、reviewer、optimizer、seal、sync 与 archive 视为 compilation pipeline 的组成部分。
