## Context

OpenSpec 的 explore 和 propose 工作流在设计阶段没有处理过时测试的通道。当架构变更（API 重构、路径变更、数据布局调整）导致现有测试与代码契约不一致时，explore 不会主动识别这些过时测试，propose 也无法在 artifacts 中捕获对应的清理计划。这导致测试套件与实际契约脱节，产生大量误报失败。

[INFERRED FROM CODE]：修改仅涉及 3 个文件（explore.ts、propose.ts、openspec-explore-supperpowers-style.md），总计 +10/-2 行，均为模板常量文本修改。

## Goals / Non-Goals

**Goals:**
- 在 explore 的 Testing Strategy 阶段增加过时测试识别要求
- 在 Design Summary 的 Testing Strategy 部分支持 Test Maintenance 子节
- 在 Capture Boundary 表格中补齐测试更新/删除的分类行
- 在 propose 的 Smart Routing 中增加 Test Maintenance 分发规则

**Non-Goals:**
- 不改变 snack 工作流（snack 从 git diff 反推，已自然覆盖测试变更）
- 不增加 AI 代理的自动测试删除能力
- 不修改 OPSX 结构或 code-map

## Decisions

1. **修改 reference 文件而非 SKILL.md 主指令**：过时测试识别是 Testing Strategy 阶段行为，属于 Superpowers brainstorming 纪律的扩展，放在 `openspec-explore-supperpowers-style.md` reference 中最合适。

2. **Design Summary 中内嵌 Test Maintenance 子节**：不创建独立的测试清理 artifact，而是在现有 Testing Strategy 部分增加子节，保持 Design Summary 结构的简洁。

3. **propose 分发规则：原因进 design.md，操作进 tasks.md**：过时测试的"为什么"是技术决策（design.md），"怎么做"是执行任务（tasks.md），这符合两者既有的职责边界。

## Risks / Trade-offs

- **[Risk] AI 代理可能误判测试是否真正过时** → Mitigation：explore 阶段仅要求识别和记录，不自动修改文件；具体更新/删除仍需人工在 apply 阶段审核
- **[Risk] 可能遗漏需要更新的测试** → Mitigation：explore 要求确定权威测试套件位置，propose 以权威套件为 ground truth 参考
