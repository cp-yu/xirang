## Why

当架构变更（API 重构、数据布局调整、路径变更）导致现有测试过时时，explore 阶段不会主动识别这些过时测试，propose 阶段也不会在 artifacts 中捕获对应的更新/删除计划。这导致"代码正确但 44 个测试误报失败"之类的技术债——测试套件与实际契约不同步，但设计流程没有通道来记录和传递这些清理需求。

## What Changes

- **explore Testing Strategy 增强**：在 `openspec-explore-supperpowers-style.md` reference 文件和 explore template 中增加测试策略要求——当架构变更影响现有测试时，识别过时测试（更新/删除/新增），并记录到 Design Summary
- **explore Capture Boundary 补全**：在 explore template 的 Capture Boundary 表格中增加 "Test needs update or deletion → tasks.md + design.md" 行
- **propose Smart Routing 增强**：在 propose template 的 Smart Routing 中增加 Test Maintenance 分发规则——当 Design Summary 包含过时测试信息时，分发到 design.md（原因）和 tasks.md（具体操作）

## Capabilities

### New Capabilities
<!-- 无新增能力 -->

### Modified Capabilities
- `explore-brainstorming`: Testing Strategy 阶段新增过时测试识别要求；Design Summary self-review 新增过时测试检查点；Capture Boundary 表格新增测试更新行
- `propose-workflow`: Smart Routing 新增 Test Maintenance 分发规则
- `references-home`: `openspec-explore-supperpowers-style.md` reference 文件内容更新

## Impact

- `src/core/templates/workflows/explore.ts` — EXPLORE_SUPPERPOWERS_STYLE_REFERENCE 常量和 ACTIVE_CHANGE_CAPTURE_GUIDANCE 常量
- `src/core/templates/workflows/propose.ts` — SMART_ROUTING_GUIDANCE 常量
- `openspec/references/openspec-explore-supperpowers-style.md` — 自动生成 reference 文件（从 explore.ts 同步）
