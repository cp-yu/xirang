## Context

代码中存在三条与项目 Kind 数据无关的硬编码路径：

1. **`model-skeleton.ts`** 与 **`setup.ts`** 在初始化时自动注入 `element`、`domain`、`capability` 和 `perspective` 四个 Element Kind，并使 setup/update 的 extend 模式校验这些 Kind 的 identity 与内容是否与内置定义一致。
2. **`validator.ts`** 对 `perspective` Kind 的缺失或内容冲突分别发出 WARNING 与 ERROR，使框架绑定了项目级 Kind。
3. **`architectureView.ts`** 在 Browser overlay 中按 `declaration.kind === 'perspective'` 特判节点 shape 与颜色，使渲染层编码了项目特定 Kind 语义。

## Goals / Non-Goals

**Goals:**
- 新项目骨架只包含 Project Root Kind 与 Project Root Declaration，不注入任何非 root 业务 Kind。
- 删除所有按项目 Kind identity 内置的分支逻辑（校验、迁移、渲染）。
- Build 模板要求选择能准确表达 Element 语义的 Kind，拒绝仅因可验证而默认使用泛化 Kind。

**Non-Goals:**
- 不删除 Model 中已有的 `perspective`、`domain`、`capability` 等 Element Kind 数据——它们作为项目自定义 Kind 属于 Metamodel 数据。
- 不改动共享 fragment (`xirang-fragments.ts`、`opsx-fragments.ts`)。
- 不改动 LikeC4 核心层（节点渲染的通用 hex 颜色兜底保留）。

## Decisions

1. **Kind identity 不在框架层做任何特判**。`validator.ts` 中 `checkManagedPerspectiveKind` 整个删除；`architectureView.ts` 中 `PERSPECTIVE_SHAPE`、`perspectiveColor` 及按 `kind === 'perspective'` 分支全部删除。

2. **新模型 skeleton 最小化**。`model-skeleton.ts` 的 `MODEL_FILE_MANIFEST` 只保留 `project` Kind 与 `project.root` Declaration，不包含 `element`、`domain`、`capability`、`perspective` 等非 root Kind。

3. **Setup 不管理项目 Kind**。`setup.ts` 中 `ensureManagedModelFiles` 方法删除，不再在 extend 模式下自动补齐或校验受管 Kind。

4. **Build 从源头拒绝泛化 Kind**。`build.ts` 模板中 `Element Kind is a semantic label` 的指导扩充为 `prefer the most specific existing Kind that accurately expresses the Element; when none does, add or refine a Kind through the Metamodel`。

5. **Browser 渲染由模型数据驱动**。`architectureView.ts` 中所有节点按该节点在 Model View 中的 source 呈现，不因 Kind 名称改写 shape/color。

## Risks / Trade-offs

- 已有项目可能依赖框架自动注入 `perspective` Kind；本次变更后 setup/update 不再补齐，但已有模型不变，旧项目只需一次 sync 即可消除 WARNING。
- 用户需要自行管理 project-specific Element Kinds，这比框架自动注入增加了建模门槛，但换来框架与项目语义的解耦。