## Why

`ARCHITECTURE_POST_PROPOSE_VALIDATION` 是 `xirang-fragments.ts` 中的无导入导出，src 与 test 均无消费者；其内容与 propose 流程步骤 10 的收尾一致性验证门禁构成第二套表述，存在漂移风险。基线即存在，上一 Change 明确将其清理延后为本 follow-up。同时，清理暴露了框架文档与实现的不一致：`xirang instructions specs` 声称无 delta 时创建 `.delta-noop` 即可，但 validate 命令从未识别该标记，强制要求至少一个 delta 单元。

## What Changes

- 删除 `ARCHITECTURE_POST_PROPOSE_VALIDATION` 导出及其过期 JSDoc（"Used in: propose" 已失实）。
- validate 命令识别 change-local `.delta-noop` 为显式无 delta 声明，存在该标记时豁免无 delta 报错；无标记且无 delta 单元时仍报错。
- 不动 `VERIFY_SIMPLE_CHANGE_FAST_PATH`（被既有测试导入）；不改变任何生成 skill 输出、parity 测试或 CLI 其他行为。

## Source Impact

### Behavior Source

#### Modified Specs

- `validation-commands`: 新增 Requirement——validate 命令将 `.delta-noop` 识别为显式无 delta 声明并豁免无 delta 报错。

### Architecture Source

None

## Impact

- `src/core/templates/fragments/xirang-fragments.ts`: 删除 1 个无引用导出与 JSDoc。
- `src/core/validation/validator.ts`: 无 delta 检查识别 `.delta-noop` 标记。
- `test/commands/validate.test.ts`: 无 delta 标记豁免用例。
- 无生成面影响（删除方零导入，生成输出不变）。
