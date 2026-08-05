## Why

第三方项目使用息壤框架时，Agent 上下文中只有息壤框架信息（skill），没有任何当前项目 Semantic Model 信息。`xirang arch query`、`arch search`、`arch impact` 都要求先知道 identity 或查询词才能发起——Agent 冷启动是"盲"的，无法获得项目模型总览，无法判断模型里有哪些 Element、关系与 Metamodel 词汇。

当前唯一的全量投影 `xirang arch impact <root> --depth 10` 强制携带完整 Contract（本模型约 1MB），体积过大无法一次性注入上下文；且按 focus 裁剪关系，不能作为模型骨架总览。

## What Changes

新增 CLI 命令 `xirang arch snapshot`，一次性输出整个 Semantic Model 骨架——全部 Element Declarations、全部 Relationships 与 Metamodel Kinds——**不含 Element Contract**，默认文本（box-drawing 层级树）并可切换 markdown / json 三格式。该命令供 Agent 在 workflow 启动时一次性注入，作为项目模型总览，Contract 仍按需 `arch query --contract` 点查。

同时更新共享 `XIRANG_SHARED_CONTEXT` fragment，在 explore / propose / apply / snack / reviewer / optimizer 六个 workflow skill 中指引 Agent 先运行 `xirang arch snapshot` 获取模型骨架总览。

## Source Impact

### Behavior Source

#### New Specs

- `arch-snapshot`: 新命令 `xirang arch snapshot` 的完整行为——输出全部 Element Declarations（嵌套树，identity (kind) | definition）、全部 Relationships（按 kind 分组）与 Metamodel Kinds（含定义），不含 Contract；text / markdown / json 三格式；只读 Formal Semantic Model；模型缺失或无效时失败并报告。

#### Modified Specs

- `workflow-templates`: 统一加载协议与优雅降级 Requirement 增加 `xirang arch snapshot` 总览步骤，使共享 Semantic Model context fragment 指引 Agent 先获取模型骨架再按需点查 Contract。

### Architecture Source

#### Added Elements

- `arch-snapshot`: 定义 `xirang arch snapshot` 命令的语义——作为 `deterministic-operations` 下 arch 命令族的一员，承担一次性投影整个 Semantic Model 骨架的确定性操作。

#### Modified Elements

- None

#### Removed Elements

- None

#### Architecture Relations

- None（`arch-snapshot` 与现有 `deterministic-operations` 的消耗/验证关系已由父 Element 承载，不新增独立 Relationship。）

## Impact

- **CLI**: 新增 `src/commands/arch/snapshot.ts`（树构建 + 三序列化 + format），注册于 `src/commands/arch/index.ts`。
- **共享 fragment**: `src/core/templates/fragments/xirang-fragments.ts` 的 `XIRANG_SHARED_CONTEXT` 加一条 snapshot 指引。
- **生成物**: 六个受管 workflow skills（`.pi/skills/xirang-*`）随 `xirang update` 重新生成后包含新指引。
- **测试**: 新增 `test/commands/arch-snapshot.test.ts`（单元），扩展 `test/integration/arch-command.test.ts`（CLI 集成）。
- **不涉及**: likec4 包（视图级树导出不动）、现有 arch query/search/impact/validate 行为、Contract 点查路径。
