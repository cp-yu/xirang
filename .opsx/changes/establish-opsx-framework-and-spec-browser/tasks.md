# Implementation Tasks

### Task 1: 建立 OPSX CLI 身份与唯一项目路径常量

**Goal**: 将可执行命令、Commander root identity、completion identity 与项目目录常量一次性切换为 OPSX。

**Files**:
- Modify: `package.json`
- Create: `bin/opsx.js`
- Delete: `bin/opsx.js`
- Modify: `src/core/config.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/commands/completion.ts`
- Modify: `src/core/completions/**/*`
- Test: `test/cli-e2e/basic.test.ts`
- Test: `test/core/completions/**/*.test.ts`

**Requirements**:
- 唯一项目常量为 `OPSX_DIR_NAME = '.opsx'`
- npm bin 与 Commander root name 仅为 `opsx`
- completion scripts 与安装路径仅注册 `opsx`
- 不提供 `opsx` bin、alias 或 legacy project root constant

#### Checks

- [x] C1 验证 CLI 与 npm bin identity
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "CLI 可执行命令 SHALL 为 opsx" / Scenario "运行 CLI 命令"
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "Package.json bin entry SHALL 为 opsx" / Scenario "npm 安装后可执行"
  - Command: `pnpm build && node bin/opsx.js --help`
  - Expect: 帮助显示 `opsx`，package bin 仅包含 `opsx`

- [x] C2 验证无旧命令入口
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "不提供迁移兼容层" / Scenario "无命令别名"
  - Command: `test ! -e bin/opsx.js && node -e "const p=require('./package.json'); if ('opsx' in p.bin) process.exit(1)"`
  - Expect: 仓库不再提供 `opsx` 可执行入口

- [x] C3 验证 shell completion identity
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "CLI 可执行命令 SHALL 为 opsx" / Scenario "Shell completion"
  - Command: `pnpm exec vitest run test/core/completions test/commands/completion.test.ts`
  - Expect: 所有 shell completion 仅注册 `opsx`

### Task 2: 迁移 CLI 与核心运行时到 .opsx

**Goal**: 将项目发现、init/update、config、change/spec、sync/archive、validate、bootstrap、Architecture 与 registry 的项目路径全部切换到 `.opsx/`。

