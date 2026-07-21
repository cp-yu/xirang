## Context

当前 scenario labels 能力由 `fix-scenario-labels` 命令、`scenario-labels.ts` 中的 fix 命名 API，以及 `sync` 中的隐式写回共同承载。用户确认新边界：labels 是 validate 之后、sync 之前的显式 change review metadata，不是 validate/sync 的副作用。

## Goals / Non-Goals

**Goals:**
- 将公开 CLI surface 改为 `openspec scenario-labels <change>`。
- 删除 `fix` 术语和旧命令，不保留兼容 alias。
- 让 `sync` 不再修改 change-local specs 来添加 labels。
- 更新 workflow guidance，使 propose/snack 在 validate 后显式运行 scenario-labels。

**Non-Goals:**
- 不改变 formal spec 中 labels 被清洗/省略的语义。
- 不要求 sync 前必须存在 labels。
- 不新增 schema operation artifact。

## Decisions

- 使用直接重构而非兼容迁移：旧命令删除，避免两个入口长期并存。
- 核心 API 使用 `applyScenarioLabelsForChange` / `applyScenarioLabelsInContent`，保留 `previewScenarioLabelsForChange`。
- `sync` 继续用现有 delta merge normalization 消费 labels，但移除 `prepareChangeSync()` 中的 label write pass 和 `labelFiles` 输出。
- propose/snack guidance 顺序固定为 validate → `openspec scenario-labels "<name>" --write`，程序化 label 写入后不二次 validate。
- OPSX 用新能力 `cap.cli.scenario-labels` 替代 `cap.cli.fix-scenario-labels`，并移除 `cap.change.specs-sync` 对旧能力的依赖。

## Risks / Trade-offs

- [Breaking CLI] 删除 `fix-scenario-labels` 会破坏旧脚本 → 用户已明确要求直接重构。
- [Review metadata missing] agent 忘记运行 `scenario-labels` 时 review 信息缺失 → sync 仍允许继续，因为 labels 不是合入前置条件。
- [文案漂移] 多个 specs/templates 曾使用 “automatically handled after validation” → 通过 tests 和 `rg` 一次性验证清理。
