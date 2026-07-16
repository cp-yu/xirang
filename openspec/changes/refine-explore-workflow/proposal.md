## Why

Explore 的主 prompt、Superpowers reference 与正式 Specs 曾同时承载重复且互相冲突的流程；术语决策的实际 helper 没有生产调用，导致真实运行 surface 缺少完整四态规则。现在需要把行为收敛到实际生成链和 conversation-only Explore 流程，避免 Agent 依赖猜测。

## What Changes

- 将 Explore 主 instructions 收敛为一个紧凑的 brainstorming checklist，并明确窄修改的最低设计确认集合。
- 将 Sweeper 委托、术语四态决策、降级和只读边界编译到实际 Explore prompt。
- 让 formal Specs 与 named Sweeper agent、用户语言和 Propose ownership 一致。
- 删除无生产入口的 terminology helper 及其 helper-only tests；通过模板合同测试覆盖实际行为。
- 继续通过生成管线刷新 Explore Skill/reference，并保留 `explore-supperpowers-style.md` 兼容路径。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `explore-brainstorming`: 收紧单一 brainstorming 流程、窄修改确认、named Sweeper 委托、只读失败降级、reference 和 todo 合同。
- `explore-terminology-decision`: 定义用户语言、四态判断、提问顺序、截断和当前对话决策记录。
- `ai-workflow-templates`: 让 Explore 模板结构只保留唯一 checklist，并移除重复的具体 Sweeper 行为 ownership。

### Architecture Source

#### Added OPSX Nodes

- None

#### Modified OPSX Nodes

- None

#### Removed OPSX Nodes

- None

#### Architecture Relations

- None

## Impact

- `src/core/templates/workflows/explore.ts` 及其生成的 `.pi/skills/openspec-explore/SKILL.md` 和 `openspec/references/openspec-explore-supperpowers-style.md`。
- Explore、terminology decision 和 workflow template formal Specs。
- `test/core/templates/explore-template.test.ts` 与 Explore parity hash。
- 删除 `src/core/ai/terminology-decision.ts`、`src/core/ai/terminology-extractor.ts` 及其三个仅测试文件；不改变 OPSX 节点、关系或外部 CLI surface。
