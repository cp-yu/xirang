## Why

大模型总览中的名称过小、容器叠色较重，用户难以定位变化节点并阅读文本差异。已完成并经用户目视确认的浏览器优化需要与当前语义模型对齐。

## What Changes

- 按 zoom 分级呈现节点名称与摘要，增强嵌套容器标题及差异标记的可读性。
- 为 Full Model 采用带安全检查与收益阈值的兄弟单元折行择优。
- 提供变化对象列表、定位与详情入口，统一首页和差异面板计数。
- 改善字段及词级文本差异，补齐导航标题、Change breadcrumb 与交互式 minimap。
- 修复 Section diff 遗漏 Acceptance Cases 的既有合同实现缺陷。
- 按用户确认将新增细节组织为五个子 Element，并将本次八个目标 Contracts 统一为 4+N；通过独立 Kind 声明启用格式校验。

## Source Impact

### Behavior Source

#### New Specs

以下均为已确认呈现能力的子级精化，不扩大实现行为范围：

- `zoom-level-presentation`：缩放分级呈现，精化名称与摘要、容器标题及关系标签的尺度适配。
- `nested-container-presentation`：嵌套容器呈现，精化主题下的标题对比与填充上限。
- `full-model-layout-selection`：Full Model 布局择优，精化折行、安全检查与择优回退。
- `diff-overview-navigation`：差异概览与导航，精化分类计数、列表筛选、定位与详情。
- `text-diff-presentation`：文本差异呈现，精化字段与词级阅读及完整 Section diff。

#### Modified Specs

- `visual-presentation`：保留完整的父层呈现承诺，细节由三个子 Element 精化，Contract 整理为 4+N。
- `xirang-diff-overlay`：保留启用条件、操作标记和整体审阅承诺，由两个子 Element 精化概览与文本，Contract 整理为 4+N。
- `web`：当前视图标题与各 Model 的 breadcrumb、首页计数口径、minimap；保留其他独立 Sections，并补齐 4+N 结构。

### Architecture Source

#### Added Elements

- `zoom-level-presentation`、`nested-container-presentation`、`full-model-layout-selection`：parent 为 `visual-presentation`，按视觉呈现能力分解。
- `diff-overview-navigation`、`text-diff-presentation`：parent 为 `xirang-diff-overlay`，按差异审阅能力分解。

#### Modified Elements

- `visual-presentation`、`xirang-diff-overlay`、`web`：使用 `browser-specification` Kind；`xirang-diff-overlay` 的 Definition 明确涵盖概览、导航与文本审阅边界。

#### Removed Elements

None

#### Architecture Relations

None。现有 Relationships 与 Authored View declarations 保持不变。

#### Metamodel

- 新增 `browser-specification` Element Kind，声明 `contract: required` 与 `contractFormat: business-specification`，仅用于本次八个规格 Elements；不修改通用 `element` Kind。

## Impact

- 实现证据：`d9939b6bcc366bdf46b1d8e36868e0a5d01eff2b`。
- 涉及 vendored LikeC4 的 diagram、layouts、vite-plugin、SPA 首页和 styled-system，以及浏览器回归测试。
- 移除 `react-diff-viewer-continued` 依赖，采用本地文本比对；无源数据迁移或 CLI 参数变更。
- 本 Change 仅回填已完成实现的语义与设计，不生成执行任务清单。
