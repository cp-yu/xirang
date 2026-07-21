---
capabilities:
  - cap.opsx.bootstrap
---
## Purpose

Define the bootstrap workflow contract: how `opsx bootstrap` CLI subcommands guide users through initializing and promoting OPSX architecture files.
## Requirements
### Requirement: Bootstrap docs and workflow templates SHALL describe only the CLI-backed five-phase flow
Bootstrap 文档、workflow templates 与生成的命令指引 SHALL 仅将 bootstrap 描述为由现有 `opsx bootstrap` CLI 子命令驱动的结构化流程，并 SHALL 明确 agent 在 init 前负责询问 `granularity`。

#### Scenario: Bootstrap command guidance references real CLI subcommands
- **WHEN** a user reads generated bootstrap command content or bootstrap workflow guidance
- **THEN** the documented flow SHALL reference only these CLI subcommands:
  - `opsx bootstrap status`
  - `opsx bootstrap init`
  - `opsx bootstrap instructions`
  - `opsx bootstrap advance scan`
  - `opsx bootstrap validate`
  - `opsx bootstrap promote`
  - `opsx bootstrap backfill-specs`
- **AND** the guidance SHALL describe the lifecycle `init → scan → map → review → promote`
- **AND** the guidance SHALL describe `backfill-specs` as an independent subcommand also invoked by promote
- **AND** the guidance SHALL describe `--granularity coarse|fine` as explicit agent-provided init state, not as a CLI-owned semantic decision

#### Scenario: Promote 末尾自动调用 backfill
- **WHEN** `opsx bootstrap promote` 成功写入 OPSX 和 specs
- **THEN** promote SHALL 自动调用 Backfill Engine
- **AND** SHALL 在 promote 输出中包含 backfill 统计（已写入数、未匹配数）

#### Scenario: Bootstrap skill 指令包含 subagent 语义匹配
- **WHEN** bootstrap skill 模板被加载
- **THEN** 指令 SHALL 描述 promote 后对 backfill 返回的 unmatched specs 启动 subagent
- **AND** SHALL 使用 `semanticHandoff` 提供 spec 内容/路径、OPSX capability ID/intent 与 mapping result format
- **AND** 主 agent SHALL 仅把证据充分的结果通过 `--mappings <file>` 写回 frontmatter
- **AND** 最终报告 SHALL 列出仍无匹配的 specs，且不得静默猜测 capability 关联

#### Scenario: Deprecated pseudo-command flags are removed from bootstrap docs
- **WHEN** bootstrap docs are updated for the structured CLI-backed workflow
- **THEN** they SHALL NOT describe unsupported command forms such as `/opsx:bootstrap --focus`, `/opsx:bootstrap --extend --capabilities`, `/opsx:bootstrap --extend --relations`, or `/opsx:bootstrap --refresh`
- **AND** the docs SHALL direct scoped initialization to supported CLI parameters such as `opsx bootstrap init --scope ...`

### Requirement: Bootstrap contract surfaces SHALL stay consistent

Bootstrap schema、CLI、workflow templates、generated instructions 与 docs SHALL 描述同一 v2 五阶段流程及两文件输出。所有 relation authoring surface SHALL 消费 Registry 投影；formal-opsx refresh SHALL 描述为从当前 evidence 完整重建并以旧 model 生成 review diff。

#### Scenario: Contract surfaces agree on v2 output
- **WHEN** 检查 bootstrap surfaces
- **THEN** SHALL 仅声明 `project.opsx.yaml` 与 `project.opsx.relations.yaml` 为 formal output
- **AND** MUST NOT 声明 code-map、changed-path mapping 或 partial relation merge

#### Scenario: Contract surfaces agree on relation vocabulary
- **WHEN** 检查 domain-map template、map instructions、review 与 docs
- **THEN** SHALL 使用 Registry 六种 canonical relations
- **AND** MUST NOT 提供旧 relation token 作为选项

#### Scenario: Contract surfaces agree on refresh semantics
- **WHEN** baseline 为 formal-opsx
- **THEN** refresh SHALL 被描述为当前 evidence 的完整重建
- **AND** 旧 formal OPSX SHALL 仅用于 review diff

### Requirement: Bootstrap 产出 SHALL 基于 bootstrap 工作区填充项目级元数据

`assembleBundle()` 生成 bootstrap candidate bundle 时，`project.intent` 和 `project.scope` SHALL 来自 bootstrap 工作区已形成的信息（如 `scope.yaml`、`evidence.yaml`、`domain-map/*.yaml` 与当前 review 状态），而不是来自生态特定的 manifest 文件。

