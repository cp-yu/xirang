## Remediation

- [x] [artifact_fix] 将 `test/commands/validate.enriched-output.test.ts` 归入 Task 1，确保 verb-first CLI 行为测试属于本 Change。
- [x] [artifact_fix] 将 `test/e2e/cleanup-generated-cache.ts` 归入 Task 4，确保 E2E 生成缓存的 teardown 属于本 Change。

### Task 1: 收敛 Verb-first CLI 与 Contract 校验契约

**Goal**: 让顶层 `show`、`list` 与 `validate` 承接全部有效能力，并删除 deprecated `xirang change` group 和旧 Contract CLI forms。

**Files**:
- Delete: `src/commands/change.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/commands/show.ts`
- Modify: `src/commands/validate.ts`
- Modify: `src/core/change-compiler.ts`
- Modify: `src/core/list.ts`
- Test: `test/commands/show.test.ts`
- Test: `test/commands/validate.test.ts`
- Test: `test/commands/validate.enriched-output.test.ts`
- Test: `test/core/change-compiler.test.ts`
- Test: `test/core/list.test.ts`
- Delete: `test/core/commands/change-command.list.test.ts`
- Delete: `test/core/commands/change-command.show-validate.test.ts`
- Delete: `test/commands/change.interactive-show.test.ts`
- Delete: `test/commands/change.interactive-validate.test.ts`

**Requirements**:
- 删除 `ChangeCommand` 与 noun-first group，不保留 forwarding alias
- `ShowCommand` 直接输出 compiler-derived Change view
- `ListCommand` 支持 `--long`，JSON 保持 `{ changes: [...] }` 并增加 `title` 与 `deltaCount`
- `ValidateCommand` 只接受 `--contracts`、`--type contract` 并输出 `type: "contract"`
- 保持 `xirang new change` 行为不变

#### Checks

- [x] C1 验证顶层 Show 与 List 编译结果
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Show 与 List 呈现 Change 编译结果" / Scenario "获取 Change JSON" / Scenario "获取稳定 Change 列表 JSON" / Scenario "获取详细 Change 文本列表" / Scenario "列出 Change Delta 数量" / Scenario "Change 编译失败"
  - Command: `pnpm exec vitest run test/core/change-compiler.test.ts test/commands/show.test.ts test/core/list.test.ts`
  - Expect: 顶层命令返回 compiler-derived fields，`list --json` 保持单一 envelope，`list --long` 展示完整详情

- [x] C2 验证唯一 Verb-first Change 入口
  - Verifies: `elements/deterministic-operations.md` / Requirement "使用 Verb-first CLI 与 Element Contract 术语" / Scenario "使用唯一 Change 操作入口" / Scenario "创建 Change 不受影响" / Scenario "拒绝旧公开形式"
  - Command: `pnpm exec vitest run test/commands/show.test.ts test/commands/validate.test.ts && ! rg -n '\bChangeCommand\b|[.]command[(].change.[)]|xirang change (show|list|validate)' src/cli/index.ts src/commands --glob '*.ts'`
  - Expect: root CLI 生产注册与命令实现不包含旧 group，负向 tests 证明旧 command 被拒绝，顶层命令与 `xirang new change` 保持可用

- [x] C3 验证 Element Contract 校验公开契约
  - Verifies: `elements/deterministic-operations.md` / Requirement "使用 Verb-first CLI 与 Element Contract 术语" / Scenario "校验全部 Element Contracts" / Scenario "按类型校验一个 Element Contract" / Scenario "拒绝旧公开形式"
  - Command: `pnpm exec vitest run test/commands/validate.test.ts`
  - Expect: tests 只使用 `--contracts`、`--type contract` 与 `type: "contract"`，旧 forms 被拒绝

### Task 2: 删除 Legacy Main-spec Stack 并迁移内部术语

**Goal**: 删除无生产职责的 main-spec parser/schema/validator，并把仍有效的 discovery、completion 与 task reference 代码迁移为 Contract/Element 命名。

