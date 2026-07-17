## Context

[INFERRED FROM CODE] Artifact、Apply 与 Bootstrap instruction surfaces 分别由 schema、instruction loader 和 CLI renderer 组装；Propose、Snack、Bootstrap workflow templates 又重复了部分 authoring 顺序。重复 ownership 使字段增加或 workflow orchestration 改变时容易产生不一致。

## Goals / Non-Goals

**Goals:**
- 让 instruction projection 单一持有 definition-first 字段级 authoring contract。
- 让 text/JSON consumers 获得一致、只包含路径与状态的 current state。
- 让 Bootstrap state 与 file definitions 从正确 workspace 和 phase 解析。
- 让 Apply blocker 返回 schema 对应的 prerequisite workflow。

**Non-Goals:**
- 不改变 artifact dependency graph、completion detection 规则或 Schema 文件 ownership。
- 不改变 Propose 与 Snack 各自的 scenario label preview/write 策略。
- 不引入 Apply continuation guard、恢复状态机或新的 architecture capability。

## Decisions

1. [INFERRED FROM CODE] 在 instruction loader 提供共享 artifact/file-definition authoring builders，并将 schema-specific instruction 追加为独立 guidance。Workflow templates 只要求遵循返回的 `instruction`。继续在每个 workflow 复制 `content.includes`、`content.excludes` 与 `writePolicy` 会形成多 owner，因此不采用。
2. [INFERRED FROM CODE] `currentState` 仅包含 `completed`、resolved output paths 与可选 completion marker 的 path/presence。嵌入文件内容会扩大 prompt、混淆 source 与 state，并使 loader 承担不必要的 content ownership，因此不采用。
3. [INFERRED FROM CODE] `loadChangeContext` 在 schema resolution 后选择 workspace root：`spec-driven` 使用 change directory，`bootstrap` 使用 `openspec/bootstrap/`。保留统一 context API，同时避免 generic instruction path 从伪 change root 读取 Bootstrap state。
4. [INFERRED FROM CODE] Bootstrap CLI 的 text/JSON modes 共享同一 `fileDefinitions` 与 composed `instruction`，文本 renderer 先输出 `<file_definitions>` 再输出 `<instruction>`。Phase guidance 不复制 definitions。
5. [INFERRED FROM CODE] Apply blocker 使用 resolved schema 映射 prerequisite owner：Bootstrap schema 返回 Bootstrap，其他 built-in spec-driven path 返回 Propose。Apply 只消费 prerequisites，不生成自身输入。
6. [INFERRED FROM CODE] 通用 Specs artifact instruction 只禁止 Agent 手写 labels；Propose 的 preview-first 与 Snack 的 validate 后 write 继续由各自 workflow 持有。

## Risks / Trade-offs

- [Risk] `ArtifactInstructions` 增加 required `currentState` 可能影响直接构造该 interface 的内部调用者。→ [Mitigation] loader 统一构造该字段，并通过 loader、CLI text/JSON 与全量 tests 覆盖。
- [Risk] Consumer prompt 依赖返回 `instruction` 后，旧 CLI 与新 generated Skill 混用可能缺少字段级顺序。→ [Mitigation] generated Skills 与 canonical templates 同批刷新，并由 parity tests 保证一致。
- [Risk] Bootstrap generic artifact command 仍沿用 change-oriented CLI 入口。→ [Mitigation] state 明确从 Bootstrap workspace 解析；正式 workflow 继续使用 `openspec bootstrap instructions`。
