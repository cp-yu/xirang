### Task 1: 删除死导出 ARCHITECTURE_POST_PROPOSE_VALIDATION

**Goal**: 删除 `xirang-fragments.ts` 中无导入的 `ARCHITECTURE_POST_PROPOSE_VALIDATION` 导出及其过期 JSDoc，保持生成面与测试不变。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`

**Requirements**:
- 删除 `ARCHITECTURE_POST_PROPOSE_VALIDATION` 常量与 JSDoc
- 不删除 `VERIFY_SIMPLE_CHANGE_FAST_PATH`
- 生成 skill 输出与 parity 哈希保持不变

#### Checks

- [x] C1 验证删除后零引用
  - Preserves: `.xirang/model/elements/post-propose-validation.md` / Requirement "收尾确定性校验门禁" / Scenario "报错阻塞 Apply 就绪声明"
  - Command: `grep -rn "ARCHITECTURE_POST_PROPOSE_VALIDATION" src/ test/ .pi/skills/ || true`
  - Expect: 无匹配输出，门禁表述仅存于 propose 流程步骤 10

- [x] C2 验证构建与生成面不变
  - Preserves: `.xirang/model/elements/post-propose-validation.md` / Requirement "收尾确定性校验门禁" / Scenario "报错阻塞 Apply 就绪声明"
  - Command: `pnpm build && pnpm vitest run test/core/templates/skill-templates-parity.test.ts`
  - Expect: 构建通过且 parity 哈希测试全绿

### Task 2: validate 识别 .delta-noop 显式无 delta 标记

**Goal**: `xirang validate --change` 将 change-local `.delta-noop` 识别为显式无 delta 声明并豁免无 delta 报错。

**Files**:
- Modify: `src/core/validation/validator.ts`
- Test: `test/commands/validate.test.ts`

**Requirements**:
- 存在 `.delta-noop` 且四分区为空时，不报无 delta 错误
- 无标记且四分区为空时，仍报无 delta 错误
- specs 完成标记语义不变（instruction-loader 不受影响）

#### Checks

- [x] C1 验证标记豁免无 delta 报错
  - Verifies: `elements/validation-commands.md` / Requirement "无 delta change 的显式标记" / Scenario "标记存在时豁免无 delta 报错"
  - Command: `pnpm vitest run test/commands/validate.test.ts`
  - Expect: 新增豁免用例先 RED 后 GREEN

- [x] C2 验证无标记仍报错
  - Verifies: `elements/validation-commands.md` / Requirement "无 delta change 的显式标记" / Scenario "无标记且无 delta 时仍报错"
  - Command: `pnpm vitest run test/commands/validate.test.ts`
  - Expect: 无标记无 delta 的 change 仍报无 delta 错误
