## Why

当前 snack 指令容易被理解成“从 git diff 固定生成或更新某几个 artifact”，导致 agent 忽略会话上下文、commit/range 证据，以及已有 change 中 artifact 可能仅部分过旧的情况。需要把 snack 明确为 code-first artifact reconciliation workflow，让它在代码已写之后按证据源和现有 artifact 状态进行条件式创建/更新。

## What Changes

- 将 snack 的核心语义从 git-diff-only 同步改为 code-change evidence driven artifact reconciliation。
- 明确两个 snack 场景：已有代码但无 change 时创建 change；已有代码且 change 过旧时读取并按需 reconcile 现有 artifacts。
- 扩展 evidence sources：conversation context、working tree diff、staged diff、`git diff HEAD`、以及用户自然语言指定的 commit/range。
- 明确所有 snack artifacts（`proposal.md`、`design.md`、`specs/*/spec.md`、`opsx-delta.yaml`）均按 missing/stale/inconsistent/current 状态条件式创建或更新，且保留无关人工内容。
- 强化 generated snack skill 的测试覆盖，新增 focused template unit test，并增强 integration generated-skill assertions。
- 清理 snack 三个正式 specs 中的占位 Purpose 文案，不做全项目占位清理。

## Capabilities

### New Capabilities

### Modified Capabilities
- `snack-skill`: 明确 snack 的 artifact reconciliation 行为、evidence source 模型、已有 stale change 处理、conditional artifact update 规则，以及 delta specs 与 OPSX delta 的 ADDED/MODIFIED 术语边界。
- `snack-skill-generation`: 明确生成的 snack skill 必须包含 artifact reconciliation、broader evidence sources、conditional artifact update、template length/test expectations，并更新 description 语义。
- `snack-workflow-manifest`: 清理 snack workflow manifest spec 的占位 Purpose 文案；manifest runtime behavior 不变。

## Impact

- Affected source: `src/core/templates/workflows/snack.ts`。
- Affected tests: `test/integration/snack-workflow.test.ts` and new `test/core/templates/snack-template.test.ts`。
- Affected formal specs: `openspec/specs/snack-skill/spec.md`, `openspec/specs/snack-skill-generation/spec.md`, and Purpose cleanup in `openspec/specs/snack-workflow-manifest/spec.md`。
- No new dependency, CLI command, or runtime parser is introduced.
- Downstream compatibility boundaries to check: `src/core/specs-apply.ts`, `src/core/change-sync.ts`, and `src/core/templates/fragments/opsx-fragments.ts`.
