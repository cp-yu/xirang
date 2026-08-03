---
entity: element-declaration
identity: change-creation
kind: element
parent: change
title: Change Creation
definition: Change Creation 定义创建与校验 Change 目录的规范：程序化创建 `.xirang/changes/<name>/`、拒绝重复与非法名称，并强制 kebab-case 命名约定。
---

## Requirements

### Requirement: Change Creation
系统 SHALL 提供程序化创建新 change 目录的函数。

#### Scenario: Create change
- **WHEN** 以合法名称调用创建函数
- **THEN** 系统创建 `.xirang/changes/<name>/` 目录

#### Scenario: Duplicate change rejected
- **WHEN** 创建同名 change 且该目录已存在
- **THEN** 系统抛出指示 change 已存在的错误

#### Scenario: Creates parent directories if needed
- **WHEN** `.xirang/changes/` 不存在
- **THEN** 系统创建完整路径（含父目录）

#### Scenario: Invalid change name rejected
- **WHEN** 以非法名称调用创建函数
- **THEN** 系统抛出校验错误

### Requirement: Change Name Validation
系统 SHALL 校验 change 名称遵循 kebab-case 约定。

#### Scenario: Valid kebab-case name accepted
- **WHEN** 校验 `add-user-auth`
- **THEN** 校验返回 `{ valid: true }`

#### Scenario: Numeric suffixes accepted
- **WHEN** 校验 `add-feature-2`
- **THEN** 校验返回 `{ valid: true }`

#### Scenario: Single word accepted
- **WHEN** 校验 `refactor`
- **THEN** 校验返回 `{ valid: true }`

#### Scenario: Uppercase characters rejected
- **WHEN** 校验 `Add-Auth`
- **THEN** 校验返回 `{ valid: false, error: "..." }`

#### Scenario: Spaces rejected
- **WHEN** 校验 `add auth`
- **THEN** 校验返回 `{ valid: false, error: "..." }`

#### Scenario: Underscores rejected
- **WHEN** 校验 `add_auth`
- **THEN** 校验返回 `{ valid: false, error: "..." }`

#### Scenario: Special characters rejected
- **WHEN** 校验 `add-auth!`
- **THEN** 校验返回 `{ valid: false, error: "..." }`

#### Scenario: Leading hyphen rejected
- **WHEN** 校验 `-add-auth`
- **THEN** 校验返回 `{ valid: false, error: "..." }`

#### Scenario: Trailing hyphen rejected
- **WHEN** 校验 `add-auth-`
- **THEN** 校验返回 `{ valid: false, error: "..." }`

#### Scenario: Consecutive hyphens rejected
- **WHEN** 校验 `add--auth`
- **THEN** 校验返回 `{ valid: false, error: "..." }`
