---
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## ADDED Requirements

### Requirement: 浮动 Change 面板可拖动

Semantic Browser 的浮动 Change 面板 SHALL 可通过面板头部拖动手柄在 diagram 容器内移动；拖动 SHALL NOT 触发 diagram 平移，且面板内控件交互（View source 选择、Full/Diff 切换、Plan 文档入口）SHALL 保持可用。面板位置是运行时呈现状态，SHALL NOT 持久化。

#### Scenario: 拖动 Change 面板

- **WHEN** 用户按住面板头部拖动手柄并在 diagram 容器内移动指针
- **THEN** 面板跟随指针移动
- **AND** diagram 视图 SHALL NOT 随之平移或缩放

#### Scenario: 面板内控件交互不受拖动干扰

- **WHEN** 用户点击面板内 View source 选择器、Full/Diff 切换按钮或 Plan 文档入口
- **THEN** 对应操作正常响应
- **AND** 该交互 SHALL NOT 启动面板拖动

#### Scenario: 刷新后面板位置复位

- **WHEN** 用户拖动面板后刷新页面
- **THEN** 面板回到默认位置
- **AND** 拖动位置 SHALL NOT 在会话间保留

#### Scenario: 拖动手柄带视觉提示

- **WHEN** 面板头部拖动手柄渲染
- **THEN** 头部 SHALL 显示 grip 图标与 grab 光标作为可拖动提示
- **AND** 提示 SHALL NOT 影响面板内控件交互

### Requirement: focus breadcrumb 可拖动

Semantic Browser 的 focus breadcrumb 导航 SHALL 可通过拖动手柄在 diagram 容器内移动，使用户可将它移开以避免遮挡编辑器控件；拖动 SHALL NOT 触发 diagram 平移，且 breadcrumb 内元素按钮的 focus 导航 SHALL 保持可用。

#### Scenario: 拖动 breadcrumb

- **WHEN** 用户按住 breadcrumb 拖动手柄并在 diagram 容器内移动指针
- **THEN** breadcrumb 跟随指针移动
- **AND** diagram 视图 SHALL NOT 随之平移或缩放

#### Scenario: breadcrumb 按钮仍可导航

- **WHEN** 用户点击 breadcrumb 内的元素按钮
- **THEN** 对应元素成为 focus
- **AND** 该点击 SHALL NOT 启动拖动

### Requirement: 静态渲染上下文不呈现浮动 Change 面板

Semantic Browser 的浮动 Change 面板与 breadcrumb 导航 SHALL 仅在交互式渲染中呈现；在静态渲染上下文——首页视图卡片、侧边栏视图悬停预览与 PNG/JPG 导出图——SHALL NOT 呈现。

#### Scenario: 首页视图卡片不显示浮动面板

- **WHEN** 首页渲染视图卡片网格
- **THEN** 每张卡片中的静态视图 SHALL NOT 显示浮动 Change 面板或 breadcrumb

#### Scenario: 侧边栏悬停预览不显示浮动面板

- **WHEN** 用户在侧边栏视图条目上悬停以显示预览
- **THEN** 预览 SHALL NOT 显示浮动 Change 面板或 breadcrumb

#### Scenario: 导出图不包含浮动面板

- **WHEN** 用户将视图导出为 PNG 或 JPEG 图像
- **THEN** 导出图像 SHALL NOT 包含浮动 Change 面板或 breadcrumb

#### Scenario: 交互式页面仍呈现浮动面板

- **WHEN** 用户在交互式页面（如 `/view/model/`）浏览 Change-derived View 或 Candidate
- **THEN** 浮动 Change 面板 SHALL 正常呈现且可拖动
- **AND** 面板行为与静态渲染无关
