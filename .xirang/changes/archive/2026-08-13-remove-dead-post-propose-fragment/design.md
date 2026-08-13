## Context

上一 Change `propose-gate-restructure` 的 Phase 1 审查与 Phase 2 优化均确认 `ARCHITECTURE_POST_PROPOSE_VALIDATION` 为基线既有的死导出：src/test 零导入，`src/core/templates/index.ts` 无 barrel 重导出，`.pi` 生成面无引用；其内容与 `propose.ts` 步骤 10 的收尾门禁表述重复，属第二套易漂移表述。清理被一致裁定延后为本 follow-up change。

## Goals / Non-Goals

**Goals:**
- 删除 `ARCHITECTURE_POST_PROPOSE_VALIDATION` 常量及其 JSDoc。
- 保持生成 skill 输出、parity 哈希与 CLI 行为完全不变。

**Non-Goals:**
- 不删除 `VERIFY_SIMPLE_CHANGE_FAST_PATH`（被 `test/core/templates/fragments/xirang-fragments.test.ts` 导入，属在用导出）。
- 不接入任何调用方（接入会改变生成模板输出，需 Semantic Model 授权）。
- 不清理其他可能存在的死导出（超出本 change 范围）。

## Decisions

**D1：纯删除，不接入。**
理由：无导入方的死代码删除零行为影响；接入会改变 propose skill 生成输出与 parity 测试，属于新的语义决策，不在此次清理范围。

**D2：删除前 grep 确认零引用，删除后以 grep + build + parity 测试验证。**
理由：preservation constraint 要求证明删除不改变生成面；grep 零命中 + `skill-templates-parity.test.ts` 哈希不变是充分证据。

**D3：修复 `.delta-noop` 验证器缺口。**
理由：`xirang instructions specs` 文档承诺无 delta 时以 `.delta-noop` 标记完成 specs，但 `carriesSemanticDelta` 只扫四分区、从不读该标记，导致无 delta change 无法通过 combined validation——文档与实现矛盾在 `2026-07-27-migrate-artifact-schema-projection`（引入该标记的 change 自身无 delta）时即已存在。本次清理是无 delta change 的首个真实用例，一并修复：标记存在时豁免 `CHANGE_NO_DELTAS`，无标记行为不变。备选：不修验证器、把清理并入其他有 delta 的 change——被否，死导出无自然落点且矛盾继续存在。

## Risks / Trade-offs

- [删除后仍有隐藏引用导致构建失败] → 验证步骤先 grep、再 build、再跑 parity 测试，任一失败即回退。
- [JSDoc "Used in: propose" 误导后续维护者] → 随常量一并删除。