#### Scenario: raw/specs-based bootstrap 使用工作区信息填充 project 元数据

- **GIVEN** 仓库 baseline 为 `raw` 或 `specs-based`
- **AND** bootstrap 工作区存在 `scope.yaml`、`evidence.yaml` 与至少一个有效的 `domain-map/*.yaml`
- **WHEN** `assembleBundle()` 组装 OPSX bundle
- **THEN** `project.intent` SHALL 基于 bootstrap 当前领域 intent 信息生成
- **AND** `project.scope` SHALL 基于 `scope.yaml` 的 mode/include/exclude 与当前映射覆盖信息生成
- **AND** `package.json` 等 manifest SHALL NOT 作为这些字段的 source of truth

#### Scenario: bootstrap 输入不足时字段留空而不是猜测

- **GIVEN** bootstrap 工作区缺少稳定表达 `project.intent` 或 `project.scope` 所需的信息
- **WHEN** `assembleBundle()` 组装 OPSX bundle
- **THEN** 对应字段 SHALL 为 `undefined`（不写入 YAML）
- **AND** 实现 SHALL NOT 使用外部 manifest 或生态启发式填补这些字段

#### Scenario: formal-opsx refresh preserves existing project metadata unless reviewed delta changes it

- **GIVEN** 仓库 baseline 为 `formal-opsx`
- **AND** refresh 以当前 formal OPSX 作为候选基线
- **WHEN** refresh 重新组装 candidate bundle
- **THEN** 现有 `project` 元数据 SHALL 默认被保留为 source of truth
- **AND** 只有在 review 明确批准对应变更时，candidate 才可修改相关 `project` 字段
- **AND** refresh SHALL NOT 通过整包覆写 candidate 文件来隐式改写 formal `project` 元数据

### Requirement: Promote 后 bootstrap 工作区 SHALL 保留，不得主动删除

`promoteBootstrap()` 完成文件复制后，SHALL NOT 删除 `.opsx/bootstrap/` 工作区目录。工作区文件包含 bootstrap 过程中形成的项目理解，可能供后续使用。

#### Scenario: Promote 完成后工作区仍然存在

- **GIVEN** `opsx bootstrap promote` 执行成功
- **WHEN** 检查文件系统
- **THEN** `.opsx/bootstrap/` 目录及其所有文件 SHALL 仍然存在
- **AND** 终端 SHALL 打印提示，说明 `.opsx/bootstrap/` 已保留，用户可在确认后手动删除
- **AND** `promoteBootstrap()` SHALL NOT 调用任何删除该目录或其内容的 API

#### Scenario: Promote 完成时用户收到清理提示

- **GIVEN** promote 所有文件已复制完成
- **WHEN** `promoteBootstrap()` 返回
- **THEN** 调用方 SHALL 获得一条提示消息，说明工作区路径与手动清理方式
- **AND** 此提示 SHALL 明确表示可选（而非必须）

### Requirement: Completed retained workspace SHALL expose explicit restart guidance

bootstrap SHALL 区分“仍在进行中的 retained workspace”和“已经完成 promote 的 retained workspace”，并在 `status` 与 `instructions` 中为 completed workspace 暴露显式 restart 路径。

#### Scenario: completed retained workspace shows restart guidance

- **WHEN** `.opsx/bootstrap/` 存在且 workspace 生命周期状态表明上一轮 run 已完成
- **THEN** `opsx bootstrap status` SHALL 将该 workspace 描述为 completed，而不是当前 phase 的 resume 目标
- **AND** `opsx bootstrap instructions` SHALL 提供显式 restart 指令
- **AND** 提示 SHALL 使用 `opsx bootstrap init --mode refresh --restart` 作为下一轮 run 的标准入口
- **AND** 提示 SHALL 说明该命令继承 retained `scope.yaml` granularity，并可用显式 `--granularity coarse|fine` 覆盖

#### Scenario: in-progress retained workspace remains resume-only

- **WHEN** `.opsx/bootstrap/` 存在且 workspace 生命周期状态表明当前 run 尚未完成
- **THEN** `opsx bootstrap status` SHALL 继续报告当前 phase 进度
- **AND** `opsx bootstrap instructions` SHALL 继续提供 phase-specific resume 指引
- **AND** SHALL NOT 将 restart 呈现为默认下一步

### Requirement: Bootstrap 文档示例 SHALL 使用当前 schema 字段

`docs/opsx-bootstrap.md` 的 "Minimal Example" 代码块 SHALL 使用 `intent` / `scope` 而非已废弃的 `description` / `version`。

#### Scenario: 文档示例不包含废弃字段

