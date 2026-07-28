---
entity: element-declaration
identity: change-closure
---

## ADDED Requirements

### Requirement: 原样归档 Change 制品

Archive SHALL 在适用门禁通过后原样移动 active Change directory，SHALL NOT 创建、重算、校验或覆盖任何 View presentation artifact。

#### Scenario: Change 不含持久化呈现结果

- **WHEN** 一个通过归档门禁的 active Change 不含 View presentation artifact
- **THEN** Archive 成功移动该 Change 且不创建额外呈现文件

#### Scenario: Change 含已有 legacy 文件

- **WHEN** 一个通过归档门禁的 active Change 含已有 legacy presentation file
- **THEN** Archive 随目录移动该文件并保持其内容字节不变
