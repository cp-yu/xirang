### Task 1: 新增 SubagentTemplate 源模型与 per-tool renderer

**Goal**: 建立 internal subagent artifact generation 的统一源模型、显式注册表与按工具分派的渲染器（Claude/Pi/OpenCode markdown + Codex toml）。

**Files**:
- Create: `src/core/shared/subagent-generation.ts`
- Create: `test/core/shared/subagent-generation.test.ts`

**Requirements**:
- 定义 `SubagentTemplate` 接口（`name`、`description`、`prompt`、可选 `tools`、`disallowedTools`、`model`、`mode`、`metadata`），仅含语义字段
- 定义 `INTERNAL_SUBAGENT_TEMPLATES` 常量，显式注册 `openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`，不含 `openspec-implementer`
- 实现 `generateSubagentContent(template, toolId, version)` 按 `toolId` 分派到 claude/pi/opencode markdown renderer 与 codex toml renderer
- Codex renderer 对三引号 multiline string 与反斜杠字面量做安全转义，输出合法 TOML
- 不复用 workflow invocation transform；transform context 使用独立 `artifactType: 'subagent'`

#### Checks

- [x] C1 验证 SubagentTemplate 与注册表
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Internal subagent 模板注册" / Scenario "显式注册三个 internal subagent"
  - Command: `pnpm test test/core/shared/subagent-generation.test.ts`
  - Expect: INTERNAL_SUBAGENT_TEMPLATES 恰好包含三个角色且不含 implementer

- [x] C2 验证 Claude markdown renderer 输出
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Per-tool subagent artifact 渲染" / Scenario "Claude renderer 输出 Markdown agent 文件"
  - Command: `pnpm test test/core/shared/subagent-generation.test.ts`
  - Expect: claude 输出以 YAML frontmatter 开头，含 name/description/tools/model，不含 display_name/sandbox_mode/permission

- [x] C3 验证 Pi 与 OpenCode markdown renderer 输出
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Per-tool subagent artifact 渲染" / Scenario "Pi renderer 输出带权限声明的 Markdown"
  - Command: `pnpm test test/core/shared/subagent-generation.test.ts`
  - Expect: pi 含 display_name/tools/disallowed_tools/enabled；opencode 含 mode: subagent 与 permission.edit: deny

- [x] C4 验证 Codex toml renderer 输出与转义
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Per-tool subagent artifact 渲染" / Scenario "Codex renderer 输出 TOML"
  - Command: `pnpm test test/core/shared/subagent-generation.test.ts`
  - Expect: codex 输出合法 TOML，含 name/description/developer_instructions/sandbox_mode，multiline 三引号与反斜杠安全转义

### Task 2: 扩展 tool metadata 支持 subagent artifact

**Goal**: 在 `AIToolOption` 与 tool profile 中新增 `agentsDir` 与 `agentFormat`，声明每个工具的 subagent artifact 支持情况与原生格式。

**Files**:
- Modify: `src/core/config.ts`
- Modify: `src/core/templates/tool-profile/types.ts`
- Modify: `src/core/templates/tool-profile/registry.ts`
- Test: `test/core/templates/tool-profile.test.ts`

**Requirements**:
- `AIToolOption` 新增可选 `agentsDir?: string` 与 `agentFormat?: 'markdown' | 'toml'`
- claude/pi/opencode 声明 `agentFormat: 'markdown'`，codex 声明 `agentFormat: 'toml'`，各自 `agentsDir` 与 `skillsDir` 一致
- `ToolProfile` 透传 `agentsDir` 与 `agentFormat`，未声明 `agentsDir` 的工具不参与 subartifact 生成
- profile 测试覆盖四个目标工具的字段声明

#### Checks

- [x] C5 验证四个目标工具声明 agentsDir 与 agentFormat
  - Verifies: `specs/ai-tool-paths/spec.md` / Requirement "AIToolOption agentsDir 与 agentFormat 字段" / Scenario "Claude Code 声明 markdown agent format"
  - Command: `pnpm test test/core/templates/tool-profile.test.ts`
  - Expect: claude/pi/opencode 为 markdown，codex 为 toml，agentsDir 与 skillsDir 一致

- [x] C6 验证未声明 agentsDir 的工具被跳过
  - Verifies: `specs/ai-tool-paths/spec.md` / Requirement "AIToolOption agentsDir 与 agentFormat 字段" / Scenario "未声明 agentsDir 的工具不生成 subagent artifact"
  - Command: `pnpm test test/core/templates/tool-profile.test.ts`
  - Expect: 未声明 agentsDir 的工具 profile 不参与 subagent 写入且不抛异常

