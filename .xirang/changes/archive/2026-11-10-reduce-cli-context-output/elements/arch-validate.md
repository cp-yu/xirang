---
entity: element-declaration
identity: arch-validate
kind: element
parent: deterministic-operations
title: "Arch Validate"
definition: "Arch Validate 定义 `xirang arch validate` 的行为：验证当前 Semantic Model 的四分区记法与语义、支持 `--delta` 选项对 change-local delta 做目标模型校验，且不修改 Formal source。"
---

## MODIFIED Sections

### Section: arch validate 命令 SHALL 验证模型记法

`xirang arch validate` SHALL 运行模型的记法解析与语义验证，报告语法与语义错误。

- **验证语法正确的模型**

  - 模型四分区语法正确
  - 运行 `xirang arch validate`
  - 成功且无问题时 SHALL 保持 stdout/stderr 为空，--json 同样适用
  - 退出码 SHALL 为 0

- **验证失败时显示错误**

  - 模型语法错误
  - 运行 `xirang arch validate`
  - SHALL 在 stderr 显示具体错误，--json 时使用结构化 JSON
  - 退出码 SHALL 为非零