**Files**:
- Delete: `src/core/parsers/markdown-parser.ts`
- Delete: `src/core/parsers/spec-structure.ts`
- Delete: `src/core/schemas/spec.schema.ts`
- Modify: `src/core/schemas/index.ts`
- Modify: `src/core/validation/validator.ts`
- Modify: `src/core/validation/constants.ts`
- Modify: `src/core/parsers/requirement-text.ts`
- Modify: `src/core/parsers/task-structure.ts`
- Modify: `src/utils/item-discovery.ts`
- Modify: `src/core/completions/completion-provider.ts`
- Modify: `src/core/completions/positional-types.ts`
- Modify: `src/core/completions/types.ts`
- Modify: `src/core/completions/generators/bash-generator.ts`
- Modify: `src/core/completions/generators/fish-generator.ts`
- Modify: `src/core/completions/generators/powershell-generator.ts`
- Modify: `src/core/completions/generators/zsh-generator.ts`
- Modify: `src/core/completions/templates/bash-templates.ts`
- Modify: `src/core/completions/templates/fish-templates.ts`
- Modify: `src/core/completions/templates/powershell-templates.ts`
- Modify: `src/core/completions/templates/zsh-templates.ts`
- Modify: `src/commands/completion.ts`
- Delete: `test/core/parsers/markdown-parser.test.ts`
- Delete: `test/specs/source-specs-normalization.test.ts`
- Delete: `test/core/validation.enriched-messages.test.ts`
- Modify: `test/core/validation.test.ts`
- Modify: `test/core/parsers/task-structure.test.ts`
- Modify: `test/core/completions/completion-provider.test.ts`
- Modify: `test/core/completions/positional-types.test.ts`
- Modify: `test/core/completions/introspect.test.ts`
- Modify: `test/core/completions/introspect-regression.test.ts`
- Modify: `test/core/completions/generators/bash-generator.test.ts`
- Modify: `test/core/completions/generators/fish-generator.test.ts`
- Modify: `test/core/completions/generators/powershell-generator.test.ts`
- Modify: `test/core/completions/generators/zsh-generator.test.ts`

**Requirements**:
- 删除 `MarkdownParser`、`findMainSpecStructureIssues()`、`SpecSchema` 与 `Validator.validateSpec*()`
- 保留 Formal Semantic Model parser、Element Contract validator 和共享 requirement helpers
- 将 `getSpecIds()`、cache、local variables 与 task reference helpers 改为 Contract/Element terminology
- 删除仅覆盖 legacy source specs 的测试，不删除 `.xirang/specs/**/spec.md` 数据
- 文件系统路径继续使用 Node.js `path` API

#### Checks

- [x] C4 验证 Formal Element Contract 解析未回归
  - Preserves: `.xirang/model/elements/semantic-model.md` / Requirement "使用 Element 存储单元" / Scenario "加载 Element 单元"
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts test/core/validation.test.ts test/core/parsers/task-structure.test.ts test/core/completions/completion-provider.test.ts && test ! -e src/core/parsers/markdown-parser.ts && test ! -e src/core/parsers/spec-structure.ts && test ! -e src/core/schemas/spec.schema.ts`
  - Expect: Formal Model 与 task verification 继续读取 Element Contract，legacy parser/schema files 不再存在

- [x] C5 验证内部 Contract identity discovery
  - Verifies: `elements/deterministic-operations.md` / Requirement "使用 Verb-first CLI 与 Element Contract 术语" / Scenario "校验全部 Element Contracts" / Scenario "按类型校验一个 Element Contract"
  - Command: `pnpm exec vitest run test/core/completions/completion-provider.test.ts test/commands/validate.test.ts && ! rg -n 'getSpecIds|specCache|specIds|MainSpec|SpecSchema|MarkdownParser|findMainSpecStructureIssues|validateSpec(Content)?' src test --glob '*.ts'`
  - Expect: discovery 与 completion 返回携带 Contract 的 Element identities，旧内部 symbols 已清除

### Task 3: 迁移 Diagram Contract API 与 Element Details UI

**Goal**: 将 `@likec4/diagram` 的 Xirang-specific loader public API、state、tab 与 selectors 完整迁移为 Contract 命名。

**Files**:
- Create: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Delete: `likec4/packages/diagram/src/xirang/SpecLoaderContext.tsx`
- Create: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx`
- Delete: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.tsx`
- Create: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.spec.tsx`
- Delete: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`
- Modify: `likec4/packages/diagram/src/index.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `likec4/packages/diagram/src/navigationpanel/NavigationPanelDropdown.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx`

