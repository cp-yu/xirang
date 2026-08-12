## Why

Semantic Browser 的实现长期背离模型承诺的 Authored View 行为：切换视图时 focus 镜像进入无限循环并饿死投影请求，Authored View 实际渲染 Model View 内容、选择边界失效；focus breadcrumb 仅对 Model View 呈现；投影边的关系详情因关系 id 跨模型实例不一致而无法解析。修复使实现回归既有规范承诺，不引入新的语义承诺。

## What Changes

修复 Semantic Browser 的 Authored View 交互链路：

- focus 镜像守卫与视图根初始化：视图外 actor focus 不再镜像回 controller，切换视图时以 Authored View 根作为初始 focus，消除渲染循环与投影饥饿，使 Authored View 按声明边界渲染
- focus breadcrumb 扩展到 Authored View：以视图根为起点、在视图边界内截断路径
- 服务端投影在 Authored View 分支支持就地展开
- Relationship popover 改由 `xirangRelations` 关系三元组元数据解析，不再依赖跨实例不一致的关系 id 查找
- 模型解析器跳过分区内点文件（VCS 占位约定），fixture candidate 补齐 `views/` 分区

无破坏性变更。

## Source Impact

- **Behavior Source**:
  - New Specs: None
  - Modified Specs: None
  - 说明：修复恢复 `semantic-browser`（保持 Authored View 声明视角、协调 View Selection 运行时状态、聚合当前层 Relationships、服务端计算 Runtime Projection）与 `authored-views`（参与统一层级浏览、形成 Descendants 选择闭包）已承诺的可观察行为，不新增或修改规范承诺。
- **Architecture Source**: None
  - 无 Element Declaration、Relationship、Kind 或 View 结构变化。

## Impact

- 代码：`likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`（focus 镜像）、`likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`（初始 focus 与 breadcrumb）、`likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.ts`（Authored View 展开）、`likec4/packages/diagram/src/likec4diagram/relationship-popover/`（xirang 关系解析）、`src/core/model/parser.ts` 与 `src/core/candidate/validator.ts`（点文件跳过）
- 测试：likec4 单元测试（mirrorActorFocus、投影 expanded、xirang-relations）、根仓库解析器测试、Playwright e2e（新增 Authored View 作用域与 breadcrumb 用例，candidate 4 例修复）
- 无新增依赖
