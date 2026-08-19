# model-view-mode-orchestration

## Why

Semantic Browser 的正交编排组合是 View × Change × Mode，其中 Candidate 以 reserved identifier `candidate` 挂在 Change Selection 中。多次使用后确认：Candidate 与 Change 的 Expected Semantic Model 本质是与当前 Semantic Model 同构的"被浏览模型实例"，把它们放在 Change 维度造成系统性扭曲——Candidate 复用三态 Mode 需要特殊分支与非法组合收敛、View Definition 锚定 formal model 解析（目标实例中 REMOVED 的元素导致投影失败、`include: '*'` 丢失目标实例新增元素）、URL 与首页入口无法自解释被浏览对象。

同时，`model-view` 这一 View 维度默认视角的命名与本次引入的 Model 维度直接冲突（"Model View Mode 三维"与"Model View 默认视角"持续互相干扰，URL 出现 `model=` 与 `view=model` 双重含义），需要连同名实一起归位。

## What Changes

- **BREAKING**：编排维度改为 **Model × View × Mode**。Model Selection 值域 = 当前 Semantic Model（baseline，省略编码）、active Candidate（`model=candidate`）、活动 Change 的 Expected Semantic Model（`model=change:<identity>`）；Change 不再是独立编排维度。
- **BREAKING**：URL 参数 `change=` 与保留值 `view=model` 废弃；View 默认保留值改为 `full-model`，路径段 `/view/model/` 同步改为 `/view/full-model/`；不做重定向。
- **BREAKING**：Element `model-view` 移除，由 `full-model-view`（title "Full Model"）取代；identity 与显示名（`'Model View'`→`'Full Model'`、`'Candidate View'`→`'Candidate'`）一并更新。
- View Definition 对被浏览 Model 实例解析：`include: '*'` = 当前实例全体元素，实例中不存在的 identity 自然丢弃；解析为空的 View 在该 Model 上下文的 View Selection 中不可选。解析在 manifest 构建期对 candidate 与每个 change 的 target model 完成。
- Mode 统一为语义"相对 baseline 的差异"：baseline 锁定 `complete`；Candidate 与 Change 三态（`complete` / `complete-with-diff` / `diff-only`），默认值按 Model 值区分（Candidate → `complete`，Change → `complete-with-diff`）；Candidate 恢复 `complete-with-diff`（删除两态收敛规则）。
- 投影请求以 `model` 字段路由（baseline / candidate / change），删除 reserved `change === 'candidate'` 路由；authored view 投影使用 source 携带的实例级解析边界。
- 首页三区不变：Candidate 卡片以 `model=candidate` 打开（省略 mode），Change 卡片以 `model=change:<name>&mode=diff-only` 打开。

## Source Impact

### Behavior Source

#### New Specs

- `full-model-view`: 对被浏览 Model 实例全体元素确定性派生的默认浏览视角——唯一保留 identity、确定性派生、层级焦点、就地展开、与 Model Selection 和 Presentation Mode 的正交组合。

#### Modified Specs

- `semantic-browser`: 三维正交组合从 View × Change × Mode 改为 Model × View × Mode；Model 值域、Mode 规则与默认值、View Selection 按当前 Model 实例解析结果提供可选项；Candidate 特殊选项与生命周期收敛要求被 Model 值域与"所选 Model 消失时收敛"取代。
- `view-composition`: 组成维度措辞从"由 Semantic Model 派生 Model View"改为"由被浏览 Model 实例派生 Full Model"，并清理残留的 Derived View 概念。
- `authored-views`: 新增对被浏览 Model 实例解析的选择语义（`'*'` 扩集、缺失 identity 丢弃、空解析不可选）；统一层级浏览的组合对象从 Change Selection 改为 Model Selection。
- `web`: 三维控件、首页入口 URL、Model 目标与差异呈现（Change/Candidate 两项要求合并为按 Model 值统一的三态语义）、URL 编码参数集、视口适配触发维度、所选 Model 消失时的状态收敛。
- `xirang-projection-service`: manifest version 4→5 且各 source 携带实例级 authored views 解析结果；投影请求按 `model` 路由并使用 source 级解析边界；Change 生命周期重建与 Definition 呈现的措辞换轴。
- `xirang-contract-delivery`: Contract 请求来源编码统一 model 轴——`source=candidate` 直连 `manifest.candidate.contracts`，删除 `source=change:candidate` reserved 编码。
- `xirang-diff-overlay`: Candidate 的 `complete-with-diff` 恢复激活差异标记，差异视觉表达与 Requirement 差异合并呈现的对象统一为非 baseline Model。

### Architecture Source

#### Added Elements

- `full-model-view`: 对被浏览 Model 实例全体元素派生的唯一默认全局浏览视角（parent: `view-composition`，title: Full Model）。

#### Modified Elements

- `semantic-browser`: 编排概念身份改为 Model × View × Mode 三维；Definition 表达 Model 值域（baseline Semantic Model / active Candidate / Change 的 Expected Semantic Model）与统一 Mode 语义。
- `view-composition`: Definition 从"由 Semantic Model 确定性派生 Model View"泛化为"由被浏览 Model 实例确定性派生 Full Model"，并声明 View 对被浏览实例解析。

#### Removed Elements

- `model-view`: 概念由 `full-model-view` 取代（identity 与 title 一并更名），避免与 Model Selection 维度持续命名冲突；层级位置与职责由新 Element 原位承接。

#### Architecture Relations

None

## Impact

- `src/core/view.ts`：manifest `version: 4→5`；`ViewRuntimeCandidateSource` / `ViewRuntimeChangeDerivedView` 增 `authoredViews`（对各自 target 实例重解析）；model source `id` 与 labels 更新（`'Full Model'` / `'Candidate'`）。
- `src/core/model/validator.ts`：authored view 保留 identity `'model'` → `'full-model'`。
- `likec4/packages/likec4-spa/src/searchParams.ts`：删 `change` 参数，增 `model` 参数，`view` 默认值 `'full-model'`。
- `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`：state/action/clamp/URL 同步/控件全部换 model 轴；View 下拉按当前 Model 解析结果过滤空解析项。
- `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.ts`：请求 schema 增 `model`、删 reserved candidate 路由；authored view 投影改用 source 级解析边界；diff-only union 与 fallback 条件换轴。
- `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.ts`、`likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`、`likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`（含 `ElementDetailsCard.tsx` tooltip）：source 路由与 label 换轴。
- `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`：首页卡片 URL 与 `viewId`。
- `.xirang/changes/test-change-derived-view/`：测试数据 change 的 Delta 目标 `model-view` → `full-model-view`（避免与本次 REMOVED 冲突）。
- 受影响测试：`SemanticBrowserController.spec.ts`、`xirang-projection-handler.spec.ts`、`xirang-contract-handler.spec.ts`、`ContractLoaderContext.spec.tsx`、`HttpContractLoader.spec.ts`、`searchParams.spec.ts`、`test/core/view.test.ts`、e2e（`semantic-browser-candidate-views.spec.ts`、`semantic-browser-model-view.spec.ts`、navigation-history、view-tree-export）全面改写。
