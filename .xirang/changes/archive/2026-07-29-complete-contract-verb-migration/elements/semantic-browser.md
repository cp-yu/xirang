---
entity: element-declaration
identity: semantic-browser
kind: capability
parent: interaction-surfaces
title: Semantic Browser
definition: 以 Views 可视化浏览 Semantic Model 与 Change-derived information 的界面。
---

## ADDED Requirements

### Requirement: 通过 Contract 接口加载 Element Contract

Semantic Browser SHALL 通过 Xirang-specific Contract loader、provider、tab 与 HTTP endpoint `/__xirang/contract` 加载和呈现 Formal Model 或活动 Change variant 中的 Element Contract，并 SHALL 在 public exports、runtime state、errors 与 test selectors 中使用 Contract 术语而不提供旧 Spec aliases。

#### Scenario: 加载 Formal Element Contract

- **WHEN** 用户在 Formal Model variant 中打开一个 Element 的 Contract tab
- **THEN** Browser 通过 `/__xirang/contract` 和 Contract loader 返回并呈现该 Element 的 `XirangContractContent`

#### Scenario: 加载活动 Change Contract

- **WHEN** 用户选择活动 Change variant 后打开一个 Element Contract
- **THEN** loader 携带所选 variant identity，并呈现 Expected Semantic Model 中的 Contract、diff 与 diagnostics

#### Scenario: Contract 不存在

- **WHEN** endpoint 对有效 project、element 与 variant 返回 Contract not found
- **THEN** loader 将该结果表示为无 Contract，而不是未处理异常

#### Scenario: 新请求替代旧请求

- **WHEN** 用户在前一个 Contract request 完成前切换 Element 或 variant
- **THEN** Browser 取消或忽略旧请求，且旧结果不得覆盖当前 Contract state

#### Scenario: 使用 Contract selectors

- **WHEN** 自动化测试或 Browser integration 定位 Contract tab 与内容
- **THEN** UI 暴露 `data-xirang-contracts` 与 `data-xirang-contract-content` selectors，且不暴露旧 `data-xirang-spec*` selectors

#### Scenario: 拒绝旧 Spec endpoint

- **WHEN** consumer 请求 `/__xirang/spec` 或导入 Xirang-specific Spec loader aliases
- **THEN** Browser protocol 与 public package exports 不提供旧接口
