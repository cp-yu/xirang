# Semantic Refinement

## 输入与边界

这是框架默认的通用语义精化方法。仅在 normalized decomposition 选择 `method: semantic-refinement` 且需要形成或重组 hierarchy 时使用；显式其他 method 或 skill 优先，Contract-only 变化不触发结构拆分。

以用户意图与已授权的语义依据为输入；实现文件、部署图和技术栈只是证据，不自动成为 hierarchy。指导不能覆盖正式语义、已确认设计、Contract、Relationships 或当前工作流权限；冲突先请求用户裁决。

## 逐层形成

1. 从领域概念、能力或用户目标识别当前抽象。为每个 Element 说明它是什么、为何独立、包含与不包含什么，以及与 parent、children、siblings 的边界。未决的语义选择一次询问一个问题。
2. 为同一 parent 的完整 sibling set 选择一个明确维度；在用户确认范围内检查互斥与完整性（MECE）。不要混合职责、生命周期、部署和实现等不同坐标；需要多种独立语义视角时分别说明各自边界。
3. 默认以 `project`、`element`、`perspective` 表达语义类别，而非规定层级。Perspective 必须是有真实语义边界、需要子级精化的视角；仅为展示同一批概念而分组时使用 View，不复制 Elements 或 Contracts。
4. 每个概念只保留一个稳定 identity；跨视角的协作、依赖或约束用类型化 Relationships 表达，不用重复建模解决呈现问题。只有真实共享语义无法由既有 Kind 准确表达时才扩展 Metamodel。
5. 采用 BFS：展示当前层全部 siblings、维度、边界和覆盖范围，用户确认后才展开下一层。不强制 C4 的固定技术层级或任何固定层数；按实际语义精化到足以理解和决策即可。
6. 分别完成 Declaration 与 Contract。即使不再拆子节点，条件、数值、例外、时序、职责和保证仍完整进入宿主 Element Contract；不得把停止结构精化误作省略行为。实现安排留给 Plan。

## 停止与交接

指导不足、概念身份重叠、维度不明或权威冲突时停止相关结构写入并请求用户；不默选实现目录或相近方法。方法确认不授予文件写入或记录持久化权限。

将确认的 identities、Kinds、完整 Definitions、hierarchy、Contract 细节与 Relationships 交回当前工作流。Explore 保持 conversation-only，Build 编写授权 Candidate，Propose 编译 Delta；记录仅经该工作流的独立授权协议保存。本指导不替代各流程的验证、审查、确认或提升门禁。