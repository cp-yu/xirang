# Build Skill Kind Semantics

## Why

全量重建 Semantic Model 的实战暴露出 `xirang-build` skill 未覆盖的关键流程：Element Kind 语义与层级关系未明确（kind 被隐性当作层级约束）、legacy 内容迁移方式未规定（机械映射 vs agent 选择归属）、用户介入后 promotion 处理未区分（用户修改与 agent 修改对 review 有效性的影响不同）。

## What Changes

- `src/core/templates/workflows/build.ts`：新增 step 4（检测 subagent 可用性并询问模型）；step 9 明确 Element Kind 为语义标签不约束层级；新增 step 10（legacy/formal 内容恢复需 agent 选择归属、非复制迁移走 subagent、不复活退役行为）；review 增加 recovered 内容与排除项一致性检查；promotion 前重跑 validate 且区分用户/agent 修改的处理。
- `test/core/templates/build.test.ts`：新增 6 组断言锁定新经验。
- `test/core/templates/skill-templates-parity.test.ts`：更新 parity hash。
- `.pi/agents/xirang-reviewer.md`、`.pi/skills/xirang-apply-change/SKILL.md`、`.pi/skills/xirang-explore/SKILL.md`：`xirang update --force` 同步生成的术语对齐。

## Source Impact

### Behavior Source

**build 工作流**：`src/core/templates/workflows/build.ts`（生成源）——新增 step 4/10 迁移规则、step 9 kind 语义、review 与 promotion 复核。

**结构**：无 Element Declaration、Refinement、Relationship 或 Metamodel 变化。本次修改不改变 Semantic Model 的规范性语义，只改进生成 skill 的 Workflow 指令。

### Architecture Source

**结构影响**：无。未影响 Element Kinds、Relationships 或 Views。

## Impact

**影响面**：`xirang-build` skill 生成源与测试，及 `xirang update --force` 同步的三个生成制品。不影响 `.xirang/model/`、CLI 逻辑或运行时行为。