**Requirements**:
- Export `XirangContractLoader`、provider 与 hooks，不导出旧 Spec aliases
- 使用 `ContractsTab`、Contract state 与 Contract controller names
- 保持 Formal/Change variant selection、diff、diagnostics 与 abort behavior
- 使用 `data-xirang-contracts` 和 `data-xirang-contract-content`
- 不修改 LikeC4 generic `Specification` domain types

#### Checks

- [x] C6 验证 Diagram Contract loader 与 variant behavior
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "加载 Formal Element Contract" / Scenario "加载活动 Change Contract" / Scenario "新请求替代旧请求"
  - Command: `cd likec4 && ./node_modules/.bin/vitest run --no-isolate packages/diagram/src/overlays/element-details/ContractsTab.spec.tsx packages/diagram/src/xirang/architectureView.spec.ts packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx`
  - Expect: public Contract loader、Formal/Change variants、diff 与 stale-request protection 均通过测试

- [x] C7 验证 Contract selectors 与 public exports
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "使用 Contract selectors" / Scenario "拒绝旧 Spec endpoint"
  - Command: `! rg -n 'XirangSpecLoader|SpecLoadState|XirangSpecLoadController|SpecsTab|data-xirang-spec' likec4/packages/diagram/src --glob '*.{ts,tsx}'`
  - Expect: Diagram source 只暴露 Xirang-specific Contract names 和 selectors

### Task 4: 迁移 Browser HTTP Protocol 与跨平台验证

**Goal**: 同步迁移 SPA consumer、Vite producer、HTTP endpoint、Windows CI 与 Browser E2E，保持 runtime Contract loading behavior。

**Files**:
- Create: `likec4/packages/likec4-spa/src/xirang/HttpContractLoader.ts`
- Delete: `likec4/packages/likec4-spa/src/xirang/HttpSpecLoader.ts`
- Create: `likec4/packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts`
- Delete: `likec4/packages/likec4-spa/src/xirang/HttpSpecLoader.spec.ts`
- Create: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.ts`
- Delete: `likec4/packages/vite-plugin/src/xirang/xirang-spec-handler.ts`
- Create: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`
- Delete: `likec4/packages/vite-plugin/src/xirang/xirang-spec-handler.spec.ts`
- Modify: `likec4/packages/likec4-spa/src/main.tsx`
- Modify: `likec4/packages/vite-plugin/src/plugin.ts`
- Modify: `playwright.config.ts`
- Create: `test/e2e/contract-browser.spec.ts`
- Create: `test/e2e/cleanup-generated-cache.ts`
- Delete: `test/e2e/spec-browser.spec.ts`
- Create: `test/fixtures/contract-browser/.xirang/model/**`
- Delete: `test/fixtures/spec-browser/.xirang/**`
- Modify: `.github/workflows/test-windows.yml`
- Modify: `package.json`

**Requirements**:
- SPA 只请求 `/__xirang/contract`
- Vite middleware 只注册 Contract endpoint 和 Contract handler/error names
- 保持 404-as-no-contract、invalid request、variant 与 abort behavior
- E2E 使用 Contract selectors 并覆盖实际 Contract 内容
- Windows CI 运行迁移后的 Browser tests 和 root build gates

