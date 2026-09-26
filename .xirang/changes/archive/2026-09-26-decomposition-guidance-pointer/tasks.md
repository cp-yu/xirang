### Task 1: decomposition 单字符串 schema、机械解析与功能性默认值

**Goal**: 将 `decomposition` 从 `{method}|{skill}` tagged union 改为单个非空字符串，并在 CLI normalization 层完成机械解析（路径形态原样保留；裸名称映射到 `.xirang/references/<值>`，不以 `.md` 结尾时补 `.md`），功能性默认值改为 `xirang-semantic-refinement.md`，setup/update 的 missing-only 物化随之生效。

**Files**:
- Modify: `src/core/project-config.ts`
- Test: `test/core/project-config.test.ts`
- Test: `test/core/setup.test.ts`
- Test: `test/core/update.test.ts`
- Test: `test/commands/config.test.ts`

**Requirements**:
- `decompositionField` 改为单字符串校验：拒绝非字符串、空串、posix/win32 绝对路径、反斜杠、`..` 穿越（复用 `gitCommitMessagePathField` 模式）；裸名称限 `[A-Za-z0-9._-]+`；非法值 warning 并从返回配置省略该字段，不回退默认（Contract: `elements/project-config-loading.md` / "加载结构拆分配置"）。
- normalization 输出解析后的指导文件路径字符串：`config project --json` 与 instructions `configProjection.normalized` 同构（Contract: `elements/config-projection.md` / "原样投影结构拆分选择"）。
- `PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.decomposition` 改为 `xirang-semantic-refinement.md`，使 setup 与 update 共享同一默认（Contract: `elements/project-config-loading.md` / "Materialize functional project config defaults"；`elements/workspace-init.md` / "Setup 物化默认结构拆分方法"；`elements/workspace-update.md` / "Migrate project config defaults"）。
- update 对既有 `decomposition` 值只保留不迁移、不覆盖（依赖 Task 1 自身 GREEN，无前置）。
- 同步更新受影响测试的选择器与断言（行为变更的测试修改，不保留旧 union 断言）。

#### Checks

- [ ] C1 Verify decomposition 解析契约的六种可观察行为（路径形态原样保留、裸名称解析、`.md` 不重复补后缀、缺失时默认、非法值不回退、yaml/yml 同语义）
  - Verifies: `elements/project-config-loading.md` / Requirement "加载结构拆分配置" / Scenarios "路径形态原样保留"、"裸名称解析到共享指导目录"、"带扩展名裸名不重复补后缀"、"字段缺失时使用默认指导文件"、"非法值不回退默认"、"yaml 与 yml 使用相同结构拆分语义"
  - Command: `pnpm vitest run test/core/project-config.test.ts`
  - Expect: 新增解析用例（modify）全部通过，旧 union 断言已删除
- [ ] C2 Verify 功能性默认物化包含新 decomposition 默认值且 missing-only 合并不覆盖用户值
  - Verifies: `elements/project-config-loading.md` / Requirement "Materialize functional project config defaults" / Scenarios "Default materialization includes decomposition, optimization, apply, and git"、"Missing-only merge preserves user values"
  - Command: `pnpm vitest run test/core/setup.test.ts test/core/update.test.ts`
  - Expect: 默认值断言（modify）为 `decomposition: xirang-semantic-refinement.md`，用户值保留语义保持通过
- [ ] C3 Verify setup 物化默认指导文件并保留用户既有值
  - Verifies: `elements/workspace-init.md` / Requirement "Setup 物化默认结构拆分方法" / Scenarios "新项目获得显式默认指导文件"、"Existing project 保留用户配置"、"跨平台 setup 写入相同默认值"、"显式 C4 仍被保留"
  - Command: `pnpm vitest run test/core/setup.test.ts`
  - Expect: setup 场景（modify）全部通过
- [ ] C4 Verify update 迁移语义：missing-only 补齐新默认值、既有值不做格式迁移
  - Verifies: `elements/workspace-update.md` / Requirement "Migrate project config defaults" / Scenarios "配置缺失时创建"、"添加缺失的嵌套默认值而不覆盖现有值"、"移除过时的 git 字段"、"迁移 config.yml 别名"、"项目配置默认值迁移"、"Windows 上迁移项目配置路径"、"添加缺失的顶层默认值"、"跳过无效配置而不阻塞工具刷新"、"保留显式方法与项目 skill"
  - Command: `pnpm vitest run test/core/update.test.ts`
  - Expect: update 迁移场景（modify）全部通过
- [ ] C5 Verify `config project --json` 输出解析后的指导路径且与 projection 一致，非结构 workflow 不获得拆分指导
  - Verifies: `elements/config-projection.md` / Requirement "原样投影结构拆分选择" / Scenarios "投影解析后的指导路径"、"投影路径形态原样输出"、"非结构 workflow 不消费拆分指导"、"非法配置不产生隐式 projection"
  - Command: `pnpm vitest run test/commands/config.test.ts test/core/templates/fragments/xirang-fragments.test.ts`
  - Expect: 输出断言（modify/reuse）为解析路径字符串，非法配置省略该字段，Apply/Archive/Reviewer/Optimizer 模板不含拆分 guidance

### Task 2: 共享片段英文无分支重写、reference 自述头与受管面重刷

