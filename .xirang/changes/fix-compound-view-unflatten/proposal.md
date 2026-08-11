## Why

`xirang view` 的默认 Model View 在 LikeC4 对 Element View 无条件执行 `unflatten` 预处理后布局失败：`unflatten` 的 disconnected-node chaining 改变深层 compound cluster 几何，使既有 Relationship edge 无法完成 Graphviz routing，最终整个 View 被丢弃，浏览器无图。问题随模型持续增长重复出现，此前缩短摘要的规避只是改变几何阈值，未消除根因。

## What Changes

修复后，具有 compound endpoint edges 的 Element View 不再经过 `unflatten` 预处理，直接以 LikeC4 生成的原始 DOT 进入官方 Graphviz layout，保证全部节点与 Relationship edges 的完整 routing；不引入用户配置开关、第二套 renderer 或手工 geometry。非 compound Element View 的现有布局行为保持不变。Model View 的整体宽度可能增加，属于正确性优先的预期取舍。

## Source Impact

### Behavior Source

#### New Specs

- None：不引入新的行为承载 Element。

#### Modified Specs

- `visual-presentation`：当 projection 包含 compound endpoint edges 时，跳过面向 disconnected nodes 的 `unflatten` chaining 预处理，直接使用原始 DOT 进入 Graphviz layout。

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- None：不改变 Element Declaration、层级或 Element Definition。

#### Removed Elements

- None

#### Architecture Relations

- None：Semantic Model 的 Relationships 与 Metamodel Kinds 保持不变。

## Impact

- `likec4/packages/layouts/src/graphviz/GraphvizLayoter.ts`：Element View 布局前对 compound views 跳过 `unflatten`。
- `likec4/packages/layouts` 测试：新增 `GraphvizLayouter` 单元测试，锁定 compound 跳过与非 compound 保留行为。
- `test/core/likec4/generator-validate.test.ts`：真实项目完整布局回归改为断言布局前后 node/edge identities 对齐且每条 edge 具有 routing points。
- 运行时行为：compound Model View 更宽；无 compound edges 的 Element View 布局不变。
- Semantic Browser 客户端、projection HTTP 协议与 manifest 不变化。
