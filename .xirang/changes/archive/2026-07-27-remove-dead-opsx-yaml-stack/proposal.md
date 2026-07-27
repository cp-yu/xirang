## Why

`src/utils/xirang-utils.ts` 实现 `.xirang/project.xirang.yaml` 与 `.xirang/changes/*/opsx-delta.yaml` 的旧 YAML 语义模型，围绕 `domains` + `capabilities` 二元节点结构（`src/utils/xirang-utils.ts:444-527`）。该结构已被 Hierarchical Elements 取代，文件自身在 `src/utils/xirang-utils.ts:292` 标注 `@deprecated Legacy YAML writer retained for migration compatibility`。

全仓核查确认它已无消费者：`readProjectOpsx`、`writeProjectOpsx`、`readXirangDelta`、`applyXirangDelta`、`hasXirangDeltaOperations`、`validateReferentialIntegrity`、`XirangDeltaSchema`、`ProjectOpsxFileSchema` 在 `src/` 内除定义文件自身外零引用。`src/core/relations/validator.ts` 与它构成闭合互引环：validator 的 `validateRelationGraph` 仅被 `src/utils/xirang-utils.ts:10` 调用，而 validator 又反向依赖 `src/utils/xirang-utils.ts` 的 `ProjectXirangBundle` 类型（`src/core/relations/validator.ts:2`）。环外无入口。

这批代码与后续存储重构无依赖关系，先行删除可降低后续 Change 的勘察与改动噪声。

## What Changes

- 删除 `src/utils/xirang-utils.ts`（596 行）。
- 删除 `src/core/relations/validator.ts`（106 行）。
- 删除 11 个 `xirang-utils` 测试文件与 `test/core/relations/validator.test.ts`，合计 2463 行。
- 逐个核查 `src/core/relations/registry.ts` 与 `src/core/relations/renderers.ts` 的导出，删除因上述删除而失去消费者的孤儿导出，并同步调整其测试。

不改变任何对外行为：被删代码无运行时入口，`xirang` 命令面与生成产物不受影响。

## 目标语义依据

本 Change 不引入新语义，不携带 Semantic Delta。目标语义由仓库根的 `xirang-definition.md` 与 `xirang-contract.md` 承载；本次删除的是这两份文档所定义结构之外的历史实现，与其无语义冲突。

## Impact

- 源码：`src/utils/xirang-utils.ts`、`src/core/relations/validator.ts` 删除；`src/core/relations/registry.ts`、`src/core/relations/renderers.ts` 按孤儿核查结果收缩。
- 测试：12 个文件删除；`test/core/relations/registry.test.ts`、`test/core/relations/renderers.test.ts` 随孤儿导出调整。
- 保留：`src/core/relations/active-registry.ts` 与 `renderRelationAuthoringReference` 服务 `src/commands/help.ts:2-3,74`，不在删除范围。

不在本 Change 范围：`src/core/update.ts` 与 `src/core/shared/skill-generation.ts` 的旧 skill 名清单，`.claude/`、`.codex/`、`.opencode/` 下的旧世代产物。二者已裁定不处理。
