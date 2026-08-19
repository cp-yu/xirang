---
operation: MODIFIED
entity: element-declaration
identity: authored-views
kind: element
parent: view-composition
title: Authored Views
definition: Authored Views 是由用户显式声明并作为 Semantic Model 组成持久化的 Views。Authored View 记录用户选择的呈现视角，规定需要选择和组织的语义信息；其声明可以持续存在并具有稳定 identity，但不为其呈现的语义对象增加规范性语义。
---

## ADDED Requirements

### Requirement: 对被浏览 Model 实例解析

Authored View 的选择闭包 SHALL 对被浏览 Model 实例解析：`include: '*'` SHALL 选择该实例的全体元素；include 列表中不存在于该实例的 identity SHALL 不产生选择；解析结果为空的 View SHALL 在该 Model 上下文的 View Selection 中不可选。

#### Scenario: 全量 include 在 Candidate 上扩集

- **WHEN** 一个 `include: '*'` 的 Authored View 应用于含新增元素的 Candidate
- **THEN** 选择闭包包含该 Candidate 的全体元素，包括 baseline 中不存在的元素

#### Scenario: 实例外 identity 自然丢弃

- **WHEN** Authored View 的 include 列表包含被浏览 Model 实例中不存在的 identity
- **THEN** 该 identity 不产生选择，也不使投影失败

#### Scenario: 空解析不可选

- **WHEN** Authored View 对被浏览 Model 实例的解析结果为空
- **THEN** 该 View 在该 Model 上下文的 View Selection 中不可选

## MODIFIED Requirements

### Requirement: 参与统一层级浏览

Authored View SHALL 在单一 Web route 中作为 View Selection，并 SHALL 支持与 Model 相同的 focus、下钻、breadcrumb、就地展开、Model Selection 与 Presentation Mode；旧独立 Authored View route SHALL NOT 作为另一种呈现入口继续存在。

#### Scenario: 选择 Authored View

- **WHEN** 用户在 View Selection 选择一个 Authored View
- **THEN** Browser 在该 View 对当前 Model 实例的解析边界内呈现，并支持统一层级浏览交互
