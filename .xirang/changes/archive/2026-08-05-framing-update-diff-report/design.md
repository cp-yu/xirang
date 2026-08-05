## Context

`updateFraming`（`src/core/framing/workspace.ts`）目前是全量替换：新 payload 整体覆盖 `document.payload`，无任何"相对旧 payload 变化"的信号。协议虽要求 update 前先 `show`，但 CLI 本身不产出 diff，agent 凭记忆组合 replacement 时一旦漏掉此前已确认的目标即被静默删除（上下文遗忘），且无处可查。

协议文本存在双份：权威源是模板 `src/core/templates/workflows/explore.ts` 中的 `DEFINITION_FRAMING_REFERENCE` 常量，同步投影到 `.xirang/references/xirang-definition-framing.md`。`test/core/templates/definition-framing-reference.test.ts` 校验模板内容必须保留若干必备短语。

`src/core/framing/consume.ts` 已有 `normalizedCoverageTarget`（对 parents/children/sourceKinds/targetKinds 排序后 canonical 比较），可作为 modified 判定的复用基础。

## Goals / Non-Goals

**Goals:**
- `framing update` 返回标准三段式 diff（added / modified / removed），按四分区组织，使全量替换中的静默删除可见。
- 协议文本增加"先读后写 + 写后审查 diff"硬门，防止凭记忆重建 replacement。
- 保持 CLI 非阻塞：显式 REMOVED 与合法缩小范围不被拦截。

**Non-Goals:**
- 不做 CLI 阻塞式门禁（diff 只负责可见，不判定删除是否有意）。
- 不修改其他 framing commands 的 envelope 形状。
- 不持久化 diff（diff 只在 update 结果中返回，不写入 managed 文件）。

## Decisions

1. **diff 结构：标准三段式 + 四分区**。每个分区输出 `{ added, modified, removed }`；目标键 elements 与 Kinds 用 identity、relationships 用 source/kind/target 三元组。added 列目标键，modified 携带 before/after 完整前后内容（用户确认的形态，提供完整对比），removed 携带完整旧条目内容（document 只保存新 payload，被删内容只能从 diff 恢复）。
   - 备选：git 风格统一文本 diff。拒绝：与项目既有 add/modify/remove 语义不一致，且 JSON 结构更适合 agent 程序化消费。
2. **modified 判定复用 consume.ts 的 `normalizedCoverageTarget` 语义**：parents/children/sourceKinds/targetKinds 排序后 canonical 比较，避免数组顺序导致误报 modified。
   - 备选：直接 `JSON.stringify` 比较。拒绝：parents/children 顺序不同会误报。
3. **实现位置**：新增纯函数 `diffFramingPayloads(previous, next)` 于 `workspace.ts`（与 `updateFraming` 同文件，便于复用 payload 类型）；`updateFraming` 内部已持有新旧 payload，返回 `{ record, diff }`。`runUpdate` 将 diff 并入结果 `{ path, document, diff }`，status 保持 `ok`。
   - 备选：diff 单独模块 + 命令层二次读取。拒绝：多一次读取且 split 增加复杂度。
4. **非阻塞 + 无 diagnostics**：不新增 WARNING diagnostics（envelope 带 diagnostics 需 `invalid` 状态，会把已授权的写操作误标为失败）。diff 只入结果。
5. **协议文本双份同步修改**：模板 `explore.ts` 是权威源，投影 `.xirang/references/` 保持内容一致；保留 `definition-framing-reference.test.ts` 要求的全部必备短语。
6. **BREAKING 处理**：`updateFraming` 返回类型改为 `{ record, diff }`，同步更新 `workspace.test.ts`（`updated.record.document...`）。

## Risks / Trade-offs

- [返回类型变更破坏既有调用] → 仅 `runUpdate` 与 `workspace.test.ts` 消费 `updateFraming`，同步更新两处即可。
- [diff 与 consume 的 normalization 不一致导致覆盖判定偏差] → modified 直接复用 `normalizedCoverageTarget` 同一实现，保持单一路径。
- [协议双份漂移] → 模板是权威源，投影文件须同步；`definition-framing-reference.test.ts` 校验必备短语兜底。