### Task 3: ArtifactSyncEngine 集成 subagent 写入与 cleanup

**Goal**: 在现有 sync engine 中新增 `writeSubagents()`，与 `writeSkills()` 并列；新增按显式名 list 清理旧 internal skill 目录的迁移逻辑。

**Files**:
- Modify: `src/core/templates/sync-engine.ts`
- Modify: `src/core/shared/skill-generation.ts`
- Modify: `src/core/workflow-installation.ts`
- Test: `test/core/templates/sync-engine.test.ts`
- Test: `test/core/workflow-installation.test.ts`

**Requirements**:
- `buildPlan()` 同时收集 workflow skill entries 与 internal subagent entries
- `syncOne()` 依次调用 writeSkills → writeSubagents → cleanup，使用 `path.join()` 构造 `<toolDir>/agents/<name>.<ext>` 路径
- 显式名 cleanup list 至少包含 `openspec-implementer`、`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`，不做 glob/regex/目录扫描删除
- cleanup 不删除用户自定义 skill 目录与用户自定义 `agents/` 文件
- `skill-generation.ts` 移除 `INTERNAL_SKILL_TEMPLATES` 注册；`getSkillTemplates()` 不再返回三个 internal 角色

#### Checks

- [x] C7 验证 init/update 同时写入 skills 与 agents
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Init 与 Update 集成 subagent artifact 生成" / Scenario "Init 时同时写入 skills 与 agents"
  - Command: `pnpm test test/core/templates/sync-engine.test.ts`
  - Expect: 每个目标工具同时生成 workflow SKILL.md 与 <toolDir>/agents/<name>.<ext>

- [x] C8 验证 subagent 写入路径跨平台一致
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Subagent artifact 写入路径" / Scenario "跨平台路径一致"
  - Command: `pnpm test test/core/templates/sync-engine.test.ts`
  - Expect: 路径通过 path.join 构造，codex 写 .toml，markdown 工具写 .md

- [x] C9 验证旧 internal skill 目录被显式名 cleanup
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "旧 internal skill 目录迁移 cleanup" / Scenario "Update 删除旧 internal skill 目录"
  - Command: `pnpm test test/core/templates/sync-engine.test.ts`
  - Expect: 预置 <toolDir>/skills/openspec-{reviewer,optimizer,impact-sweeper}/ 后运行 sync 被删除，workflow skill 目录与用户自定义目录保留

- [x] C10 验证 cleanup 不误删用户自定义 agents 文件
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "旧 internal skill 目录迁移 cleanup" / Scenario "用户自定义 agents 文件不误删"
  - Command: `pnpm test test/core/templates/sync-engine.test.ts`
  - Expect: 预置用户自定义 agents/my-custom.md 后运行 sync 文件保留

- [x] C11 验证 getSkillTemplates 不再返回 internal 角色
  - Verifies: `specs/skill-template-length-check/spec.md` / Requirement "现有超标 skill 模板必须拆分或精简" / Scenario "超标 workflow skill 被压缩或拆分"
  - Command: `pnpm test test/core/shared/skill-generation.test.ts`
  - Expect: getSkillTemplates() 返回值不含 openspec-reviewer/optimizer/impact-sweeper

### Task 4: 转换 internal 角色模板源为 SubagentTemplate

**Goal**: 将 reviewer、optimizer、impact-sweeper 的角色定义从 `SkillTemplate` 形态转换为 `SubagentTemplate` 源，保留原 role prompt、权限意图与 reference 协议。

**Files**:
- Modify: `src/core/templates/workflows/reviewer.ts`
- Modify: `src/core/templates/workflows/optimizer.ts`
- Modify: `src/core/templates/workflows/impact-sweeper.ts`
- Test: `test/core/templates/reviewer-template.test.ts`
- Test: `test/core/templates/optimizer-template.test.ts`
- Test: `test/core/templates/impact-sweeper-template.test.ts`

**Requirements**:
- 三个角色导出 `getReviewerSubagentTemplate()` / `getOptimizerSubagentTemplate()` / `getImpactSweeperSubagentTemplate()` 返回 `SubagentTemplate`
- 源模型保留原 role prompt、输入合约、写入边界、reference 文件内容
- 权限意图与 `subagent-self-read` 一致：reviewer/optimizer read/search/bash、edit/write 拒绝；impact-sweeper 仅允许写 `openspec/sweeper/`
- reference 文件仍物化到 `openspec/references/openspec-*.md`，内容工具中立

#### Checks

