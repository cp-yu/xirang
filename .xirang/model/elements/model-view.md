---
entity: element-declaration
identity: model-view
kind: capability
parent: derived-views
title: Model View
definition: Model View 是由一个项目的完整 Semantic Model 确定性派生、作为 Semantic Browser 默认入口的唯一模型浏览 View。它为整个模型提供连续的层级浏览视角；当前 focus、导航历史与布局属于运行时呈现状态，不产生其他 Views。它不替代 Authored Views，也不承担特定 Change 的差异视角。
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

Model View SHALL 以 Project Root 作为初始 focus，并在同一 View identity 内以 focus Element、direct children 与当前层可表达的 Relationships 形成运行时投影；breadcrumb 与前进后退历史 SHALL 只改变 focus。

#### Scenario: 下钻具有 children 的 Element

- **WHEN** 用户在 Model View 中进入一个具有 children 的 Element
- **THEN** Browser 保持 `model` identity 并以该 Element 更新 focus、投影与 breadcrumb

#### Scenario: 选择末端 Element

- **WHEN** 用户选择没有 children 的 Element
- **THEN** Browser 打开其 details 或 Contract 且不创建空 View
