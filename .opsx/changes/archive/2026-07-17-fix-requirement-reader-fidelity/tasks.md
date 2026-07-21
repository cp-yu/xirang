## Actions

- A1: 新增共享 fence-aware requirement reader 模块
- A2: 将 Validator 与相关 parser 接到共享 reader
- A3: 补充 multi-line / fence / metadata / CRLF 回归测试

## Tasks

### Task 1: 实现共享 requirement reader 并接入校验

- **Goal**: 统一 delta/main 的 requirement 正文提取、`SHALL/MUST` 检测与 fence-aware surviving scenario 计数
- **Files**:
  - Create: `src/core/parsers/requirement-text.ts`
  - Modify: `src/core/validation/validator.ts`
  - Modify: `src/core/parsers/markdown-parser.ts`
  - Modify: `src/core/schemas/base.schema.ts`
  - Modify: `test/core/validation.test.ts`
  - Modify: `test/core/parsers/markdown-parser.test.ts`
- **Requirements**:
  - A1: 新增共享 fence-aware requirement reader 模块
  - A2: 将 Validator 与相关 parser 接到共享 reader
  - A3: 补充 multi-line / fence / metadata / CRLF 回归测试
- **Checks**:
  - [x] Check 1.1: RED 先写失败测试
    - Verifies: specs/cli-validate/spec.md / Requirement "Requirement reader SHALL be fence-aware for body and scenarios" / Scenario "Fence 内 Scenario 不计入 surviving"
    - Verifies: specs/cli-validate/spec.md / Requirement "Validation SHALL provide actionable remediation steps" / Scenario "跨行 body 上的 SHALL 或 MUST 被识别"
    - Command: `pnpm exec vitest run test/core/validation.test.ts -t "fence|multi-line|metadata-only|whole-word" 2>&1 | tail -40`
    - Evidence: 新增用例在实现前失败
    - Expect: 失败原因指向 first-line-only 或 fence 未跳过
  - [x] Check 1.2: 共享 reader 实现完整 body 与 fence 规则
    - Verifies: specs/cli-validate/spec.md / Requirement "Requirement reader SHALL be fence-aware for body and scenarios" / Scenario "Fence 后的正文用于 keyword 检测"
    - Verifies: specs/cli-validate/spec.md / Requirement "Validation SHALL provide actionable remediation steps" / Scenario "仅 metadata 行承载 MUST 正文"
    - Command: `pnpm exec vitest run test/core/parsers test/core/validation.test.ts 2>&1 | tail -50`
    - Evidence: `requirement-text.ts` 导出 body/keyword/fence helpers；validator 委托
    - Expect: multi-line、metadata-only、fence-after-body 用例通过

## Remediation

- [x] [code_fix] Main formal keyword path not on shared full-body whole-word reader (old includes + new containsShallOrMust coexist).
  - Requirement: Requirement reader SHALL be fence-aware for body and scenarios
  - Next: Wire validateSpec/applySpecRules or SpecSchema input to extractRequirementBody + containsShallOrMust for formal main keyword checks; keep MarkdownParser display first-line.
- [x] [code_fix] Design Decision 5 / proposal delta+main shared keyword not completed for formal SpecSchema path.
  - Requirement: Requirement reader SHALL be fence-aware for body and scenarios
  - Next: Add formal multi-line/whole-word regression via validateSpec/validateSpecContent; replace base.schema includes() or bypass it with shared body keyword check on raw content.
  - [x] Check 1.3: surviving scenario 保留 label 语义
    - Verifies: specs/cli-validate/spec.md / Requirement "Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels" / Scenario "非 fence 的 unlabeled scenario 与 fence 内示例并存"
    - Verifies: specs/cli-validate/spec.md / Requirement "Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels" / Scenario "全部真实 scenario 为 REMOVED 时仍失败"
    - Command: `pnpm exec vitest run test/core/validation.test.ts -t "surviving|REMOVED|fence" 2>&1 | tail -40`
    - Evidence: fence 内 scenario 不计；仅 `[REMOVED]` 时仍 ERROR
    - Expect: 相关用例全绿
  - [x] Check 1.4: CRLF 与 display 边界
    - Verifies: specs/cli-validate/spec.md / Requirement "Requirement reader SHALL be fence-aware for body and scenarios" / Scenario "CRLF 下 fence 与跨行 body 行为一致"
    - Command: `pnpm exec vitest run test/core/validation.test.ts test/core/parsers/markdown-parser.test.ts 2>&1 | tail -40`
    - Evidence: CRLF fixture 与 LF 判定一致；markdown display 仍 first-line
    - Expect: 全绿且无 formal write 路径改动
  - [x] Check 1.5: 变更校验通过
    - Command: `openspec validate --change fix-requirement-reader-fidelity --json`
    - Evidence: validate JSON 输出
    - Expect: `valid: true` 或仅 WARNING
