## Why

Semantic Browser 的图片导出（PNG/JPG）与屏上内容不一致：用户下钻 focus 并就地展开后，导出的图片仍是"根 focus"投影（根 Element 与直接 children），既不含当前 focus 层级，也不含就地展开的后代。根因是导出页复用交互式 `LikeC4Diagram` 时，materialize 使用状态机默认上下文（根 focus、空展开、model 源、full 模式），且忽略 URL 的 `focus` 参数。这与 dot/mmd/drawio 的完整结构导出不一致，也无法满足"导出所见即所得"的预期。

## What Changes

让 Semantic Browser 的图片导出成为 WYSIWYG：通过现有导出入口（不新增、不删除任何选项），PNG/JPG 导出内容与当前屏上呈现一致——包含当前 source、full/diff 模式、当前 focus 及其就地展开的后代。实现上：交互视图把当前呈现状态（source、mode、focus、expanded 集合）镜像为导出快照，经 sessionStorage 传递给导出页，导出页用该快照播种状态机并应用 source/mode，使 materialize 一次产出与屏上相同的视图。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: 新增两个可观察行为——(1) “图片导出所见即所得”：PNG/JPG 导出必须反映当前 source、显示模式、focus 与就地展开状态，且不改变既有导出入口与选项；(2) “文件类导出保持完整模型结构”：dot、d2、mmd、puml、Draw.io 与层级树导出呈现完整模型结构、不反映当前 focus 与就地展开，该范围作为既定边界写入契约。

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- 浏览器端：`likec4/packages/likec4-spa`（ExportPage、Header）与 `likec4/packages/diagram`（状态机 input、DiagramActorProvider、LikeC4Diagram、XirangArchitectureOverlay、新增导出快照 store）。
- 行为：Model View 及 Candidate / Change / Diff 视图的 PNG/JPG 导出变为 WYSIWYG；无快照时（直接打开导出 URL）回退现状。文件类导出（dot/d2/mmd/puml/Draw.io/层级树）保持完整模型结构，作为既定范围在契约中记录。
- 无新增依赖；沿用 sessionStorage、XState 机器 input、html-to-image 既有机制。
- 验证需重建 SPA 与 xirang-likec4 bundle 后再跑 Playwright。