**Files**:
- Modify: `src/core/init.ts`
- Modify: `src/core/update.ts`
- Modify: `src/core/project-config.ts`
- Modify: `src/core/{archive,backfill-specs,change-sync,list,scenario-labels,spec-registry,specs-apply,workflow-installation}.ts`
- Modify: `src/commands/**/*.ts`
- Modify: `src/utils/**/*.ts`
- Modify: `src/migration/**/*.ts`
- Modify: `src/validation/**/*.ts`
- Test: `test/core/{init,update,project-config,spec-registry}.test.ts`
- Test: `test/commands/**/*.test.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- 所有 active 项目 I/O 使用 `OPSX_DIR_NAME` 与 `path.join()` / `path.resolve()`
- `opsx init` 创建 `.opsx/`，update 仅识别 `.opsx/`
- Config、Specs、changes、bootstrap、references 与 Architecture 均从 `.opsx/` 读取
- 不将旧 `opsx/` 当作可回退项目根

#### Checks

- [x] C1 验证 init 与 update 项目边界
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "项目工作区 SHALL 为 .opsx" / Scenario "初始化新项目"
  - Verifies: `specs/cli-update/spec.md` / Requirement "Update requires an OPSX project" / Scenario "项目外运行 update"
  - Command: `pnpm exec vitest run test/core/init.test.ts test/core/update.test.ts`
  - Expect: init 只创建 `.opsx/`，update 只接受 `.opsx/` 项目

- [x] C2 验证 config 与 registry 路径
  - Verifies: `specs/config-loading/spec.md` / Requirement "Load project config from .opsx/config.yaml" / Scenario "Valid config file exists"
  - Verifies: `specs/spec-registry/spec.md` / Requirement "运行时构建 cap↔spec 双向映射" / Scenario "构建双向映射"
  - Command: `pnpm exec vitest run test/core/project-config.test.ts test/core/spec-registry.test.ts`
  - Expect: config 从 `.opsx/config.yaml` 加载，registry 从 `.opsx/specs/` 构建

- [x] C3 验证核心命令与 Architecture 路径
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "项目工作区 SHALL 为 .opsx" / Scenario "跨平台路径处理"
  - Command: `pnpm exec vitest run test/commands test/integration/arch-command.test.ts test/integration/sync-workflow.test.ts test/integration/archive-workflow.test.ts`
  - Expect: 命令与 Architecture 集成测试在 `.opsx/` 下跨平台通过

### Task 3: 迁移 workflow、subagent 与 reference 生成 surface

**Goal**: 从源模板消除 active `opsx` 命令和 `opsx/` 路径，并将受管 reference 文件改为 `opsx-*`。

**Files**:
- Modify: `src/core/templates/**/*`
- Modify: `src/core/shared/{skill-generation,subagent-generation}.ts`
- Modify: `src/core/{relations,workflow-installation,workflow-surface}.ts`
- Modify: `schemas/**/*`
- Modify: `test/core/templates/**/*.test.ts`
- Modify: `test/core/shared/**/*.test.ts`
- Modify: `test/skills/**/*.test.ts`

**Requirements**:
- 生成 workflow、subagent、instruction 和 reference 仅引用 `opsx` 与 `.opsx/`
- reference 文件名使用 `opsx-*`
- archive history 可保留历史文本，但不得作为 active 生成源

#### Checks

- [x] C1 验证 workflow 与 subagent 生成结果
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "CLI 命令引用 SHALL 一致" / Scenario "Workflow skill 引用"
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "CLI 命令引用 SHALL 一致" / Scenario "Subagent artifact 引用"
  - Command: `pnpm exec vitest run test/core/templates test/core/shared test/skills`
  - Expect: 生成 surface 仅包含 OPSX identity

- [x] C2 验证 reference 物化与路由
  - Verifies: `specs/references-home/spec.md` / Requirement "内置 reference 物化到 .opsx/references 目录" / Scenario "update 物化全部内置 reference"
  - Verifies: `specs/references-home/spec.md` / Requirement "内置 reference 物化到 .opsx/references 目录" / Scenario "skill 指令引用项目级路径"
  - Command: `pnpm exec vitest run test/core/workflow-installation.test.ts test/core/templates/sync-engine.test.ts`
  - Expect: references 物化到 `.opsx/references/` 且 active 文件名使用 `opsx-*`

### Task 4: 支持已有 LikeC4 element 的 architecture delta lowering

**Goal**: 让 sync 能消费 `extend <domain>.<capability> { metadata { intent/status/specs/... } }`，更新 formal element 而不重复声明 capability。

**Files**:
- Modify: `src/commands/arch/validate.ts`
- Modify: `src/validation/architecture-delta-validator.ts`
- Modify: `src/utils/architecture-delta-merger.ts`
- Test: `test/unit/utils/architecture-delta-merger.test.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- validator 验证 nested element extend 目标存在，并在 staged validation 中排除 `.likec4/` 运行缓存
- merger 将 `intent` lowering 为 description，合并 status 与其他 metadata
- Specs 索引去重并将 `.opsx/changes/<name>/specs/` formalize 为 `.opsx/specs/`
- 新 domain、新 capability 与 relation 的既有行为保持不变

#### Checks

- [x] C1 验证 nested element extension
  - Verifies: `specs/architecture-delta-artifact/spec.md` / Requirement "Delta 文件 SHALL 使用 LikeC4 extend 语法" / Scenario "扩展已有 capability metadata"
  - Command: `pnpm exec vitest run test/unit/utils/architecture-delta-merger.test.ts test/integration/arch-command.test.ts`
  - Expect: existing capability 被原位更新且不存在重复声明