- [x] C12 验证 reviewer subagent template 权限意图
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Generated subagent artifact 编码 subagent-self-read 权限模型" / Scenario "Reviewer artifact 声明 read-only 权限"
  - Command: `pnpm test test/core/templates/reviewer-template.test.ts`
  - Expect: template 在源模型层声明 disallowedTools 含 write/edit，renderer 输出声明 read-only

- [x] C13 验证 impact-sweeper 限制写范围
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Generated subagent artifact 编码 subagent-self-read 权限模型" / Scenario "Impact sweeper 限制写范围"
  - Command: `pnpm test test/core/templates/impact-sweeper-template.test.ts`
  - Expect: prompt body 包含 "MAY 仅写 openspec/sweeper/" hard constraint，renderer 输出声明 edit/write 拒绝

- [x] C14 验证 optimizer subagent template 保留行为保持语义
  - Preserves: `openspec/specs/openspec-optimizer-skill/spec.md` / Requirement "Phase 2 优化器 skill" / Scenario "optimizer 提议行为保持优化"
  - Command: `pnpm test test/core/templates/optimizer-template.test.ts`
  - Expect: 旧 SkillTemplate 形态消失，Search/Replace-only 与 failedDirections 协议保留在新 SubagentTemplate prompt 中

### Task 5: 更新 workflow templates delegation 文案

**Goal**: 把 explore、apply-change、archive-change 模板中的 "Internal Skills / invoke skill / 读取 SKILL.md" 文案改为 "Internal Subagents / delegate to generated subagent / 不读取 generated artifact"。

