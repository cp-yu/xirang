## Why

Agent-facing CLI instructions 对 definition-first 顺序、当前制品状态、Bootstrap phase 文件定义与 Apply 前置 workflow 的表达不一致，且通用 artifact guidance 承担了调用 workflow 的 orchestration，导致直接消费 CLI 输出时存在错误编写或错误续接风险。

## What Changes

- 将 definition-first authoring contract 统一归属到 instruction projection，并让 workflow templates 消费该 contract 而非重复维护细节。
- 让 artifact instructions 以结构化 current state 暴露完成状态、输出路径与可选 completion marker 状态。
- 让 Bootstrap text/JSON instruction surfaces 按 phase 一致投影 file definitions，并使用 Bootstrap workspace 解析当前状态。
- 让 Apply blockers 按 schema 返回正确的 prerequisite workflow。
- 将 scenario label preview/write orchestration 从通用 Specs guidance 移交给调用 workflow。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `artifact-file-definitions`: 统一 definition-first instruction ownership，并补充 current state、Bootstrap file definition 与 label orchestration 边界。
- `instruction-loader`: 定义 enriched instruction 的 current state 与 schema workspace 解析行为。
- `cli-artifact-workflow`: 定义 artifact instruction 的 text/JSON state 投影及 schema-aware Apply blocker handoff。
- `bootstrap`: 定义 Bootstrap text/JSON phase instructions 的一致 file definition 投影。
- `ai-workflow-templates`: workflow templates 改为消费 CLI 返回的 authoring contract，不重复其字段级规则。

### Architecture Source

#### Added OPSX Nodes

None

#### Modified OPSX Nodes

None

#### Removed OPSX Nodes

None

#### Architecture Relations

None

## Impact

- `schemas/spec-driven/schema.yaml`
- artifact instruction loader 与 CLI renderers
- Bootstrap instruction renderer
- Propose、Snack、Bootstrap canonical workflow templates 与生成 Skills
- instruction、workflow template、parity 与 CLI contract tests
