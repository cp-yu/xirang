## Why

用户在 Explore 中确认的意图细节（例子、反例、数值、时序）到不了 Change 的 Element：记录被按“结构”定义且没有“脱离会话可独立使用”的写入标准，细节在写入时被抽象掉；自由文本记录又表达不了组件架构与关系；Propose 编译时再抽象一层，而覆盖检查只靠 Agent 自觉、可被一句笼统描述跳过。整份替换与全量展示消耗上下文和注意力，防的却是 Explore 运行时遗忘而非 Propose 丢失细节。

## What Changes

- **BREAKING** Definition Framing 改名为 Design Record（设计记录），CLI `xirang framing` 改为 `xirang record`，受管目录、交接文件、类型名、reference 与三个模板同步改名，不保留任何兼容别名；旧格式记录明确诊断为不受支持。
- **BREAKING** 记录格式升级：`entries` 保持自由文本细节，新增与 Semantic Model 同形的 `structure`（Element Declarations、Relationships、Kinds，按语义 identity 定位、记目标状态、删除显式标出、Declaration 可部分确认），由 CLI 对照 Metamodel 与当前模型确定性校验。
- 写入改为按部分修改：只提交本次增改与删除并携带 `--source-version`，过期即拒绝；写入后只报告变更与记录概况，结构 diff 细到字段级并单独标出修改已确认字段。
- 用户在对话中确认设计即视为授权记录这部分内容；“确认设计不等于授权写入”只对记录写入放开。
- 条目写入标准改为“Propose 不看会话也能据此写出 Contract 与 Acceptance Case”，用户例子按原样保留；Propose 须把确认的例子写成 Acceptance Case，数值、时序、例外写进 Contract 而不泛化。
- Propose 与 Build 的覆盖检查改为原子细节粒度，结果交 CLI 记录并绑定来源版本与目标指纹；`consume` 前 CLI 校验结果完整、位置真实存在，并逐字段比对 `structure` 与目标模型，任一不满足即拒绝；检查结果作为形成历史保存，不进入 Semantic Model。
- 删除仅复述结构方法的 Element，结构形成完全交给可配置的分解指导。
- 其他部分完成后，用 worktree 对 Propose 覆盖检查做当前 Agent 与 subagent 的消融实验，结论决定后续是否引入 subagent；subagent 变体本身不在本 Change 内设计。

## Source Impact

### Behavior Source

#### New Specs

- `design-record`: 记录方法——确认即记录、写入标准、依赖一致、记录决策、原子细节覆盖检查与写作规则。
- `confirmed-design-record`: 记录制品——两部分格式、目标状态结构、部分确认、稳定身份与基准、仅作形成来源。
- `design-record-operations`: `xirang record` 命令面——部分更新与版本检查、字段级 diff、结构校验、覆盖记录与消费门禁、路径隔离与 JSON Contract。

#### Modified Specs

- `deterministic-operations`: 记录生命周期、校验、交接与 JSON Contract 改用 `xirang record`，交接前要求有效覆盖结果与结构比对。
- `explore`: 记录协议加载、确认即记录、只报告变更；Element Definition 片段经确认即可记录。
- `explore-role`: 只读边界的唯一例外改为确认即经 `xirang record` 记录。
- `explore-brainstorming`: Summary、只读边界、捕获边界与拆分指导中的记录例外改为确认即记录。
- `propose`: 读取 Design Record、按写作规则编译细节、原子细节覆盖检查并经 CLI 门禁交接。
- `propose-role`: 编排覆盖记录与消费。
- `propose-workflow`: 阶段边界改为允许 `xirang record coverage` 与 `consume`；拆分指导中的记录措辞同步。
- `post-propose-validation`: 来源到目标的覆盖复核改为原子细节粒度并经 CLI 记录。
- `semantic-model-build`: Build 共用确认即记录、写入标准、原子细节覆盖与 CLI 门禁，目标为 Candidate。
- `candidate-commands`: Candidate 校验与 promotion 纳入记录来源与覆盖结果。
- `project-tooling-configuration`: 投影的共享协议改为 Design Record。

### Architecture Source

#### Added Elements

- `design-record`: 形成过程中记录已确认意图的方法，替代 `definition-framing`，不再承担结构形成。
- `confirmed-design-record`: 记录制品，替代 `change-structural-definition`，新增同形结构部分。
- `design-record-operations`: 记录的 CLI 确定性操作，替代 `definition-framing-operations`，新增覆盖记录与结构比对门禁。

#### Modified Elements

- `explore`: Definition 中记录方法与授权方式改为 Design Record 与确认即记录。
- `explore-role`: Definition 中记录方法与授权方式改为 Design Record 与确认即记录。
- `propose`: Definition 中覆盖复核改为经 CLI 门禁的原子细节检查。
- `propose-role`: Definition 中编排内容纳入覆盖记录。

#### Removed Elements

- `definition-framing`: 由 `design-record` 替代；名称会误导为结构界定。
- `change-structural-definition`: 由 `confirmed-design-record` 替代；identity 带“结构定义”误导。
- `definition-framing-operations`: 由 `design-record-operations` 替代。
- `causal-definition`、`identity-boundary-clarification`、`bfs-confirmation`、`single-dimension-decomposition`: 仅复述或重复分解指导；结构形成由可配置的分解指导及其消费者负责。

#### Architecture Relations

- 原指向 `definition-framing` / `change-structural-definition` 的 7 条 `consumes`、`produces`、`invokes` 关系移除，并以相同端点语义改指 `design-record` / `confirmed-design-record` 重建。

## Impact

- CLI：`src/commands/framing.ts` → `record` 命令；`src/core/framing/` 全部模块（类型、文档解析、路径、校验、workspace、consume、baseline）；新增覆盖记录与结构比对；`src/cli/index.ts`、`src/core/completions/positional-types.ts`。
- Candidate：`src/core/candidate/{validator,history,promotion}.ts` 的来源文件名与覆盖结果。
- 模板与生成面：`src/core/templates/workflows/{explore,propose,build}.ts`（含 reference 源），重刷 `.pi/skills/xirang-{explore,propose,build}/SKILL.md` 与 `.xirang/references/` 下的记录协议 reference。
- 文档：`AGENTS.md` 项目定义中对应层级与段落。
- 测试：`test/commands/framing*.test.ts`、`test/core/framing/`、`test/integration/framing-workflow.test.ts`、`test/integration/windows-definition-ci.test.ts`、`test/utils/framing-discovery-isolation.test.ts`、`test/commands/candidate-{validate,promote}.test.ts`、`test/core/candidate-history.test.ts`、`test/core/templates/{definition-framing-reference,explore-template,propose-template,build}.test.ts`。
- 数据：现有 `.xirang/framing/` 活动记录失效；已归档 Change 中的 `framing-source.md` 保持原样作为历史。