**Files**:
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/archive-change.ts`
- Test: `test/core/templates/explore-template.test.ts`
- Test: `test/core/templates/apply-change.test.ts`
- Test: `test/core/templates/archive-change.test.ts`

**Requirements**:
- Skill Delegation Protocol 标题保留，内容从 "Internal Skills" 改为 "Internal Subagents"
- delegation 动词从 "invoke skill" 改为 "delegate to generated subagent"
- 禁止指令从 "Never use the Read tool on .claude/skills/<name>/SKILL.md" 改为 "Never read or inline the generated subagent artifact"
- 保留 evidence bundle 传递、structured output 等待、主 agent 不内联 subagent prompt 的边界

#### Checks

- [x] C15 验证 explore 模板 delegation 文案
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Workflow Skills 声明 Internal Subagents 约束" / Scenario "Explore skill 声明 internal subagents 约束"
  - Command: `pnpm test test/core/templates/explore-template.test.ts`
  - Expect: 模板含 "Internal Subagents" 与 "delegate to generated"，不含 ".claude/skills/openspec-impact-sweeper/SKILL.md"

- [x] C16 验证 apply-change 模板 delegation 文案
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Workflow Skills 声明 Internal Subagents 约束" / Scenario "Apply skill 声明所有 internal subagents 约束"
  - Command: `pnpm test test/core/templates/apply-change.test.ts`
  - Expect: 模板列出三个 internal subagents，禁止指令不引用任何 skills/<name>/SKILL.md 路径

- [x] C17 验证 verify delegation 指向 generated subagent
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Verify template 对 subagent 使用明确 delegation 指令" / Scenario "Reviewer subagent step 具有明确 delegation 指令"
  - Command: `pnpm test test/core/templates/apply-change.test.ts`
  - Expect: verify/Phase 2 文案使用 delegate to generated subagent，不使用 invoke skill

### Task 6: 更新 skill-template-length-validation 与相关测试

**Goal**: 调整 skill-template-length-validation 测试以反映 `getSkillTemplates()` 不再返回 internal 角色，并清理测试中的 "internal skill" 术语。

**Files**:
- Modify: `test/skills/skill-template-length-validation.test.ts`
- Modify: `test/integration/snack-workflow.test.ts`
- Modify: `test/core/shared/skill-generation.test.ts`

**Requirements**:
- skill-template-length-validation 测试仍调用 `getSkillTemplates()` 三次（undefined/claude/codex），覆盖范围为 workflow skill
- skill-generation 测试移除断言 internal skill 出现在 `getSkillTemplates()` 的用例，新增 internal subagent 由独立测试覆盖
- snack-workflow 集成测试若依赖 `getSkillTemplates()` 数量假设，按新范围调整

#### Checks

- [x] C18 验证 length validation 覆盖范围收敛到 workflow skill
  - Verifies: `specs/skill-template-length-check/spec.md` / Requirement "现有超标 skill 模板必须拆分或精简" / Scenario "超标 workflow skill 被压缩或拆分"
  - Command: `pnpm test test/skills/skill-template-length-validation.test.ts`
  - Expect: 测试通过，校验对象为 workflow skill SKILL.md，不含 internal 角色

- [x] C19 验证 skill-generation 测试不再期待 internal skill
  - Verifies: `specs/internal-skill-installation/spec.md` / REMOVED Requirement "内部 skill 模板注册"
  - Command: `pnpm test test/core/shared/skill-generation.test.ts`
  - Expect: 测试断言 getSkillTemplates() 不返回 openspec-reviewer/optimizer/impact-sweeper

### Task 7: 重新生成工具产物并验证 cleanup

**Goal**: 运行 `openspec update` 重新生成全部工具产物，验证 `.claude/agents/`、`.pi/agents/`、`.opencode/agents/`、`.codex/agents/` 生成正确文件，旧 internal skill 目录被清理。

**Files**:
- Modify: `.claude/agents/`
- Modify: `.pi/agents/`
- Modify: `.opencode/agents/`
- Modify: `.codex/agents/`
- Modify: `.claude/skills/`
- Modify: `.pi/skills/`
- Modify: `.opencode/skills/`
- Modify: `.codex/skills/`

**Requirements**:
- 四个目标工具的 `agents/` 目录下生成 `openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper` 文件（markdown/toml）
- 四个目标工具的 `skills/` 下不再存在 `openspec-reviewer/`、`openspec-optimizer/`、`openspec-impact-sweeper/` 目录
- workflow skill 目录（openspec-explore 等）保留

#### Checks

- [x] C20 验证 agents 目录生成
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Init 与 Update 集成 subagent artifact 生成" / Scenario "Update 时刷新 subagent artifact"
  - Command: `openspec update && ls .claude/agents .pi/agents .opencode/agents .codex/agents`
  - Expect: 各 agents 目录含三个角色文件，扩展名按 agentFormat 为 .md 或 .toml

- [x] C21 验证旧 internal skill 目录已清理
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "旧 internal skill 目录迁移 cleanup" / Scenario "Update 删除旧 internal skill 目录"
  - Command: `openspec update && ls .claude/skills .pi/skills .opencode/skills .codex/skills | grep -E 'openspec-(reviewer|optimizer|impact-sweeper)' || echo "clean"`
  - Expect: grep 无匹配，输出 clean

- [x] C22 验证 workflow skill 目录保留
  - Preserves: `openspec/specs/ai-workflow-templates/spec.md` / Requirement "固定工作流模板集合" / Scenario "注册表包含固定的 5 个工作流"
  - Command: `ls .claude/skills | grep -E 'openspec-(propose|explore|apply-change|archive-change|bootstrap-opsx|snack)'`
  - Expect: workflow skill 目录全部保留

### Task 8 (补全): 清理 sweeper mustChange 清单中遗漏的 active spec 旧术语

**Goal**: 根据 `openspec/sweeper/impact-sweep-clean-internal-skills-old-concepts.json` 的 mustChange 清单，补全本次 change 未覆盖的两个 active spec（`apply-implementer-subagent`、`ai-command-generation`）的术语迁移，确保归档 sync 后主 spec 不再残留 "internal skill" 旧术语。

**Files**:
- Create: `specs/apply-implementer-subagent/spec.md` (delta, MODIFIED)
- Create: `specs/ai-command-generation/spec.md` (delta, MODIFIED)

**Requirements**:
- `apply-implementer-subagent` 的 Scenario 标题与 body 从 "internal skill 列表显式排除 implementer" / "系统生成 internal skills" 改为 "internal subagent 列表显式排除 implementer" / "系统渲染 internal subagent artifact"
- `ai-command-generation` 的 Requirement 标题从 "命令列表排除内部 skill" 改为 "命令列表排除内部 subagent"，Scenario body 中的 "内部 skill" 改为 "internal subagent"
- MODIFIED requirement 标题必须与主 spec 当前标题精确匹配以保证 delta merge

#### Checks

- [x] C23 验证 apply-implementer-subagent delta 术语迁移
  - Verifies: `specs/apply-implementer-subagent/spec.md` / Requirement "apply 不再调用 implementer subagent" / Scenario "internal subagent 列表显式排除 implementer"
  - Command: `openspec validate "replace-internal-skills-with-subagents" --type change --json`
  - Expect: delta 通过 section-type cross-check，主 spec 标题与 delta MODIFIED 标题匹配

- [x] C24 验证 ai-command-generation delta 术语迁移
  - Verifies: `specs/ai-command-generation/spec.md` / Requirement "命令列表排除内部 subagent"
  - Command: `openspec validate "replace-internal-skills-with-subagents" --type change --json`
  - Expect: MODIFIED requirement 标题与主 spec 精确匹配，新 Scenario 引用三个 internal subagent
