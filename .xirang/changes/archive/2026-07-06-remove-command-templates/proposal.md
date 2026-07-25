## Why

命令模板（CommandTemplate）是 OpenSpec 历史上 `/opsx:<workflow>` slash-command workflow surface 的产物。该 surface 已被 skills-only 管线替代（`cap.ai.skill-generation`），但代码中残留了 4 个命令模板实现和相关的类型/导出/注册代码，形成死代码。

## What Changes

- 删除 4 个 `get*CommandTemplate()` 函数：apply、propose、archive、bootstrap-opsx
- 删除 `CommandTemplate` 接口及相关 import
- 删除 manifest 中的 `getCommandTemplate` 字段和注册
- archive 保留共享的 `buildArchiveInstructions()` 和 helper 函数
- 删除 apply-change.ts 中的 `APPLY_VERIFY_PHASES` 和 `APPLY_STRICT_TDD_IMPLEMENTATION` 死常量
- 在不修改 skill 模板内容的前提下更新所有测试

## Capabilities

### Modified Capabilities

- `cap.ai.skill-generation`: 命令模板函数/类型/注册已全部删除
- `cap.ai.template-artifact-pipeline`: CommandTemplate 类型已从类型系统中移除
- `cap.ai.propose-smart-routing`: propose 命令模板已删除，skill 模板不受影响
- `cap.apply.verify-integration`: apply 命令模板已删除，APPLY_VERIFY_PHASES 和 APPLY_STRICT_TDD_IMPLEMENTATION 死常量已删除
- `cap.archive.branch-merge`: archive 命令模板包装函数已删除，共享的 buildArchiveInstructions 保留
- `cap.opsx.bootstrap`: bootstrap-opsx 命令模板已删除

## Impact

- 文件：`src/core/templates/types.ts`（CommandTemplate 接口删除）
- 文件：`src/core/templates/manifest/types.ts`、`src/core/templates/manifest/registry.ts`（getCommandTemplate 删除）
- 文件：`src/core/templates/skill-templates.ts`（re-export 删除）
- 文件：`src/core/templates/workflows/*.ts`（4 个命令模板函数删除，死常量删除）
- 测试文件：7 个测试文件更新
- 无 skill 模板内容改动