- [x] C2 验证 change-local Spec 路径 formalization
  - Verifies: `specs/architecture-delta-artifact/spec.md` / Requirement "Delta 文件 SHALL 引用 change-local specs" / Scenario "引用 change-local spec"
  - Command: `pnpm exec vitest run test/unit/utils/architecture-delta-merger.test.ts`
  - Expect: `.opsx/changes/<name>/specs/...` 被转换为 `.opsx/specs/...`

- [x] C3 验证 staged validation 不消费运行缓存
  - Verifies: `specs/architecture-delta-artifact/spec.md` / Requirement "Delta 文件 SHALL 使用 LikeC4 extend 语法" / Scenario "Staged validation 忽略 LikeC4 运行缓存"
  - Command: `pnpm exec vitest run test/integration/arch-command.test.ts`
  - Expect: 添加 element 的 delta 不因 `.likec4/` layout snapshot drift 失败

### Task 5: 迁移当前仓库 durable source 并完成 OPSX 自举

**Goal**: 使用 `git mv` 将当前仓库完整 `opsx/` 工作区迁移到 `.opsx/`，同步正式 Specs、LikeC4 source 与 Apply references。

**Files**:
- Move: `opsx/` → `.opsx/`
- Modify: `.gitignore`
- Modify: `.opsx/architecture/**/*.c4`
- Modify: `.opsx/specs/**/*.md`
- Modify: `.opsx/references/**/*.md`
- Modify: `.pi/skills/**/*`
- Modify: `.pi/agents/**/*`

**Requirements**:
- 活动 change 和 `.apply-isolation.json` 一并迁移
- `.opsx/.cache/` 与 LikeC4 snapshot 被忽略，durable source 保持跟踪
- formal Specs 与 Architecture 索引使用 `.opsx/`
- 当前 Apply 后续阶段从 `.opsx/references/` 读取协议

#### Checks

- [x] C1 验证完整工作区结构
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "工作区目录结构 SHALL 完整" / Scenario "标准工作区结构"
  - Command: `test -d .opsx/architecture && test -d .opsx/specs && test -d .opsx/changes && test -d .opsx/references && test ! -d opsx`
  - Expect: durable source 仅位于 `.opsx/`

- [x] C2 验证版本控制边界
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "工作区目录结构 SHALL 完整" / Scenario "版本控制"
  - Command: `git check-ignore -q .opsx/.cache/probe && ! git check-ignore -q .opsx/specs`
  - Expect: 仅运行缓存被忽略

- [x] C3 验证 active source identity
  - Verifies: `specs/cli-command-reference-consistency/spec.md` / Requirement "Cleanup verification reports remaining stale references by class" / Scenario "清理后审计"
  - Command: `node bin/opsx.js validate establish-opsx-framework-and-spec-browser --strict`
  - Expect: 当前 change 在 `.opsx/` steady state 下通过严格验证

### Task 6: 纳入 LikeC4 v1.59.0 完整源码 subtree

**Goal**: 在可追踪的干净 checkpoint 上将 LikeC4 完整源码纳入 `likec4/`，保留独立 workspace 与许可证。

**Files**:
- Create: `likec4/` via `git subtree add --prefix=likec4 https://github.com/likec4/likec4.git v1.59.0 --squash`
- Modify: `package.json`
- Modify: `.gitignore`

**Requirements**:
- 执行 subtree 前提交 Task 1-5 的已验证 checkpoint
- 保留 upstream tag/commit、根 `LICENSE` 和关键 packages
- 根 scripts 显式编排 `likec4/` install/build/test，不创建虚假的根 `pnpm-workspace.yaml`

#### Checks

- [ ] C1 验证 subtree 来源与关键包
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "CLI 命令引用 SHALL 一致" / Scenario "Archive history 残留"
  - Command: `git log --grep='Squashed.*likec4' -1 --oneline && test -d likec4/packages/diagram && test -d likec4/packages/likec4-spa && test -d likec4/packages/vite-plugin`
  - Expect: subtree commit 与关键包存在

- [ ] C2 验证 upstream License
  - Evidence: `likec4/LICENSE`
  - Expect: LikeC4 MIT License 原文保留

