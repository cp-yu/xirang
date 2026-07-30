---
entity: element-declaration
identity: metamodel
kind: capability
parent: semantic-model
title: Metamodel
definition: Semantic Model 使用的可扩展语义记法。
---

## ADDED Requirements

### Requirement: 管理内置 Perspective Kind

Metamodel SHALL 将 `perspective` 作为持久化且受 Xirang 管理的内置 Element Kind；新模型 SHALL 包含规范声明，旧模型缺失且尚未使用该 Kind 时 SHALL 保持可读并报告迁移 WARNING，已存在声明与内置定义冲突或被重定义时 SHALL 报告 ERROR。

#### Scenario: 新模型声明 Perspective Kind

- **WHEN** CLI 建立新 Semantic Model 或 clean Candidate
- **THEN** `metamodel` 分区包含符合内置定义的 `perspective` 声明

#### Scenario: 读取缺失声明的旧模型

- **WHEN** 旧模型未声明且未使用 `perspective`
- **THEN** Validator 保持模型可读并返回可操作的迁移 WARNING

#### Scenario: 内置声明发生冲突

- **WHEN** 模型中的 `perspective` 声明与内置 contract、parents、children 或共享语义不一致
- **THEN** Validator 返回 ERROR 且系统不覆盖该声明
