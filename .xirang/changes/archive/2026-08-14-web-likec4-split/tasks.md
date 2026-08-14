### Task 1: 生成结构迁移 Semantic Delta 并校验

**Goal**: 生成结构迁移 delta——`web` 与 3 个修改 child 的 ADDED Declaration、`semantic-browser` 的 REMOVED、`supports-presentation` 端点迁移——并通过确定性校验。

**Files**:
- Create: `.xirang/changes/web-likec4-split/elements/web.md`
- Create: `.xirang/changes/web-likec4-split/elements/xirang-projection-service.md`
- Create: `.xirang/changes/web-likec4-split/elements/xirang-diff-overlay.md`
- Create: `.xirang/changes/web-likec4-split/elements/xirang-contract-delivery.md`
- Create: `.xirang/changes/web-likec4-split/elements/semantic-browser.md`
- Create: `.xirang/changes/web-likec4-split/relationships/supports-presentation.yaml`

**Requirements**:
- `web` 以 ADDED Declaration 承接浏览编排语义，3 个修改 child 以 ADDED 挂 `web`
- `semantic-browser` 以 REMOVED 声明（仅 identity）
- `supports-presentation` 源端点由 `semantic-browser` 迁移为 `web`
- 39 条 requirement 按 design.md 映射表归属 4 个新 Element，行为语义不变

#### Checks

- [x] C1 联合校验通过
  - Verifies: `elements/web.md` / Requirement "支持分层语义浏览" / Scenario "下钻 Model 或 Authored View"
  - Command: `xirang validate --change "web-likec4-split" --json`
  - Expect: `valid: true`，零 ERROR，entries 含 4 条 element-declaration ADDED、1 条 REMOVED 与 supports-presentation 端点迁移

- [x] C2 结构校验通过
  - Verifies: `elements/xirang-projection-service.md` / Requirement "服务端计算 Runtime Projection" / Scenario "请求有效 projection"
  - Command: `xirang arch validate --change "web-likec4-split" --json`
  - Expect: `success: true`，errors 为空

- [x] C3 requirement 归属计数正确
  - Verifies: `elements/xirang-contract-delivery.md` / Requirement "按需安全读取 Contract 单元" / Scenario "Manifest 预载 Contract 内容"
  - Command: `grep -c "^### Requirement:" .xirang/changes/web-likec4-split/elements/web.md .xirang/changes/web-likec4-split/elements/xirang-projection-service.md .xirang/changes/web-likec4-split/elements/xirang-diff-overlay.md .xirang/changes/web-likec4-split/elements/xirang-contract-delivery.md`
  - Expect: `web.md` 19 条、`xirang-projection-service.md` 9 条、`xirang-diff-overlay.md` 3 条、`xirang-contract-delivery.md` 8 条

### Task 2: 迁移受影响 Element 文案并清理残留

**Goal**: 8 个受影响 Element 的 Definition/Contract 中 "Semantic Browser" 文案替换为 "Web"（2 条 requirement 标题以 REMOVED 旧名 + ADDED 新名改名），模型与代码无旧 identity 名称残留，浏览器行为回归通过。

**Files**:
- Create: `.xirang/changes/web-likec4-split/elements/interaction-surfaces.md`
- Create: `.xirang/changes/web-likec4-split/elements/cli.md`
- Create: `.xirang/changes/web-likec4-split/elements/model-view.md`
- Create: `.xirang/changes/web-likec4-split/elements/derived-views.md`
- Create: `.xirang/changes/web-likec4-split/elements/collaboration-structure.md`
- Create: `.xirang/changes/web-likec4-split/elements/authored-views.md`
- Create: `.xirang/changes/web-likec4-split/elements/internal-agents.md`
- Create: `.xirang/changes/web-likec4-split/elements/visual-presentation.md`

**Requirements**:
- 8 个 Element 的 Definition/Contract 文案 "Semantic Browser" → "Web"，替换不改变 requirement 行为语义
- 2 条 requirement 标题改名：`cli` "配置 Web 监听地址"、`interaction-surfaces` "由 CLI 与 Web 组成"
- `.xirang/model/` 无 "Semantic Browser" 文案与 `semantic-browser` identity 残留
- 代码零改动（src/ 与 likec4 源码无 `semantic-browser` 引用）

#### Checks

- [x] C4 全量联合校验通过
  - Verifies: `elements/visual-presentation.md` / Requirement "使用原生 LikeC4 布局管线" / Scenario "呈现 Model 与等价 Authored View"
  - Command: `xirang validate --change "web-likec4-split" --json`
  - Expect: `valid: true`，零 ERROR

- [x] C5 delta 无旧名文案残留
  - Verifies: `elements/interaction-surfaces.md` / Requirement "由 CLI 与 Web 组成" / Scenario "选择交互界面"
  - Command: `grep -rn "Semantic Browser" .xirang/changes/web-likec4-split/elements/`
  - Expect: 仅 2 处 REMOVED requirement 标题（`cli.md` "配置 Semantic Browser 监听地址"、`interaction-surfaces.md` "由 CLI 与 Semantic Browser 组成"）

- [x] C6 delta 无旧 identity 残留
  - Verifies: `elements/interaction-surfaces.md` / REMOVED Requirement "由 CLI 与 Semantic Browser 组成"
  - Command: `grep -rn "semantic-browser" .xirang/changes/web-likec4-split/elements/ .xirang/changes/web-likec4-split/relationships/`
  - Expect: 仅 `semantic-browser.md` 的 REMOVED 声明 identity 与 `supports-presentation.yaml` 的 REMOVED 端点条目

- [x] C7 生产代码零引用确认
  - Verifies: `elements/xirang-projection-service.md` / Requirement "保持 LikeC4 投影有效" / Scenario "生成 runtime projection"
  - Command: `grep -rn "semantic-browser" src/ likec4/packages --include="*.ts" --include="*.tsx" | grep -v -E "/(dist|lib)/" | grep -v -E "\.(spec|test)\.(ts|tsx)"`
  - Expect: 零命中（`architectureView.spec.ts` 中的同名 identity 为测试 fixture 任意数据，非模型引用，不改动）

- [x] C8 浏览器行为回归（One-time Verification，无持久测试文件）
  - Verifies: `elements/web.md` / Requirement "提供三维独立控制" / Scenario "选择和清除 Change"
  - Command: `pnpm test:likec4`
  - Expect: `test/core/likec4`、`test/core/view.test.ts`、`test/integration/arch-command.test.ts` 全部通过

## Required Corrections

- [x] [artifact_fix] `.verify-result.json` 证据指纹含 sync 已删除的 `.xirang/model/elements/semantic-browser.md`，checkFreshness=STALE 阻塞 archive；已持久化刷新后的 Phase 1 结果（evidenceFiles/evidenceFingerprintEntries 移除已删除模型单元、重算指纹、gitHeadCommit=ee4fdc765）
