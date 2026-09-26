## Context

Definition Framing 协议已具备完整的授权、重载、冲突调和与覆盖能力，`xirang framing` CLI 也完整可用（create/list/show/status/validate/update/consume/rename/discard）。问题不在能力而在触发条件：协议把记录表述为「not a required structural stage」的可选增强，于是「要不要建记录」在每一轮都变成一次可以被省略的判断。实测结果是本仓库 6 个 change 的 framing 记录数全部为 0。

记录缺失的代价不是少了一份文档，而是把用户已确认的规范化内容（条件、数值、例外、时序）退化成对话上下文。Propose 阶段只能在有限上下文里把它重新表述为 Contract 语言，丢失的部分没有任何确定性检查能够发现——`Matching strings, valid references, and a successful CLI validation cannot prove semantic coverage` 正是对这件事的既有断言。

同时存在两处使细节能溜过门禁的机制性缺口：确认粒度太细导致使用摩擦（每发现一条细节打断一次），以及覆盖检查是叙事式自查（可含糊带过）。

## Goals / Non-Goals

**Goals:**
- 让「本次是否产出记录」成为每个形成过程必须显式落定的决策，且只有三种合法终态。
- 让静默跳过成为不可能：任何「无记录」路径都必须携带声明，否则阻塞。
- 在保持「每次写入都需独立授权」的前提下降低确认摩擦。
- 让覆盖检查可判定：逐条打钩，未打钩即未覆盖。

**Non-Goals:**
- 不新增独立审查 Agent。Build 侧已有 clean-context review，扩展其 checklist 即可；Propose 侧保持 Agent 自查。
- 不新增 `xirang quality coverage` 类 CLI 命令：CLI 无法判断自然语言覆盖，硬做只会产生「字符串匹配即覆盖」的假门禁。
- 不改变 Definition Framing 的授权模型。`direction confirmation grants no write permission` 这条安全约束保持不变。
- 不让 `snack`（Implementation-first Path）产出记录决策——本协议自述范围为 Build 与 Explore；如需扩展属于新的变更。
- 不改变 Build 的 Candidate review / digest / promotion 结构，不新增 Design Summary 门禁。

## Decisions

1. **记录决策三态化，而非「必须建记录」**。合法终态为：持久化记录、用户明确授予的豁免、声明本次无 normative 内容。理由：若只允许「建记录」，用户会被迫为了走完流程创建一个空记录，而这违反 `EMPTY_PAYLOAD` 校验；豁免与「无 normative 内容」都必须显式声明并分别记录理由，从而与静默跳过区分开。豁免写进 Design Summary 与 provenance，使下游可验证。
2. **门禁判定依据用「是否含 normative 确认」而非「是否做了结构讨论」**。理由：结构讨论可以完全不产生规范内容（例如仅澄清备选），而 Contract-only 的窄变更会产生规范内容却无结构动作。用 normative 内容作判据才能覆盖两类场景，且与既有「关键确认」的定义一致。
3. **批量授权按设计段落而非按发现条数**。一个设计段落结束后，一次性展示本段全部待写 entries 并取一次确认。这只改变**确认发生的时机**，不改变**一次写入需一次授权**：每次 create/update 仍各自需要独立确认，且未经用户逐条处理的条目不算已确认。理由：摩擦来自打断频率而非授权强度，因此降低频率、保持强度即可。
4. **覆盖检查改为逐条打钩**。记录条目有稳定 identity，因此可以逐条标记「已落位 / 未覆盖（附理由）」，未标记即计为未覆盖并阻塞。理由：这是可复现的自查形态，而自由文本自查可以含糊带过；过去的漏细节根因是「没有可对比的源」，现在有记录可随时重载。
5. **落位目标必须包含 Authored View**。Declaration、Contract、Relationship、Metamodel 之外，`views/<view identity>.md` 也是合法 Delta 目标（Propose 第 8 步已如此规定）。若枚举遗漏 View，用户确认的合法 View 条目会被迫判为未覆盖，形成假阻塞。
6. **下游对「无记录」一律要求声明，不得默认覆盖**。Propose 与 Build 遇到无记录来源时，必须由 Design Summary 或当前输入声明记录决策；未声明即阻塞并退回 Explore。理由：上游只要有一处可以静默跳过，整个门禁就失效，因此三处入口需要同一语义。

## Risks / Trade-offs

- **记录成为影响 `reviewDigest` 的必产物**：`framing consume` 会写入 `framing-source.md`，而 Build 的 `reviewDigest` 包含该文件。用户中途修改记录会导致 digest 变更并触发重新审查。这是可接受的——digest 变更本就应该重新审查——但会在「记录频繁修订」的项目里放大审查次数。
- **Design Summary 增加必填内容**：带记录的 Summary 需携带 `explorationId` 与核对的 `sourceVersion`，豁免路径需携带声明与理由。这增加了 Summary 的机械成分，但正是使决策可被下游验证的代价。
- **批量授权可能被过度合并**：Agent 可能把多个设计段落当作一段来减少确认次数。文本以 `Batch by design section, not by confirmation` 明确单位是段落，以此约束。
- **三态判定需要 Agent 判断「是否含 normative 内容」**：这是语义判断，不能由 CLI 确定性完成。缓解方式是把它与既有的「关键确认」定义绑定，并让下游对未声明情形 fail-closed，使误判偏向「多问一次」而非「静默丢失」。
- **`snack` 未覆盖**：Implementation-first Path 不产出记录决策。这与协议自述范围一致，但意味着从已实现代码反向形成 Change 时没有该门禁。