- **WHEN** 检查 `docs/opsx-bootstrap.md` 的 YAML 示例
- **THEN** 示例 SHALL 使用 `project.id`、`project.name`、`project.intent` 字段
- **AND** 示例 SHALL NOT 包含 `project.description` 或 `project.version`
- **AND** 示例中的 domain 节点 SHALL NOT 包含内嵌的 `code_refs`

### Requirement: Bootstrap generated artifacts SHALL consume runtime projection
Bootstrap candidate specs, review artifacts, and starter artifacts SHALL consume runtime projection derived from project config so generated prose and stale detection follow the same contract as prompt-driven artifact authoring.

#### Scenario: Bootstrap candidate prose respects projected language policy
- **WHEN** bootstrap assembles candidate specs or review artifacts
- **AND** runtime projection defines a prose-language policy
- **THEN** bootstrap SHALL apply that runtime projection to generated prose fields
- **AND** SHALL preserve canonical English structure tokens and normative keywords

#### Scenario: Projection-affecting config changes invalidate bootstrap outputs
- **WHEN** an effective runtime projection field that changes generated bootstrap text is modified
- **THEN** bootstrap fingerprinting SHALL treat that as source drift
- **AND** review approval SHALL become stale until validate regenerates derived artifacts

### Requirement: Bootstrap init-to-scan transition
Bootstrap SHALL expose `opsx bootstrap advance scan` as the public, auditable transition from initialized workspace state to scan. Skill, instructions, CLI help, status, tests, and documentation SHALL use this command instead of metadata edits or internal API calls.

#### Scenario: Init output exposes scan transition
- **WHEN** `opsx bootstrap init` succeeds
- **THEN** output SHALL direct the user to `opsx bootstrap advance scan`
- **AND** `opsx bootstrap status --json` after the transition SHALL report `phase: scan`

### Requirement: Bootstrap granularity selection
Bootstrap skill agent SHALL obtain an explicit `coarse` or `fine` granularity choice before initialization when no explicit choice exists, and CLI SHALL only persist that confirmed choice into bootstrap scope.

#### Scenario: Agent asks granularity before init
- **WHEN** the bootstrap skill reaches init and no granularity has been explicitly provided
- **THEN** the agent SHALL ask the user to choose `coarse` or `fine`
- **AND** the agent SHALL explain that `coarse` produces fewer grouped specs while `fine` preserves per-capability specs
- **AND** the agent SHALL NOT choose a default on behalf of the user

#### Scenario: CLI persists explicit granularity
- **WHEN** the agent runs `opsx bootstrap init --mode full --granularity coarse`
- **THEN** CLI SHALL write `granularity: coarse` into `.opsx/bootstrap/scope.yaml`
- **AND** CLI SHALL treat the value as persisted agent execution state
- **AND** CLI SHALL NOT infer spec grouping semantics from repository evidence during init

### Requirement: Bootstrap grouped spec source

Bootstrap domain-map SHALL 支持 coarse `spec_groups`，但 candidate OPSX 只生成 domains、capabilities 与 Registry-valid relations。`spec_groups` SHALL NOT 创建 graph nodes 或 relations，也不存在 code-map output。

#### Scenario: Coarse mode uses spec_groups
- **GIVEN** granularity 为 coarse 且 domain-map 有合法 spec_groups
- **WHEN** validate 编译 candidate specs
- **THEN** 每个 group SHALL 生成一份含完整 capability frontmatter 的 spec
- **AND** SHALL NOT 改变 OPSX node/relation graph

#### Scenario: Fine mode uses capability specs
- **GIVEN** granularity 为 fine
- **WHEN** validate 编译 candidate specs
- **THEN** SHALL 从 capability spec source 生成
- **AND** SHALL NOT 经 spec_groups 合并

### Requirement: Bootstrap completion validation
Bootstrap skill agent SHALL run formal OPSX validation after a completed promote/backfill sequence.

#### Scenario: Agent validates after promote
- **WHEN** `opsx bootstrap promote -y` completes successfully
- **THEN** bootstrap skill guidance SHALL require the agent to run `opsx validate --all`
- **AND** the bootstrap workflow SHALL NOT treat completion as ready for handoff until the validation result is reported

#### Scenario: Validation failure returns to artifact repair
- **WHEN** `opsx validate --all` fails after promote
- **THEN** the agent SHALL report the failing item and return to the relevant bootstrap source artifact for repair
- **AND** the workflow SHALL NOT claim bootstrap completion while validation failures remain unresolved

