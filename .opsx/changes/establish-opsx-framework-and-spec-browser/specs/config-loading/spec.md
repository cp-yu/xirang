## MODIFIED Requirements

### Requirement: Load project config from .opsx/config.yaml

系统 SHALL 读取并解析位于 `.opsx/config.yaml` 的项目配置文件，包括 `proseLanguage` 和 `docLanguage` 字段，其中 `proseLanguage` 优先。

#### Scenario: [MODIFIED] Valid config file exists

- **WHEN** `.opsx/config.yaml` 存在且包含有效 YAML 内容
- **THEN** 系统解析文件并返回 ProjectConfig 对象

#### Scenario: [MODIFIED] Config file does not exist

- **WHEN** `.opsx/config.yaml` 不存在
- **THEN** 系统返回 null，不报错

#### Scenario: [MODIFIED] Config file has invalid YAML syntax

- **WHEN** `.opsx/config.yaml` 包含格式错误的 YAML
- **THEN** 系统记录警告信息并返回 null

#### Scenario: [MODIFIED] Config file has valid YAML but invalid schema

- **WHEN** `.opsx/config.yaml` 包含有效 YAML 但 Zod schema 验证失败
- **THEN** 系统记录带验证详情的警告信息并返回 null

#### Scenario: proseLanguage field is valid

- **WHEN** config 包含 `proseLanguage: "中文"`
- **THEN** proseLanguage 字段包含在返回的配置中

#### Scenario: docLanguage field is valid (legacy)

- **WHEN** config 包含 `docLanguage: "zh-CN"` 且不包含 `proseLanguage`
- **THEN** 系统将 `docLanguage` 值迁移到 `proseLanguage` 字段

#### Scenario: Both proseLanguage and docLanguage are present

- **WHEN** config 同时包含 `proseLanguage: "中文"` 和 `docLanguage: "zh-CN"`
- **THEN** `proseLanguage` 优先，`docLanguage` 被忽略

#### Scenario: proseLanguage field is missing

- **WHEN** config 不包含 `proseLanguage` 和 `docLanguage`
- **THEN** 返回的配置中不包含 proseLanguage 覆盖

#### Scenario: proseLanguage field is invalid type

- **WHEN** config 包含 `proseLanguage: 123`（数字而非字符串）
- **THEN** 记录警告，proseLanguage 字段不包含在返回的配置中

#### Scenario: [ADDED] Config path uses .opsx on all platforms

- **WHEN** 系统在 Windows、macOS 或 Linux 查找项目配置
- **THEN** 系统 SHALL 使用 `path.join(projectRoot, '.opsx', 'config.yaml')` 构建路径
- **AND** SHALL NOT 硬编码斜杠分隔符

#### Scenario: [REMOVED] docLanguage field is missing

- **WHEN** config 缺少 `docLanguage` 字段
- **THEN** 不记录警告，返回的配置中不包含文档语言覆盖
