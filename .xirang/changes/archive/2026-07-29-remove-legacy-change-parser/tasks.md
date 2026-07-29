### Task 1: 迁移 Change 展示与列表

**Goal**: 让 Show JSON 与列表 Delta 数量只使用四分区 compiler 推导结果。

**Files**:
- Modify: `src/commands/change.ts`
- Modify: `src/commands/show.ts`
- Modify: `src/cli/index.ts`
- Test: `test/core/commands/change-command.show-validate.test.ts`
- Test: `test/core/commands/change-command.list.test.ts`

**Requirements**:
- Show JSON 输出 `id`、`title`、`valid`、`summary`、concise `entries` 与 `diagnostics`
- `deltaCount` 使用 compiler diff 的 `summary.total`
- List 中所有 Change 共享一次 Formal Semantic Model 解析
- 删除 `--deltas-only` 与 `--requirements-only`
- 所有路径继续通过 Node.js `path` API 构造

#### Checks

- [x] C1 验证 Change JSON 编译视图
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Show 与 List 呈现 Change 编译结果" / Scenario "获取 Change JSON" / Scenario "Change 编译失败"
  - Command: `pnpm exec vitest run test/core/commands/change-command.show-validate.test.ts`
  - Expect: 四分区 Change 返回 compiler summary、concise entries 和 diagnostics，旧 `deltas` 字段不存在

- [x] C2 验证 Change 列表实体级计数
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Show 与 List 呈现 Change 编译结果" / Scenario "列出 Change Delta 数量"
  - Command: `pnpm exec vitest run test/core/commands/change-command.list.test.ts`
  - Expect: `deltaCount` 等于四分区 compiler diff 的 `summary.total`

### Task 2: 删除旧 Change 解析栈

**Goal**: 删除以 Change Plan 和 change-local `specs/` 为语义来源的 parser、schema、converter 与 validation 分支。

**Files**:
- Delete: `src/core/parsers/change-parser.ts`
- Delete: `src/core/converters/json-converter.ts`
- Delete: `src/core/schemas/change.schema.ts`
- Modify: `src/core/parsers/markdown-parser.ts`
- Modify: `src/core/parsers/spec-structure.ts`
- Modify: `src/core/schemas/index.ts`
- Modify: `src/core/validation/validator.ts`
- Modify: `src/core/validation/constants.ts`
- Delete: `test/core/parsers/change-parser.test.ts`
- Delete: `test/core/converters/json-converter.test.ts`
- Modify: `test/core/parsers/markdown-parser.test.ts`
- Modify: `test/core/validation.test.ts`
- Modify: `test/core/validation.enriched-messages.test.ts`
- Modify: `test/core/archive.test.ts`
- Modify: `test/core/verify/freshness.test.ts`

**Requirements**:
- 删除 `ChangeParser`、`JsonConverter` 和旧 Change/Delta schema exports
- 删除 `MarkdownParser.parseChange()` 与旧 bullet Delta 推断
- 删除无生产调用的 `Validator.validateChange()` 与旧 Change validation rules
- 保留当前 Element Contract 与四分区 Change validation 行为

#### Checks

- [x] C3 验证旧 Change 语义来源已消失
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Show 与 List 呈现 Change 编译结果" / Scenario "忽略旧 Change 语义来源"
  - Command: `! rg -n 'ChangeParser|parseChangeWithDeltas|convertChangeToJson|ChangeSchema|DeltaSchema|DeltaOperationType|\.parseChange\(|validateChange\(' src test --glob '*.ts' && ! rg -n "\.xirang/changes/(?:<name>|c1)/specs|path\.join\(changeDir, ['\"]specs['\"]|changes/<name>/specs" src test --glob '*.{ts,md}'`
  - Expect: 源码与测试不再包含旧 parser、converter、schema 或 change-local `specs/` 解析路径

- [x] C4 验证现有 spec 与四分区 validation 未回归
  - Preserves: `.xirang/model/elements/deterministic-operations.md` / Requirement "在 Sync 前完整验证" / Scenario "Delta 无效"
  - Command: `pnpm exec vitest run test/core/parsers/markdown-parser.test.ts test/core/validation.test.ts test/core/change-compiler.test.ts`
  - Expect: 删除旧解析栈后，`MarkdownParser.parseSpec()` 与四分区 compiler/validation 测试继续通过

### Task 3: 更新公开文档并执行全量验证

**Goal**: 让 CLI 文档与构建产物只描述新的 Change JSON contract，并验证跨平台 TypeScript 实现。

**Files**:
- Modify: `docs/cli.md`
- Modify: `docs/architecture-integration.md`
- Modify: `docs/xirang-integration.md`
- Modify: `src/commands/change.ts`
- Test: `test/commands/show.test.ts`
- Test: `test/commands/validate.enriched-output.test.ts`

**Requirements**:
- 文档删除旧 delta-only flags 与旧 JSON 字段
- 文档解释 summary、entries、diagnostics 和 `valid: false` 语义
- 不引入新依赖或平台特定路径操作

#### Checks

- [x] C5 验证公开 CLI contract
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Show 与 List 呈现 Change 编译结果" / Scenario "获取 Change JSON"
  - Command: `pnpm exec vitest run test/commands/show.test.ts && ! rg -n -- '--deltas-only|--requirements-only' docs/cli.md src/cli/index.ts src/commands`
  - Expect: 文档、CLI options 与命令测试只公开新的 compiler-derived JSON contract

- [x] C6 验证构建与全量测试
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Show 与 List 呈现 Change 编译结果" / Scenario "获取 Change JSON" / Scenario "列出 Change Delta 数量" / Scenario "忽略旧 Change 语义来源"
  - Command: `pnpm build && pnpm test`
  - Expect: Node.js path API 保持 macOS、Linux 与 Windows 兼容，TypeScript 构建和全量测试全部通过
