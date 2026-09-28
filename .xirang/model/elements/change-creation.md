---
entity: element-declaration
identity: change-creation
kind: element
parent: change
title: Change Creation
definition: Change Creation 定义创建与校验 Change 目录的规范：程序化创建 `.xirang/changes/<name>/`、拒绝重复与非法名称，并强制 kebab-case 命名约定。
---

## Specification

### Section: Change Creation
系统 SHALL 提供程序化创建新 change 目录的函数。

- **Create change**
  - 以合法名称调用创建函数
  - 系统创建 `.xirang/changes/<name>/` 目录

- **Duplicate change rejected**
  - 创建同名 change 且该目录已存在
  - 系统抛出指示 change 已存在的错误

- **Creates parent directories if needed**
  - `.xirang/changes/` 不存在
  - 系统创建完整路径（含父目录）

- **Invalid change name rejected**
  - 以非法名称调用创建函数
  - 系统抛出校验错误

### Section: Change Name Validation
系统 SHALL 校验 change 名称遵循 kebab-case 约定。

- **Valid kebab-case name accepted**
  - 校验 `add-user-auth`
  - 校验返回 `{ valid: true }`

- **Numeric suffixes accepted**
  - 校验 `add-feature-2`
  - 校验返回 `{ valid: true }`

- **Single word accepted**
  - 校验 `refactor`
  - 校验返回 `{ valid: true }`

- **Uppercase characters rejected**
  - 校验 `Add-Auth`
  - 校验返回 `{ valid: false, error: "..." }`

- **Spaces rejected**
  - 校验 `add auth`
  - 校验返回 `{ valid: false, error: "..." }`

- **Underscores rejected**
  - 校验 `add_auth`
  - 校验返回 `{ valid: false, error: "..." }`

- **Special characters rejected**
  - 校验 `add-auth!`
  - 校验返回 `{ valid: false, error: "..." }`

- **Leading hyphen rejected**
  - 校验 `-add-auth`
  - 校验返回 `{ valid: false, error: "..." }`

- **Trailing hyphen rejected**
  - 校验 `add-auth-`
  - 校验返回 `{ valid: false, error: "..." }`

- **Consecutive hyphens rejected**
  - 校验 `add--auth`
  - 校验返回 `{ valid: false, error: "..." }`
