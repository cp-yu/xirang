## Why

结构拆分配置当前是 `{method}|{skill}` tagged union，生成面 guidance 以三分支文本表达读取规则，非默认分支下 Agent 仍会误读并读取未选择的指导文件（已在本会话实际观察到）；同时该 fragment 中英文混杂。需要把形态差异从 Agent 侧分支收敛为 CLI 侧机械解析，消除误读空间。

## What Changes

**BREAKING**：`decomposition` 配置从 tagged union 改为单个字符串：含 `/` 时作为项目根相对路径，否则解析为 `.xirang/references/<值>`（无 `.md` 后缀时补齐）。`xirang config project --json` 输出解析后的指导文件路径。结构形成入口的指导读取收敛为单条无分支规则：按解析路径完整读取指导文件，缺失或不可读即停止结构形成；不再存在「Agent 自有方法知识」与「按名称调用 skill」分支。共享 `STRUCTURAL_DECOMPOSITION_GUIDANCE` 片段重写为英文单一语言、无分支文本。功能性默认值改为 `xirang-semantic-refinement.md`；旧 union 格式无流通实例（v0.1.x 未推送 npm），不提供迁移逻辑。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `project-config-loading`: `decomposition` 解析契约从 tagged union 改为单字符串与机械解析规则（路径形态校验、裸名称到共享指导目录的映射、非法值 warning 并省略、缺失时使用新默认值）；功能性默认物化中的 decomposition 默认值同步变更。
- `workspace-init`: setup 物化的默认拆分指导值改为 `xirang-semantic-refinement.md`，保留用户既有字符串值。
- `workspace-update`: update 的 missing-only 默认补齐使用新默认值，且不对既有 `decomposition` 值做格式迁移。
- `definition-framing`: 结构目标确认从三分支路由（method/skill/默认）收敛为读取解析路径指导文件的单规则，文件不可读即停止。
- `semantic-model-build`: Candidate hierarchy 形成从三分支路由收敛为读取解析路径指导文件的单规则，文件不可读即 fail-closed；移除「Agent 已知方法」相关行为。
- `workflow-templates`: 共享 semantic-refinement reference 的交付与路由措辞改为按解析路径读取；项目显式指导优先语义保持。
- `skill-generation`: 共享 `STRUCTURAL_DECOMPOSITION_GUIDANCE` 片段的目标语义改为单条无分支规则（英文单一语言），不再表达 method/skill 分派。
- `config-projection`: 投影输出从 tagged union 原样名称改为解析后的指导文件路径字符串。

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- `src/core/project-config.ts`：`decompositionField` schema、functional defaults、归一化解析。
- `src/core/templates/fragments/xirang-fragments.ts`：`STRUCTURAL_DECOMPOSITION_GUIDANCE` 文本与 `SEMANTIC_REFINEMENT_REFERENCE` 自述头。
- 受管生成面：`.pi/skills/{xirang-build,xirang-explore,xirang-propose,xirang-snack}/SKILL.md` 重刷。
- 本仓库 `.xirang/config.yaml` 手迁为 `decomposition: .pi/skills/xirang-project-decomposition/SKILL.md`；`.xirang/references/xirang-semantic-refinement.md` 自述头同步。
- 测试：`test/core/project-config.test.ts`、`test/core/setup.test.ts`、`test/core/update.test.ts`、`test/core/templates/fragments/xirang-fragments.test.ts`、`test/core/templates/sync-engine.test.ts`、`test/skills/semantic-model-consistency.test.ts`。
