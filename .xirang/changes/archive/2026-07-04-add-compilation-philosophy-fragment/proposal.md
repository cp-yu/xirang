## Why

Agent 处理 OpenSpec 工作流时缺乏统一的理念指引——现有模板全是操作性指令，没有「为什么」。OPSX 的设计隐喻（文档编译为代码）虽已零散存在于 project.opsx.yaml 和 cap.config.projection 中，但从未进入生成的 skills/subagents 提示词。导致 agent 输出制品时可能产生冗余表述、漏掉用户未言明的关键决策点、偏离规约做额外改动。

## What Changes

- 在 `src/core/templates/fragments/opsx-fragments.ts` 新增 `OPSX_COMPILATION_PHILOSOPHY` 共享片段，表达编译隐喻映射与六条行为规则
- 6 个用户可调用 workflow skill 模板（propose / explore / apply-change / archive-change / bootstrap-opsx / snack）在 instructions 开头注入该片段
- 2 个 internal subagent 模板（reviewer / optimizer）在 Role 段后注入该片段
- 排除名单：impact-sweeper（只读报告角色）、feedback（不写制品）、verify-execution-model（helper 非模板）
- 扩展片段测试和 8 个 per-template 测试；sweeper 测试断言片段不存在；更新 parity 快照哈希

## Capabilities

### New Capabilities
- `compilation-philosophy-fragment`：共享编译哲学提示词片段，定义 OPSX 编译隐喻映射与六条行为规则，注入 8 个 workflow/subagent 模板，编码排除名单和溢出裁决

### Modified Capabilities
<!-- 纯增量变更，无现有需求被修改 -->

## Impact

- `src/core/templates/fragments/opsx-fragments.ts`：新增片段常量
- `src/core/templates/workflows/{propose,explore,apply-change,archive-change,bootstrap-opsx,snack,reviewer,optimizer}.ts`：注入片段
- `test/core/templates/` 下 11 个测试文件扩展
- 行数预算安全：最长模板 apply-change 约 159/200 行