### Task 7: 实现 opsx view 与内置 LikeC4 启动

**Goal**: 将旧终端 dashboard 替换为 `opsx view [--port]`，从子目录发现最近的 `.opsx/` 并启动内置 Web。

**Files**:
- Replace: `src/core/view.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/commands/arch/index.ts`
- Delete: `src/commands/arch/preview.ts`
- Modify: `src/commands/arch/runner.ts`
- Test: `test/core/view.test.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- 从当前目录向上查找最近的 `.opsx/`
- 调用仓库内置 LikeC4 entry，解析 `.opsx/architecture/`
- 支持 `--port`，未发现项目时返回非零
- 移除 `arch preview` 命令

#### Checks

- [ ] C1 验证 view 启动与端口传递
  - Verifies: `specs/cli-view/spec.md` / Requirement "Dashboard Display" / Scenario "启动 Web 浏览器"
  - Verifies: `specs/cli-view/spec.md` / Requirement "Dashboard Display" / Scenario "自定义端口"
  - Command: `pnpm exec vitest run test/core/view.test.ts`
  - Expect: `opsx view` 使用内置 LikeC4 并传递端口

- [ ] C2 验证项目发现与失败状态
  - Verifies: `specs/cli-view/spec.md` / Requirement "Dashboard Display" / Scenario "项目根发现"
  - Verifies: `specs/cli-view/spec.md` / Requirement "Dashboard Display" / Scenario "未找到项目"
  - Command: `pnpm exec vitest run test/core/view.test.ts`
  - Expect: 子目录发现成功，无 `.opsx/` 时失败

- [ ] C3 验证旧 arch preview 移除
  - Verifies: `specs/arch-preview-command/spec.md` / REMOVED Requirement "arch preview 命令 SHALL 启动 LikeC4 web 服务器"
  - Command: `pnpm build && ! node bin/opsx.js arch --help | grep -q preview`
  - Expect: `arch preview` 不再暴露

### Task 8: 在 LikeC4 vite-plugin 实现受控 Spec API 与文件事件

**Goal**: 为 `opsx view` 提供按 element/index 授权的 `/__opsx/spec` API 和精确文件变更通知。

**Files**:
- Modify: `likec4/packages/vite-plugin/src/plugin.ts`
- Modify: `likec4/packages/vite-plugin/src/rpc/protocol.ts`
- Create: `likec4/packages/vite-plugin/src/opsx/opsx-spec-handler.ts`
- Create: `likec4/packages/vite-plugin/src/opsx/opsx-spec-handler.spec.ts`

**Requirements**:
- 项目根由 OPSX CLI 显式传入 plugin options
- 服务端从当前 LikeC4 model 的 element metadata 复核 path
- 拒绝绝对路径、反斜杠、`.`/`..`、非 `.md`、未索引路径和 symlink escape
- watcher 只通知变更路径，由客户端决定当前 Spec 是否刷新

#### Checks

- [ ] C1 验证路径授权与按需读取
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "按需安全读取 Spec 文件" / Scenario "路径授权校验"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "按需安全读取 Spec 文件" / Scenario "按需加载"
  - Command: `pnpm --dir likec4 exec vitest run packages/vite-plugin/src/opsx/opsx-spec-handler.spec.ts`
  - Expect: 仅 element 已索引的 `.opsx/specs/**/*.md` 可读取

- [ ] C2 验证 symlink escape 与文件事件
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "按需安全读取 Spec 文件" / Scenario "符号链接逃逸"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "文件监听与热更新" / Scenario "Spec 文件修改"
  - Command: `pnpm --dir likec4 exec vitest run packages/vite-plugin/src/opsx/opsx-spec-handler.spec.ts`
  - Expect: symlink escape 被拒绝且变更事件精确携带 Spec 路径

### Task 9: 在 LikeC4 详情弹窗注入 loader 并呈现 Specs

**Goal**: 通过 `packages/diagram` 定义的 loader context 和 SPA HTTP 实现，在元素详情中条件式显示一个或多个 Spec。

**Files**:
- Create: `likec4/packages/diagram/src/opsx/SpecLoaderContext.tsx`
- Create: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`
- Create: `likec4/packages/likec4-spa/src/opsx/HttpSpecLoader.ts`
- Modify: `likec4/packages/likec4-spa/src/main.tsx`
- Test: `likec4/packages/likec4-spa/src/opsx/HttpSpecLoader.spec.ts`

