---
operation: ADDED
entity: element-declaration
identity: text-presentation
kind: capability
parent: view-presentation
title: Text Presentation
summary: 通过人类可读文本呈现 Views 的方法。
---

## ADDED Requirements

### Requirement: 以人类可读文本传达 View

Text Presentation SHALL 通过标题、段落、列表、表格或文本差异等人类可读形式组织并传达 View 的语义信息，使用户能够阅读、引用和审查该 View。

#### Scenario: 阅读 Change-derived View

- **WHEN** 系统以 Text Presentation 呈现一个 Change-derived View
- **THEN** 用户可从文本中识别该 View 组织的语义变化

### Requirement: 排除程序化结构数据

文本的排版、措辞与输出载体 SHALL 只服务于呈现且 SHALL NOT 构成规范性语义；仅供程序消费的结构化数据 SHALL NOT 属于 Text Presentation。

#### Scenario: CLI 返回 JSON IR

- **WHEN** CLI 输出仅供程序消费的结构化结果
- **THEN** 该结果不因采用文本编码而成为 Text Presentation