### Requirement: Bootstrap relation authoring contract
Bootstrap map phase SHALL 使用 Registry-generated domain-map template，将代码图/import/call 仅作为候选证据，并要求 agent 按交互机制选择 relation。无法精确分类的候选 SHALL 进入 review gap，MUST NOT 生成通用关系。

#### Scenario: 代码依赖只形成候选
- **WHEN** CodeGraph 或 fallback 搜索发现 import/call
- **THEN** map phase SHALL 结合 capability intent 与 specs 判断 `invokes` 或 `consumes`
- **AND** MUST NOT 将每条代码 edge 自动写入 OPSX

#### Scenario: Review 检查 relation 质量
- **WHEN** bootstrap 生成 review
- **THEN** SHALL 展示 ownership 缺口、非法 endpoint、relation type/direction、无法证明的关系与 spec coverage
- **AND** promote SHALL 在 unresolved semantic errors 存在时阻塞

### Requirement: Bootstrap phase file definitions

Bootstrap SHALL 为完整生命周期文件提供结构化定义，并由 `opsx bootstrap instructions <phase> --json` 按 phase 投影。Definitions SHALL 区分 workflow state、retained bootstrap authoring inputs、CLI-generated derived review projections、review-controlled gates 与 workflow-managed durable source。

#### Scenario: Init 与 scan definitions
- **WHEN** Agent 请求 init instructions
- **THEN** `fileDefinitions` SHALL 描述 `.bootstrap.yaml` 为禁止 Agent 直接编辑的 workflow-managed state
- **AND** SHALL 描述 `scope.yaml` 为 CLI 持久化、用户决策驱动的 retained workflow input
- **WHEN** Agent 请求 scan instructions
- **THEN** SHALL 额外描述 `evidence.yaml` 为 retained bootstrap authoring input
- **AND** evidence MAY 包含 repository locations，但 SHALL NOT 将其定义为 final architecture claims

#### Scenario: Map definitions
- **WHEN** Agent 请求 map instructions
- **THEN** `fileDefinitions` SHALL 描述 `evidence.yaml` 为输入
- **AND** SHALL 描述 `domain-map/*.yaml` 为 provisional architecture authoring input，而不是 durable architecture source
- **AND** SHALL 禁止将 mechanical import/call edges 直接表示为 semantic relations
- **AND** relation 选择规则 SHALL 继续由 `RelationDefinitionRegistry` projection 提供

#### Scenario: Review definitions
- **WHEN** Agent 请求 review instructions
- **THEN** `fileDefinitions` SHALL 区分 retained authoring inputs、CLI-generated `candidate/**` projections 与 regenerated `review.md`
- **AND** SHALL 标记 `review.md` 只允许审查者更新 approval checkboxes

#### Scenario: Promote definitions
- **WHEN** Agent 请求 promote instructions
- **THEN** `fileDefinitions` SHALL 描述 candidate OPSX bundle、candidate Specs、formal OPSX bundle 与 formal Specs
- **AND** SHALL 将 formal OPSX bundle 定义为当前 durable architecture source
- **AND** SHALL 将 `.opsx/specs/**/*.md` 定义为 durable behavior source
- **AND** SHALL 明确 formal files 只能由受控 promotion workflow 写入
- **AND** SHALL 说明成功后 bootstrap workspace 被保留

### Requirement: Bootstrap phase instruction projection

`opsx bootstrap instructions [phase]` SHALL 在 JSON 与 text modes 投影同一 phase file definitions 与 definition-first authoring guidance。Pre-init、active phase 与 completed retained workspace SHALL 使用同一 projection contract；phase-specific lifecycle guidance SHALL 在共享 authoring guidance 之后提供。

#### Scenario: JSON mode 投影 phase definitions
- **WHEN** Agent 执行 `opsx bootstrap instructions [phase] --json`
- **THEN** response SHALL 包含当前 target phase 的 `fileDefinitions`
- **AND** `instruction` SHALL 先声明如何消费 file definitions，再包含 phase-specific guidance
- **AND** pre-init SHALL 使用 init phase definitions

#### Scenario: Text mode 在 instruction 前投影 definitions
- **WHEN** Agent 执行 `opsx bootstrap instructions [phase]`
- **THEN** output SHALL 在 `<instruction>` 前包含 `<file_definitions>`
- **AND** definitions SHALL 与同一状态下 JSON mode 返回的 file IDs 一致
- **AND** output MUST NOT 将 definitions 复制为 authored source content

#### Scenario: Completed workspace 保持 projection contract
- **WHEN** retained Bootstrap workspace 已 completed
- **THEN** instruction output SHALL 继续投影 target phase 的 file definitions
- **AND** SHALL 在共享 authoring guidance 后提供显式 restart guidance

