## Why

OpenSpec 当前把文件用途、内容边界与编写步骤混在长篇 `instruction` 中，Agent 缤写 artifact 前无法先获得稳定的文件语义模型；同时现有编译哲学把 durable semantic source 与 compilation scaffolding 视为同级，偏离 Specs + OPSX 作为 human-intent programming layer 的项目目标。需要为内置文件建立单一、结构化定义，并让 Agent 在编写前按需消费。

## What Changes

- 为内置 Schema 增加结构化 `FileDefinition`，明确文件目的、编译职责、内容边界、写入策略与验证命令。
- 让 `openspec instructions <artifact> --json` 在 `instruction` 和 `template` 之前返回当前 change artifact 的 `definition`。
- 明确 change-local specs 与 `opsx-delta.yaml` 使用 delta syntax 表达目标稳态，而不是 change log；Specs 与 formal OPSX 共同作为 durable semantic source。
- 为 bootstrap 完整生命周期文件增加定义，并由 `openspec bootstrap instructions <phase> --json` 仅投影当前 phase 所需的 `fileDefinitions`。
- 让 `openspec help authoring` 消费同一文件定义来源；relation 细节继续由 `RelationDefinitionRegistry` 单一投影。
- 对齐 workflow compilation philosophy：proposal、design、tasks 是当前技术条件下的 compilation scaffolding，不得覆盖 Specs 或 OPSX。
- **BREAKING** 删除 `schema init`、`schema fork`、project-local Schema 与 user override Schema；仅保留内置 `spec-driven`、`bootstrap` 及其 `schema which`、`schema validate` 检查能力。
- 删除 active guidance 中与 OPSX v2 两文件模型冲突的 code-map 依赖；保留 archive 与 CHANGELOG 历史记录。

## Capabilities

### New Capabilities

- `artifact-file-definitions`: 定义内置 change artifacts 与 bootstrap 文件的结构化语义、编译职责、写入策略和按需 Agent 投影合同。

### Modified Capabilities

- `cli-artifact-workflow`: instructions 输出并优先展示 artifact definition，Schema 选择限制为内置集合。
- `bootstrap`: bootstrap phase instructions 按需返回相关文件定义。
- `cli-authoring-help`: authoring help 改为消费结构化文件定义并保持 Registry relation 投影。
- `schema-resolution`: Schema resolution 收敛为固定内置 `spec-driven` 与 `bootstrap` 集合。
- `schema-init-command`: 删除 project-local Schema 创建命令。
- `schema-fork-command`: 删除 Schema fork 与 override 创建命令。
- `schema-which-command`: `schema which` 仅报告内置 Schema。
- `schema-validate-command`: `schema validate` 仅校验内置 Schema。
- `compilation-philosophy-fragment`: 区分 durable semantic source、compilation scaffolding 与 change reconciliation。
- `openspec-conventions`: 明确 change-local specs 正文描述目标稳态，Scenario 删除由目标集合省略表达。
- `opsx-delta-artifact`: 明确 `opsx-delta.yaml` 的 reconciliation syntax 与目标架构稳态语义。
- `ai-workflow-templates`: Agent authoring workflow 必须先消费 definition，且不复制具体定义 prose。

## Impact

- Schema 与 artifact graph：`schemas/spec-driven/schema.yaml`、`schemas/bootstrap/schema.yaml`、Schema Zod types、parser 与 resolver。
- Agent instructions：instruction loader、artifact workflow CLI、bootstrap CLI、generated workflow skills。
- OPSX authoring：authoring help 与 Registry-derived relation projection。
- Schema CLI/config：删除 customization surface，并限制 config、change metadata、`--schema` 的合法值。
- 测试与文档：更新 artifact、bootstrap、help、Schema CLI、workflow template 与 active command/reference coverage；不引入新依赖。