#### Checks

- [x] C8 验证 HTTP Contract protocol
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "加载 Formal Element Contract" / Scenario "加载活动 Change Contract" / Scenario "Contract 不存在" / Scenario "拒绝旧 Spec endpoint"
  - Command: `cd likec4 && ./node_modules/.bin/vitest run --no-isolate packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`
  - Expect: SPA 与 Vite plugin 只共享 `/__xirang/contract`，并保持 404、variant 与 error contract

- [x] C9 验证 Browser E2E 与 Windows CI 清单
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "使用 Contract selectors" / Scenario "加载 Formal Element Contract"
  - Command: `pnpm test:e2e && rg -n 'HttpContractLoader\.spec\.ts|xirang-contract-handler\.spec\.ts|ContractsTab\.spec\.tsx' .github/workflows/test-windows.yml`
  - Expect: Chromium E2E 呈现实际 Contract，Windows workflow 引用迁移后的测试路径

### Task 5: 更新当前文档并执行完成门禁

**Goal**: 将当前用户与 Agent-facing generated-source 文档收敛到 Semantic Model 和 Element Contract 术语，并完成全量验证和一次性 residual scan。

**Files**:
- Modify: `docs/cli.md`
- Modify: `docs/architecture-integration.md`
- Modify: `docs/xirang-integration.md`
- Modify: `package.json`
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/completions/introspect-regression.test.ts`

**Requirements**:
- 当前文档只描述 Semantic Model、Element Contract、verb-first CLI 与 Contract endpoint
- package metadata 不再将 Xirang Contract browsing 描述为 specs browsing
- 只修改 generated Agent surfaces 的生成源，不直接编辑生成制品
- historical records、archives、`spec-driven` schema token 与 LikeC4 `Specification` 保持不变
- 不引入新依赖或平台特定路径处理

#### Checks

- [x] C10 验证当前文档与 template source
  - Verifies: `elements/deterministic-operations.md` / Requirement "使用 Verb-first CLI 与 Element Contract 术语" / Scenario "校验全部 Element Contracts" / Scenario "拒绝旧公开形式"
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/propose-template.test.ts test/core/completions/introspect-regression.test.ts && ! rg -n -- '--specs|--type spec|type: .spec.|xirang change (show|list|validate)' docs/cli.md docs/architecture-integration.md docs/xirang-integration.md src/core/templates package.json`
  - Expect: 当前文档、metadata 与 template generator source 只使用新公开 contract

- [x] C11 执行旧实现一次性 Residual Scan
  - Verifies: `elements/deterministic-operations.md` / Requirement "使用 Verb-first CLI 与 Element Contract 术语" / Scenario "拒绝旧公开形式"
  - Command: `! rg -n '\bChangeCommand\b|SpecSchema|MarkdownParser|findMainSpecStructureIssues|XirangSpecLoader|SpecsTab|HttpSpecLoader|XirangSpecError|/__xirang/spec|data-xirang-spec|getSpecIds' src docs/cli.md docs/architecture-integration.md docs/xirang-integration.md likec4/packages/diagram/src likec4/packages/likec4-spa/src likec4/packages/vite-plugin/src --glob '*.{ts,tsx,md}' --glob '!*.spec.*'`
  - Expect: 当前生产代码与当前用户文档不存在受控清单中的旧实现和公开 names；负向 tests MAY 保留旧字面量以证明拒绝行为

- [x] C12 执行全量质量门禁
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Show 与 List 呈现 Change 编译结果" / Scenario "获取 Change JSON" / Scenario "获取稳定 Change 列表 JSON" / Scenario "忽略旧 Change 语义来源"
  - Command: `pnpm lint && pnpm build && pnpm test && pnpm likec4:typecheck && pnpm likec4:test`
  - Expect: root 与 vendored LikeC4 的 lint、build、typecheck 和全部 unit tests 通过，且实现保持 macOS、Linux 与 Windows 兼容