**Requirements**:
- diagram 只依赖注入 loader，不依赖 fetch、Vite 或 Node filesystem
- 无索引不显示 Specs；单索引直接显示；多索引使用紧凑选择器
- 切换 element/path 使用 abort 或 request identity 防止 stale content
- 复用 LikeC4 `RichText.from({ md })` 与 Markdown 组件安全渲染

#### Checks

- [ ] C1 验证条件式标签与单/多 Spec 交互
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "条件式 Specs 标签页显示" / Scenario "元素有 Spec 索引"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "单个 Spec 直接渲染" / Scenario "单个 Spec 加载"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "多个 Spec 提供选择器" / Scenario "多个 Spec 默认选择"
  - Command: `pnpm --dir likec4 exec vitest run packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`
  - Expect: 三种索引状态按合同呈现

- [ ] C2 验证异步隔离、错误与安全 Markdown
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "切换元素清除状态" / Scenario "切换到新元素"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "异步加载状态" / Scenario "加载失败"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "Markdown 安全渲染" / Scenario "禁止危险内容"
  - Command: `pnpm --dir likec4 exec vitest run packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx packages/likec4-spa/src/opsx/HttpSpecLoader.spec.ts`
  - Expect: stale response 不串内容，错误局部显示，危险 HTML 不执行

### Task 10: 完成真实浏览器、完整 CI 与文档验证

**Goal**: 用真实 `opsx view` 验证桌面/移动布局、Spec 切换和热更新，并完成跨平台 CI 与当前文档迁移。

**Files**:
- Create: `test/e2e/spec-browser.spec.ts`
- Create: `playwright.config.ts`
- Modify: `README.md`
- Modify: `docs/**/*.md`
- Modify: `.github/workflows/opsx-v2-cross-platform.yml`
- Modify: `package.json`

**Requirements**:
- E2E 覆盖无 Spec、单 Spec、多 Spec、长文滚动和文件热更新
- 桌面与移动视口无重叠或溢出
- lint、typecheck、root tests、LikeC4 tests 和 builds 通过
- active 文档仅使用 `opsx` 与 `.opsx/`；archive history 不重写

#### Checks

- [ ] C1 验证浏览器交互与响应式布局
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "桌面与移动视口兼容" / Scenario "桌面视口"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "桌面与移动视口兼容" / Scenario "移动视口"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "文件监听与热更新" / Scenario "Spec 文件修改"
  - Command: `pnpm exec playwright test test/e2e/spec-browser.spec.ts`
  - Expect: 桌面与移动截图、滚动、切换和热更新通过

- [ ] C2 验证完整工程
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "CLI 可执行命令 SHALL 为 opsx" / Scenario "运行 CLI 命令"
  - Command: `pnpm lint && pnpm build && pnpm test && pnpm --dir likec4 build && pnpm --dir likec4 test`
  - Expect: 根项目与内置 LikeC4 全部通过

- [ ] C3 验证 active source 与文档清洁度
  - Verifies: `specs/cli-command-reference-consistency/spec.md` / Requirement "Cleanup verification reports remaining stale references by class" / Scenario "清理后审计"
  - Command: `node scripts/audit-opsx-identity.mjs`
  - Expect: active source 不含旧 identity；archive history 单独报告且不作为失败

- [ ] C4 验证 Windows CI 配置
  - Verifies: `specs/opsx-framework-identity/spec.md` / Requirement "项目工作区 SHALL 为 .opsx" / Scenario "跨平台路径处理"
  - Evidence: `.github/workflows/opsx-v2-cross-platform.yml`
  - Expect: Linux、macOS、Windows jobs 使用 Node.js >=22.22.3 执行完整检查