**Goal**: 将 `STRUCTURAL_DECOMPOSITION_GUIDANCE` 重写为英文单一语言的单条无分支规则，更新 `SEMANTIC_REFINEMENT_REFERENCE` 自述头为指针措辞，重建 CLI 后重刷四个受管 SKILL.md，并更新一致性/片段/同步测试。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `.pi/skills/xirang-build/SKILL.md`
- Modify: `.pi/skills/xirang-explore/SKILL.md`
- Modify: `.pi/skills/xirang-propose/SKILL.md`
- Modify: `.pi/skills/xirang-snack/SKILL.md`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`
- Test: `test/core/templates/sync-engine.test.ts`
- Test: `test/skills/semantic-model-consistency.test.ts`

**Requirements**:
- 片段只保留四条英文 bullet：读 `xirang config project --json` 的 `decomposition` 值；按解析路径完整读取指导文件、缺失或不可读即停止且不回退；指导只选分解维度不覆盖正式语义；单维度 MECE + BFS（Contract: `elements/skill-generation.md` / "共享生成结构拆分 guidance"）。
- 片段不含 method/skill 分支文案与任何项目专属方法正文；`SEMANTIC_REFINEMENT_REFERENCE` 自述头改为「按 normalized `decomposition` 解析路径读取」措辞（Contract: `elements/workflow-templates.md` / "交付并路由通用语义精化指导"）。
- 重刷以受管 sync 机制执行（构建后 `node bin/xirang.js update`），不手改生成面语义；一致性测试改为断言「config 读取指令 + `decomposition` 值读取指令」的存在与顺序（依赖 Task 1 GREEN）。

#### Checks

- [ ] C6 Verify 四个结构形成 workflow 生成同一英文无分支共享片段且满足长度约束
  - Verifies: `elements/skill-generation.md` / Requirement "共享生成结构拆分 guidance" / Scenarios "四个结构形成 workflow 共享片段"、"非结构 workflow 不注入片段"、"项目专属规则不进入共享片段"、"生成内容继续满足长度约束"
  - Command: `pnpm vitest run test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/sync-engine.test.ts`
  - Expect: 片段一致性、非结构 workflow 不注入、无项目专属正文、200 行限制（modify）全部通过
- [ ] C7 Verify 受管面按解析路径路由默认与项目指导且旧分支文案已退役
  - Verifies: `elements/workflow-templates.md` / Requirement "交付并路由通用语义精化指导" / Scenarios "默认指导可达"、"项目指导优先"
  - Command: `pnpm vitest run test/skills/semantic-model-consistency.test.ts && grep -rn "invoke its value as a logical skill name\|For other explicit \`method\`" .pi/skills/xirang-build/SKILL.md .pi/skills/xirang-explore/SKILL.md .pi/skills/xirang-propose/SKILL.md .pi/skills/xirang-snack/SKILL.md; test $? -ne 0`
  - Expect: 一致性断言（modify）通过；grep 无匹配（旧分支文案不存在）

- [ ] C8 Verify 受管面表达完整读取指导文件与缺失即停止的单条规则
  - Verifies: `elements/definition-framing.md` / Requirement "按项目拆分指导确认结构目标" / Scenarios "指导文件驱动结构讨论"、"拆分指导不可读时停止"、"拆分指导不覆盖 Formal 语义"
  - Command: `grep -rln "missing or unreadable" .pi/skills/xirang-explore/SKILL.md .pi/skills/xirang-build/SKILL.md .pi/skills/xirang-propose/SKILL.md .pi/skills/xirang-snack/SKILL.md`
  - Expect: 四个受管 SKILL.md 均包含 fail-closed 停止语义（one-time，无持久测试文件）

- [ ] C9 Verify 受管面表达 Build 形成前的指导读取与 fail-closed 语义
  - Verifies: `elements/semantic-model-build.md` / Requirement "按项目配置形成 Candidate hierarchy" / Scenarios "读取解析后的指导文件"、"指导文件不可用时停止结构形成"、"独立语义审查检查拆分一致性"
  - Command: `grep -c "decomposition" .pi/skills/xirang-build/SKILL.md`
  - Expect: Build 受管面包含 decomposition 读取指令且无 Agent 自有方法知识分支（one-time，无持久测试文件）

### Task 3: 本仓库配置手迁与收尾一致性验证

**Goal**: 将本仓库 `.xirang/config.yaml` 手迁为路径形态指针，同步 `.xirang/references/xirang-semantic-refinement.md` 自述头，并执行一次性收尾验证。

**Files**:
- Modify: `.xirang/config.yaml`
- Modify: `.xirang/references/xirang-semantic-refinement.md`

**Requirements**:
- `.xirang/config.yaml` 的 `decomposition` 改为 `.pi/skills/xirang-project-decomposition/SKILL.md`（依赖 Task 1、Task 2 GREEN）。
- reference 自述头第 5 行改为指针措辞，与片段语义一致；正文方法内容不变。

#### Checks

- [ ] C10 Verify 本仓库归一化输出解析为配置的路径指针
  - Verifies: `elements/project-config-loading.md` / Requirement "加载结构拆分配置" / Scenario "路径形态原样保留"
  - Command: `node bin/xirang.js config project --json`
  - Expect: `decomposition` 输出 `.pi/skills/xirang-project-decomposition/SKILL.md`（one-time，无持久测试文件）
- [ ] C11 Verify 全量定向套件与构建在最终制品上通过
  - Verifies: `elements/project-config-loading.md` / Requirement "加载结构拆分配置" / Scenario "yaml 与 yml 使用相同结构拆分语义"
  - Command: `pnpm build && pnpm vitest run test/core/project-config.test.ts test/core/setup.test.ts test/core/update.test.ts test/commands/config.test.ts test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/sync-engine.test.ts test/skills/semantic-model-consistency.test.ts`
  - Expect: 构建成功且全部定向套件通过（one-time，无持久测试文件）
