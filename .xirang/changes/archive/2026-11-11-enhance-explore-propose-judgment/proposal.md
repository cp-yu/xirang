## Why

现有提示词虽要求区分意图、方案与技术事实，实际使用仍出现先认同用户方案、再检查关键前提的情况。需要把独立判断、主动取证及向用户表达判断落实到推荐、采纳和就绪判断的时点。

## What Changes

- Explore 在推荐或采纳方案前判断可行性及目标适配，向用户表达判断与关键理由。
- Explore 和 Propose 主动补足证据并检查可靠性与适用性，保持取证方式开放。
- Propose 复用已确认决定和有效证据，在决策及就绪评估时执行判断，收尾复用同一规则。
- 保留现有确认权限、必要实验、就绪门禁与简洁表达；修改已按用户逐句确认落实。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `explore`：方案判断、向用户表达判断及主动取证。
- `design-exploration`：设计确认前的独立评估与证据获取。
- `explore-brainstorming`：方案比较与可行性取证指引。
- `propose`：方案推荐和就绪判断时的证据评估。
- `propose-workflow`：复用已有依据并判断方案就绪。
- `post-propose-validation`：收尾检查支撑预期结果的关键假设。

### Architecture Source

None

## Impact

- 源模板：`src/core/templates/workflows/explore.ts`、`src/core/templates/workflows/propose.ts`。
- 受管生成面：`.xirang/references/xirang-explore-supperpowers-style.md`、`.pi/skills/xirang-propose/SKILL.md`。
- 使用现有投影与更新机制，不改变 CLI 接口、配置、路径处理或依赖。
