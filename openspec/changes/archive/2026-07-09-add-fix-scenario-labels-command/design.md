## Context

当前 scenario operation labels 已经由 parser/sync 支持，但生成职责散落在 workflow prompt 与 agent 推断中。用户确认的新边界是：agent 继续按 requirement-level delta 编写 change specs，scenario labels 由 OpenSpec CLI 在 validation 后自动处理，作为 sync/archive review metadata。

## Goals / Non-Goals

**Goals:**
- 新增 `fix-scenario-labels` 命令，支持 preview、write、json 三种使用面。
- 将 scenario label derivation 作为确定性核心逻辑复用到 CLI 命令与 sync 前处理。
- 调整 validate，使其保持只读结构校验，不要求 MODIFIED scenarios 预先带 label。
- 调整 propose/snack/specs 指引，只说明自动处理后的 label metadata，不让 agent 承担 scenario label authoring。

**Non-Goals:**
- 不改变 requirement-level delta sections 的 authoring contract。
- 不让 `openspec validate` 写文件。
- 不改变 formal specs 禁止包含 scenario operation labels 的规则。

## Decisions

### 共享 scenario-labels 模块

新增一个核心模块承载 preview/write 共用逻辑。它读取 change-local MODIFIED requirements 和对应 main spec requirement，用 label-free scenario title 与 normalized scenario body 计算建议：same title same body 保持无标签，same title different body 加 `[MODIFIED]`，change-only title 加 `[ADDED]`，main-only title 插入 `[REMOVED]` block 并保留 main spec body。

Alternative considered: 在 `fix-scenario-labels` command 内实现全部逻辑。Rejected because sync 也需要同一语义，会造成重复实现。

### sync 前自动补全 labels

`prepareChangeSync()` 在 validation 通过后、`buildUpdatedSpec()` 前调用共享 label write 逻辑。这样 archive 依赖 sync gate 即可获得同一行为，不需要 archive 再实现一次。

Alternative considered: 只在 propose/snack prompt 中调用命令。Rejected because direct `openspec sync` 会绕过 prompt。

### validate 保持 read-only

`validateChangeDeltaSpecs()` 继续校验 label 语法和 ADDED section 下非法 labels，但不因 MODIFIED section 下无标签 scenario 报错，也不写入 labels。

Alternative considered: validate 自动写 label。Rejected because validation 命令应作为 static analysis，CI 中不应修改工作区。

### prompt 只保留一句边界说明

workflow templates 和 specs artifact instruction 使用固定句：`Scenario operation labels are automatically handled by the OpenSpec CLI after validation and remain change-local review metadata for sync/archive review.`

Alternative considered: 在 prompt 中列出 `[ADDED]`/`[MODIFIED]`/`[REMOVED]` 判定表。Rejected because会重新把细粒度 diff 判断交给 agent。

## Risks / Trade-offs

- [Risk] 自动插入 `[REMOVED]` scenario block 会修改 change-local spec，可能让用户误以为 validate 修改了文件 → Mitigation: 仅 `fix-scenario-labels --write` 和 sync 前处理写入，validate 保持只读。
- [Risk] scenario body normalization 过强会漏判修改，过弱会产生噪音 → Mitigation: 首版使用保守的 normalized line ending + trim-end 比较，不做语义相等推断。
- [Risk] sync 前写 change-local spec 会影响 `.verify-result.json` freshness → Mitigation: sync 已刷新 evidence fingerprint；实现需把 label 写入纳入 sync 准备路径并测试 repeated sync 幂等。
- [Risk] 插入 removed scenario 的位置影响可读性 → Mitigation: 插入到 MODIFIED requirement block 末尾，并保证 repeated write 不重复插入。
