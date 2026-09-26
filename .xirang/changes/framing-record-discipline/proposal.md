## Why

Definition Framing 的协议本身完整可用，但把记录写成「not a required structural stage」的可选增强，于是 Agent 在建记录与省一次追问之间理性地选择后者：本仓库 6 个 change 的 framing 记录数全部为 0。用户确认过的条件、数值、例外与时序只存在于对话上下文中，到 Propose 阶段只能靠记忆压缩成 Contract 语言，细节随之蒸发，且这种丢失没有任何门禁能够察觉——因为「没有记录」被当作正常路径而不是待裁决策。

## What Changes

把「可选记录」收敛为**可判定的记录决策**：形成过程只要产生 normative 确认，就必须在 handoff 前落到恰好一种终态——持久化记录、用户明确授予的豁免（记录在 Design Summary 与 provenance 中）、或声明本次无 normative 内容。三态皆无即阻塞，静默跳过不再是合法路径。

同时消除两处使细节能溜过门禁的缺口：一是记录写入的确认粒度，从「每发现一条细节打断一次」改为「一个设计段落结束后整批确认」，在保持每次写入仍需独立授权的前提下降低使用摩擦；二是覆盖检查，从叙事式自查改为对记录条目**逐条打钩**（未打钩即计为未覆盖），使遗漏可判定而非可辩解。

**BREAKING**：`definition-framing` 的豁免路径与记录决策为新增必检项，既有依赖「无记录即静默继续」的流程需显式声明决策。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `definition-framing`: 记录决策三态化与豁免语义；批量授权（按设计段落确认，不削减单次写入授权）；覆盖检查逐条打钩。
- `explore`: 「支持可选 Definition Framing」与「形成不持久化的 Design Summary」两个 Requirement 的终态从「可选/无记录即普通自审」改为「记录决策必须落定为三态之一」。
- `propose`: 「处理已确认设计记录」「验证确认内容到目标语义的覆盖」「交接已确认设计来源」三个 Requirement 从「无记录即跳过」改为「无记录必须要求来源声明记录决策，未声明即阻塞并退回 Explore」，覆盖检查改为逐条打钩并补齐 Authored View 落点。
- `semantic-model-build`: 「复用确认记录形成 Candidate」与「交接记录后确认精确 Candidate」同步记录决策与逐条覆盖门禁，保持既有 review / digest / promotion 不变。

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- `src/core/templates/workflows/{explore,propose,build}.ts`：记录决策、批量授权、逐条覆盖三处协议文本与 instructions 侧同步。
- `src/core/templates/fragments/xirang-fragments.ts`：`ELEMENT_DEFINITION_SEMANTICS`、`ELEMENT_CONTRACT_SEMANTICS` 与本轮 Agent 面统一英文和去方法名分支一并落地。
- 受管生成面：`.pi/skills/xirang-{build,explore,propose}/SKILL.md`、`.xirang/references/xirang-definition-framing.md` 重刷。
- 测试：`test/core/templates/{explore-template,propose-template,build}.test.ts` 中钉被替换说明性 prose 的断言改为钉记录决策与覆盖门禁两类 fail-closed 语义。
