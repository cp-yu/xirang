# model-view-mode-orchestration — Design

## Context

`unify-candidate-change-modes` 将 Candidate 并入 Change Selection（reserved identifier `candidate`），`candidate-two-mode-presentation` 随后将 Candidate Mode 收为两态（默认 `complete`，`complete-with-diff` 收敛为 `complete`）。多次使用后确认根本问题：被浏览的三种对象——当前 Semantic Model、active Candidate、活动 Change 的 Expected Semantic Model——本质同构，都是"Model 实例"，把它们塞进 Change 维度导致编排语义持续扭曲（Candidate 特殊分支、非法组合收敛、URL 无法自解释）。同时 Authored View 的选择闭包在 manifest 构建期对 formal model 解析后套用于任意 source，target 实例中 REMOVED 的元素使 adhocView 引用失效，`include: '*'` 丢失目标实例新增元素。

本 Change 的结构性目标由 Definition Framing 确认并已 consume（`change-structural-definition.md`）：编排维度改为 Model × View × Mode，`model-view` 更名为 `full-model-view`（title "Full Model"）。

## Goals / Non-Goals

**Goals:**

- Model Selection 作为唯一编排入口：baseline（URL 省略）/ `model=candidate` / `model=change:<identity>`；Change 不再是独立编排维度。
- View Definition 对被浏览 Model 实例解析：manifest 构建期为 candidate 与每个 change source 生成实例级 `authoredViews` 解析结果；`'*'` = 实例全体、实例外 identity 丢弃、空解析不可选。
- Mode 统一三态、diff 语义 = 相对 baseline；默认值按 Model 值区分（Candidate `complete`、Change `complete-with-diff`）；恢复 Candidate `complete-with-diff`（服务端链路自 `unify` 起未删除，仅解除 Controller clamp）。
- `model-view` → `full-model-view`（identity + title "Full Model"）；运行时保留 view id `'model'` → `'full-model'`，路径段 `/view/model/` → `/view/full-model/`；labels `'Model View'`→`'Full Model'`、`'Candidate View'`→`'Candidate'`。
- 投影请求以 `model` 字段路由，删除 reserved `change === 'candidate'` 路由。

**Non-Goals:**

- 不改变 Candidate promotion、validation、`xirang candidate` 命令面。
- 不修复 `diff-only` 在超大规模 union 下的 Graphviz 容量问题（保留既有 candidate-only fallback）。
- 不为旧 URL（`change=*`、`view=model`）做重定向。
- 不改变 Authored View 的声明语法与持久化格式。

## Decisions

1. **Model 值域取代 Change 维度，而非新增第四维度。** Candidate 与 Change 的 expected target model 直接成为 Model Selection 的值；三组合仍是三维（Model × View × Mode），避免四维编排与"Change 是独立维度"的残留语义。备选"Model 维度 + Change 维度并存"被拒：同一被浏览对象出现两种编码路径。

2. **`model=candidate` / `model=change:<identity>` 单参数编码。** 一个状态维度一个 URL 参数，`change=` 参数删除。备选"`model=` 只装 baseline/candidate、change 值沿用 `change=`"被拒：一个维度两个编码参数需维护非法组合 clamp，且 URL 无法表达"change 也是一个 Model 值"。

3. **View 实例解析在 manifest 构建期完成，投影请求零解析成本。** `resolveViewSelection(view, targetModel)` 对 candidate 与每个 change 的 target model 重跑（纯内存、确定性），结果随 source 携带（`authoredViews` 字段）并同时驱动 Controller 的 View 下拉过滤。备选"投影期即时解析"被拒：Controller 无法在请求前判断空解析，下拉过滤失去依据。

4. **`model-view` 更名为 `full-model-view`，identity 与运行时保留值一并改名。** 判断依据是概念命名冲突（"Model View Mode 三维" vs "Model View 默认视角"、URL `model=` 与 `view=model` 双重含义），用户裁决要求连 identity 一起归位以避免后续误解。归档 Change Delta 中的历史 `model-view` 引用冻结为 provenance，不重写。

5. **Candidate 恢复三态，默认 `complete` 不变。** `complete-with-diff` 的服务端实现（target-only sources + overlay）自 `unify` 起一直在，仅删除 Controller 两态 clamp 与 Mode 选项过滤。在 Model 语义下"完整候选模型 + 相对 baseline 高亮"成立：增量候选是核心审查场景，全量重建候选退化为几乎全 ADDED 徽标——诚实但嘈杂，故默认保持 `complete`。

6. **收敛语义统一到 `semantic-browser`。** web 的"活动 Change 生命周期变化时收敛状态"与 semantic-browser 的"Candidate 生命周期变化时收敛状态"合并为"所选 Model 消失时收敛状态"（编排状态归 Semantic Browser 所有）；web 侧原 Requirement REMOVED。

7. **`test-change-derived-view` 的 Delta 目标随批改指 `full-model-view`。** 该活动 change 是浏览器 diff 渲染的测试数据，其 `elements/model-view.md` 与 relationship target 引用 `model-view`，与本次 REMOVED 冲突；在其自身 scope 内更新目标 identity，避免 Sync 后基线断链。

## Risks / Trade-offs

- [BREAKING URL 三处（`change=*`、`view=model`、`/view/model/` 路径）] → 既定无重定向文化；书签失效，e2e 全量改写。
- [manifest version 5 拒绝旧结构] → 开发环境重启 `xirang view` 即可，`assertXirangManifest` 显式报错，无静默迁移。
- [每 change × view 的实例解析构建成本] → 纯内存确定性计算，量级为 views × changes；watcher 增量粒度（onlyChange / onlyCandidate）不变。
- [全量重建 Candidate 的 `complete-with-diff` 满屏徽标] → 默认 `complete` 规避；需要高亮时用户显式切换。
- [`view-composition` Contract 中残留的 Derived View 措辞顺带修正] → 属于本 Change 语义范围（组成维度措辞同步），不扩大到其它历史残留。

## Test Maintenance

- 改写：`SemanticBrowserController.spec.ts`（model 轴状态机、clamp、默认 Mode、URL round-trip）、`xirang-projection-handler.spec.ts`（model 路由、实例级 view 边界、`'*'` 扩集、实例外 identity 丢弃）、`xirang-contract-handler.spec.ts`、`ContractLoaderContext.spec.tsx`、`searchParams.spec.ts`、`test/core/view.test.ts`（version 5、per-source authoredViews、labels）、e2e 全套（candidate-views、model-view、navigation-history、view-tree-export）。
- 删除：断言 `change=candidate` 深链、Candidate 两态收敛（`complete-with-diff`→`complete`）、`'Model View'` label、`view=model` URL 的用例。
- 新增：Candidate `complete-with-diff` 呈现与 overlay、空解析 View 隐藏、`model=change:<id>` 编解码、所选 Model 消失收敛。
- One-time Verification：按 `xirang-browser-testing` skill 顺序全链路验证（预构建 bundle 时序）；对 `test/fixtures/contract-browser` 的 candidate fixture 目视核查。

## Migration Plan

无数据迁移。代码与测试改写即生效，回滚需代码回滚。`test-change-derived-view` Delta 目标更新与本 Change 同批落地。
