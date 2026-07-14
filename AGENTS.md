# OpenSpec Project Invariant

OpenSpec 是面向 Agent 软件开发的 human-intent programming layer。它位于 human intent 与通用编程语言之间：以人类易读、机器可解析的高层表达描述软件，再由 Agent 忠实编译为项目代码。

## Durable Semantic Source

OpenSpec 的持久语义源码是 **Specs + OPSX**：

- Specs 定义程序必须持续呈现的完整、可验证、外部可观察行为。
- OPSX 以极少的上下文占用表达项目级架构语义，使 Agent 能理解项目意图、domain、capability、ownership、边界与精确 semantic relations。
- Specs 回答“程序必须做什么”；OPSX 回答“项目由什么能力构成、行为属于哪里、能力如何协作”。
- Specs 与 OPSX 共同构成 Agent 编译项目代码的高层源码，二者缺一不可。
- OPSX 不是 code map。源码路径、import、call 和 symbol evidence 用于定位当前实现，不得替代架构语义。

理想的 OpenSpec compiler 只需要 Specs 与 OPSX，即可忠实编译项目代码。

## Compilation Scaffolding

当前 LLM、Agent、上下文窗口、source completeness 与人类架构建模能力仍有限，因此使用以下 compilation scaffolding 支持可靠的局部编译：

- `proposal.md`：明确一次修改的动机、范围与 capability impact。
- `design.md`：记录当前 Agent 不应自行猜测的 lowering decisions。
- `tasks.md`：把编译拆分为可执行、可验证的局部批次并保存证据。

这些文件是当前技术条件下必要的编译脚手架，不与 Specs、OPSX 同级，也不得覆盖二者。会改变外部行为的事实最终属于 Specs；会改变架构 intent、ownership、边界或 semantic relations 的事实最终属于 OPSX。

OpenSpec 应持续演进为：更完整的 Specs 与 OPSX、更忠实的 Agent compilation、更少的必要 scaffolding，以及更大的可靠可编译范围。增加 planning artifacts 本身不是目标。

## Change and Reconciliation

软件必然演化，因此 change 是增量源码与 reconciliation 单元，而不是临时补丁日志：

- change-local `specs/**/spec.md` 是 behavior-source delta。
- `opsx-delta.yaml` 是 architecture-source delta。
- `proposal.md`、`design.md`、`tasks.md` 为该 delta 的编译提供 scaffolding。
- sync 将已批准的语义 delta 合并进 formal Specs 与 OPSX；archive 建立生命周期和历史边界。

change-local specs 与 `opsx-delta.yaml` 使用 delta syntax 表达向目标稳态的 reconciliation，但正文语义必须描述 change 完成后的目标稳态，不得写成 change log。

目标行为源码与目标架构源码分别为：

```text
Target Behavior Source
  = Formal Specs
  + Change-local Delta Specs

Target Architecture Source
  = Formal OPSX
  + opsx-delta.yaml
```

Agent 编译的是这两个目标模型，而不是把 proposal、design 或 tasks 当作最终语义真相。

## Source Completeness

OpenSpec source 完整，当且仅当 Agent 能依据 Specs 与 OPSX 忠实编译目标代码，而无需猜测任何会改变程序行为或项目架构的关键决策。

- 未声明但会改变外部行为的决策必须回到 Specs。
- 未声明但会改变架构语义的决策必须回到 OPSX。
- Specs 与 OPSX 无法共同成立时，视为 source compilation error，必须先修正 source。
- Scaffolding 可以暴露、约束和分解当前编译问题，但不得长期替代持久语义源码。
- Existing code 是上一次编译产物和当前实现证据，不得静默覆盖声明的 human intent。
- 同一语义事实只在一个权威 artifact 中定义；重复表达是 source smell。

## Agent as Compiler

Agent 必须像编译器一样工作：

- 忠实翻译，不发明 specs 未定义的行为或 OPSX 未定义的架构。
- 遇到影响行为或架构的 undefined decision 时停止猜测，回到对应 artifact 补全 source。
- 先理解文件 definition，再消费 `instruction` 和 `template`；不得把 definition、运行时 projection 或 Agent reasoning 复制进 artifact。
- 保留 downstream parser 所需的 canonical headings、IDs、schema keys、normative keywords、paths 与 commands。
- 将 `openspec validate`、reviewer、optimizer、seal、sync 与 archive 视为 compilation pipeline 的组成部分，而非可选仪式。
- 单次 compilation 必须忠实且确定；OpenSpec source 本身可以自由迭代并快速重新编译。
