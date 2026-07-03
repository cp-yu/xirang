## Context

`openspec-snack` 目前被描述为从 `git diff` 反向生成或更新 specs 和 OPSX delta 的 code-first 工作流。实际使用中，用户可能已经在会话里说明了修改，也可能希望基于 staged diff、workspace diff、`git diff HEAD`，或某个 commit/range 回填 OpenSpec artifacts。当前模板还把已有 change 的处理写成 update in place，却没有说明如何读取旧 artifacts、如何判断哪些 artifact 需要更新、以及如何保护人工编辑内容。

本变更只调整 OpenSpec artifact 与 skill template 文案及测试，不引入新的 CLI parser、runtime freshness engine、依赖或命令语法。

## Goals / Non-Goals

**Goals:**
- 将 snack 定义为 code-first artifact reconciliation workflow。
- 明确两个场景：已有代码但无 change，以及已有代码且 change 过旧或不完整。
- 将 `git diff` 扩展为 code-change evidence collection，覆盖 conversation context、working tree diff、staged diff、`git diff HEAD`、自然语言指定的 commit/range。
- 明确所有 snack artifacts 都按 missing/stale/inconsistent/current 条件式创建或更新。
- 通过 integration test 和 focused template unit test 锁定 generated skill 的关键行为文本。
- 仅清理 snack 三个正式 specs 的占位 Purpose 文案。

**Non-Goals:**
- 不新增 snack CLI flag 或真实参数 parser。
- 不实现通用 artifact freshness engine。
- 不改变 `specs-apply.ts`、`change-sync.ts` 或 OPSX delta merge runtime semantics。
- 不清理项目中所有占位 Purpose 文案。

## Decisions

1. **使用 artifact reconciliation 作为 snack 主模型。**
   - 选择：snack 收集代码变更证据后，对 `proposal.md`、`design.md`、`specs/*/spec.md`、`opsx-delta.yaml` 做条件式 reconcile。
   - 理由：这同时覆盖“没有 change，需要创建”的场景和“已有 change 但 artifact 过旧”的场景，避免误导 agent 无条件重写任一 artifact。
   - 替代方案：把 snack 写成 specs-first update。该方案会再次造成“specs 必更新”的误解。

2. **使用 conversation-guided union 合并 evidence sources。**
   - 选择：conversation context 提供 scope/intent，代码证据提供文件、symbol 和行为事实；多个来源取相关并集，冲突或不确定内容标记 `[REVIEW NEEDED]`。
   - 理由：snack 是 agent skill，不是纯 CLI；用户当前上下文往往包含 diff 无法表达的意图。
   - 替代方案：显式 commit/range 或 git diff 优先。该方案更简单，但容易忽略会话中已经确认的修改意图。

3. **commit/range 作为自然语言 evidence selector。**
   - 选择：保留 `<change-name>`，允许用户用自然语言指定 commit、commit range、branch range 或“当前 staged diff”。
   - 理由：这符合 skill invocation 模式，不暗示 OpenSpec CLI 已经支持 `--range` 等 flag。
   - 替代方案：定义伪 CLI flags。该方案更可测试，但会制造不存在的 parser 预期。

4. **保持 runtime compatibility boundary。**
   - 选择：snack template 负责指导 agent 产出兼容现有 `ADDED/MODIFIED Requirements` 和 `opsx-delta.yaml` YAML keys 的 artifacts；不改 runtime parser/apply/sync。
   - 理由：现有 `specs-apply.ts` 已经定义 exact title matching、ADDED duplicate checks 和 delta operation semantics，本变更只让 snack 更清楚地遵守它们。

5. **测试断言关键短语而非 snapshot。**
   - 选择：新增 focused template unit test，同时增强 integration generated-skill assertions。
   - 理由：snack 文案是核心产物，但全文 snapshot 会让文案维护成本过高。

## Risks / Trade-offs

- Evidence sources 变多导致范围过宽 → 使用 conversation-guided union，并对冲突或不确定映射标记 `[REVIEW NEEDED]`。
- 自然语言 commit/range selector 被误解成 CLI flag → 明确写成 agent-parsed evidence selector，而非 command option。
- 旧 change 中人工内容被覆盖 → 指令要求先读取现有 artifacts，只更新 missing/stale/inconsistent 部分，并保留无关人工内容。
- Conditional update 规则过抽象 → 在模板和 spec 中显式列出 missing、stale、inconsistent、current 四种状态。
- `ADDED/MODIFIED` 术语混淆 → 区分 delta spec Markdown headings 与 `opsx-delta.yaml` YAML keys。
