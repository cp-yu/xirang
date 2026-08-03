---
entity: element-declaration
identity: model-view
kind: element
parent: derived-views
title: Model View
definition: Model View 是由当前 Semantic Model 确定性派生的默认 View，稳定 identity 为 `model`。其层级 focus 与导航历史属于运行时呈现状态，不形成额外 View。
---

## Requirements

### Requirement: 提供唯一默认 Model View

每个 Xirang 项目 SHALL 自动提供且只提供一个 identity 为 `model` 的 Model View；该 identity SHALL 为系统保留且 SHALL NOT 被 Authored View 使用。

#### Scenario: 打开项目模型

- **WHEN** 用户打开任意有效 Xirang 项目
- **THEN** View selector 包含唯一的 `Model View` 且其 identity 为 `model`

#### Scenario: Authored View 使用保留 identity

- **WHEN** Authored View 声明 identity `model`
- **THEN** 模型校验拒绝该声明

### Requirement: 从 Semantic Model 确定性派生

Model View SHALL 由完整 Semantic Model 确定性派生，并 SHALL NOT 持久化为 Authored View 或按 Element 生成其他 View identities。

#### Scenario: 相同模型重复生成

- **WHEN** Browser 对相同 Semantic Model 重建 Model View
- **THEN** 得到语义等价的单一 View 且不存在按 Element 生成的 View

### Requirement: 在单一 View 内维护层级焦点

Model View SHALL 以 Project Root 作为初始 focus，并在同一 View identity 内以 focus Element、direct children、展开集合内后代与当前层可表达的 Relationships 形成运行时投影；breadcrumb 与前进后退历史 SHALL 只改变 focus。下钻 SHALL 由区别于就地展开的显式交互触发，使两种浏览方式并存且互不替代。

#### Scenario: 下钻具有 children 的 Element

- **WHEN** 用户在 Model View 中以下钻交互进入一个具有 children 的 Element
- **THEN** Browser 保持 `model` identity 并以该 Element 更新 focus、投影与 breadcrumb

#### Scenario: 选择末端 Element

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 打开其 details 或 Contract 且不创建空 View

### Requirement: 支持就地展开层级

Model View SHALL 以一个属于该 View 的展开集合决定哪些可见 Element 就地呈现自身 children；展开集合 SHALL 独立于当前 focus，focus 变化与前进后退 SHALL NOT 重置它。展开一个 Element SHALL 使其成为容器并在其边界内完整包含自身 children，展开 SHALL 可逐层叠加至任意深度，且 SHALL NOT 改变 `model` identity 或产生其他 Views。

#### Scenario: 就地展开具有 children 的 Element

- **WHEN** 用户对当前层一个具有 children 的 Element 请求就地展开
- **THEN** Browser 保持当前 focus 与 `model` identity，并在该 Element 的边界内呈现其 children

#### Scenario: 展开状态跨 focus 变化保持

- **WHEN** 用户在展开若干 Element 后下钻或经 breadcrumb、前进后退改变 focus
- **THEN** 展开集合保持不变，新 focus 下位于该集合内的后代仍然就地展开

#### Scenario: 按层级深度批量展开

- **WHEN** 用户请求从当前 focus 展开至第 N 层
- **THEN** Browser 将 focus 之下第 1 至 N-1 层中具有 children 的 Element 置为展开，N 不大于 1 时展开集合为空
