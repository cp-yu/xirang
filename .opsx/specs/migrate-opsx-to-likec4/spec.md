# migrate-opsx-to-likec4 Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: LikeC4 工具链 SHALL 使用兼容的 Node.js runtime

OPSX SHALL 要求 Node.js `>=22.22.3`，与锁定的 `likec4@1.59.0` engine 合同一致。

#### Scenario: package 声明兼容的最低版本

- **WHEN** 安装 OPSX package
- **THEN** `package.json` 的 `engines.node` SHALL 为 `>=22.22.3`
- **AND** 安装文档 SHALL 声明相同最低版本

#### Scenario: 跨平台 CI 使用兼容 runtime

- **WHEN** Linux、macOS 或 Windows CI 安装依赖并运行 LikeC4 检查
- **THEN** CI SHALL 配置 Node.js `22.22.3` 或更高版本
- **AND** MUST NOT 使用低于 LikeC4 engine 合同的 Node.js runtime

### Requirement: 迁移命令 SHALL 读取 OPSX 两文件模型

迁移工具 SHALL 读取 `opsx/project.opsx.yaml` 和 `opsx/project.opsx.relations.yaml` 作为源架构模型。

#### Scenario: 读取完整的 OPSX 模型

- **GIVEN** 项目包含 `opsx/project.opsx.yaml` 和 `opsx/project.opsx.relations.yaml`
- **WHEN** 运行 `opsx migrate opsx-to-likec4`
- **THEN** SHALL 读取 project intent、所有 domains、所有 capabilities
- **AND** SHALL 读取所有 semantic relations（6 种类型）
- **AND** SHALL 保留所有 metadata（intent、boundary、status、note）

### Requirement: 迁移 SHALL 生成 LikeC4 多文件结构

迁移工具 SHALL 生成 `.opsx/architecture/` 目录，包含 specification.c4、按 domain 组织的模型文件和 views.c4。

#### Scenario: 生成标准目录结构

- **GIVEN** OPSX 模型包含 9 个 domains 和 115 个 capabilities
- **WHEN** 运行 `opsx migrate opsx-to-likec4`
- **THEN** SHALL 创建 `.opsx/architecture/specification.c4`
- **AND** SHALL 创建 `.opsx/architecture/domains/` 目录
- **AND** SHALL 为每个 domain 创建 `domains/<domain-id>.c4` 文件
- **AND** SHALL 创建 `.opsx/architecture/views.c4`
- **AND** 所有路径 SHALL 使用 `path.join()` 构建

### Requirement: Specification 文件 SHALL 定义 element 和 relationship kinds

`specification.c4` SHALL 定义项目使用的 element kinds 和 relationship kinds。

#### Scenario: 定义标准 element kinds

- **WHEN** 生成 `specification.c4`
- **THEN** SHALL 定义 `element domain`
- **AND** SHALL 定义 `element capability`
- **AND** SHALL 为每个 element kind 配置样式（shape、color）

#### Scenario: 定义 semantic relationship kinds

- **WHEN** 生成 `specification.c4`
- **THEN** SHALL 定义 `relationship invokes`
- **AND** SHALL 定义 `relationship consumes`
- **AND** SHALL 定义 `relationship precedes`
- **AND** SHALL 定义 `relationship constrains`
- **AND** SHALL 定义 `relationship validates`
- **AND** MUST NOT 定义 `relationship belongs_to`（使用嵌套表达）

### Requirement: Domain 文件 SHALL 包含嵌套的 capabilities

每个 domain 文件 SHALL 将其 capabilities 嵌套在 domain 内部，隐式表达 belongs_to 关系。

#### Scenario: 转换 domain 和 capabilities

- **GIVEN** OPSX 中 domain `dom.ai-integration` 包含 15 个 capabilities
- **AND** 每个 capability 有 `belongs_to: dom.ai-integration` relation
- **WHEN** 生成 `domains/ai-integration.c4`
- **THEN** SHALL 创建 `ai_integration = domain 'AI Integration' { ... }`
- **AND** SHALL 在 domain 内部嵌套所有 15 个 capabilities
- **AND** MUST NOT 生成显式的 `belongs_to` relationship
- **AND** element ID SHALL 使用 snake_case（`ai_integration`，非 `ai-integration`）

### Requirement: 转换 SHALL 保留所有 metadata

转换 SHALL 将 OPSX 的 intent、boundary、status 映射到 LikeC4 的 description 和 metadata。

#### Scenario: 保留 domain metadata

- **GIVEN** OPSX domain 包含 `intent` 和 `boundary`
- **WHEN** 转换为 LikeC4
- **THEN** SHALL 将 `intent` 映射为 `description`
- **AND** SHALL 将 `boundary` 保留在 `metadata { boundary '...' }`

#### Scenario: 保留 capability metadata

- **GIVEN** OPSX capability 包含 `intent` 和 capability ID
- **WHEN** 转换为 LikeC4
- **THEN** SHALL 将 `intent` 映射为 `description`
- **AND** SHALL 在 metadata 中保留 `capabilityId 'cap.domain.name'`

### Requirement: 转换 SHALL 推断 specs 路径

转换 SHALL 自动推断每个 capability 关联的 spec 文件路径，写入 metadata。

#### Scenario: 推断旧格式 spec.md

- **GIVEN** capability ID 为 `cap.ai.skill-generation`
- **AND** 存在 `.opsx/specs/skill-generation/spec.md`
- **WHEN** 转换该 capability
- **THEN** SHALL 在 metadata 中添加 `specs ['.opsx/specs/skill-generation/spec.md']`

#### Scenario: 推断新格式多个 .md 文件

- **GIVEN** capability ID 为 `cap.apply.task-executor`
- **AND** 存在 `.opsx/specs/task-executor/phase0.md` 和 `phase1.md`
- **WHEN** 转换该 capability
- **THEN** SHALL 在 metadata 中添加两个路径
- **AND** 路径 SHALL 使用 `path.join()` 构建

#### Scenario: Capability 无 spec 时返回空数组

- **GIVEN** capability 没有对应的 spec 目录
- **WHEN** 转换该 capability
- **THEN** MUST NOT 包含 `specs` metadata 字段

### Requirement: 转换 SHALL 映射 semantic relations

转换 SHALL 将 OPSX 的 6 种 relation types 映射为 LikeC4 relationships，belongs_to 除外。

#### Scenario: 转换 invokes relation

- **GIVEN** OPSX relation: `{from: 'cap.a.feature1', type: 'invokes', to: 'cap.b.feature2', note: 'Feature1 calls feature2'}`
- **WHEN** 转换
- **THEN** SHALL 生成 `feature1 -[invokes]-> feature2 { description 'Feature1 calls feature2' }`
- **AND** 使用 snake_case element IDs

#### Scenario: 跳过 belongs_to（隐式通过嵌套）

- **GIVEN** OPSX relation: `{from: 'cap.test.feature', type: 'belongs_to', to: 'dom.test'}`
- **WHEN** 转换
- **THEN** MUST NOT 生成显式 relationship
- **AND** feature SHALL 嵌套在 test domain 内部

#### Scenario: Cross-domain relation 使用全限定名

- **GIVEN** OPSX relation: `{from: 'cap.domain-a.feature-a', type: 'consumes', to: 'cap.domain-b.feature-b'}`
- **WHEN** 转换且两个 capabilities 属于不同 domains
- **THEN** SHALL 生成 `domain_a.feature_a -[consumes]-> domain_b.feature_b`
- **AND** relation SHALL 写入 canonical `.opsx/architecture/relations.c4`
- **AND** standalone relation storage SHALL avoid LikeC4 lexical shadowing by same-named nested capabilities

### Requirement: 迁移 SHALL 生成基础 views

转换 SHALL 生成 `views.c4`，包含全局架构视图。

#### Scenario: 生成 index view

- **WHEN** 生成 `views.c4`
- **THEN** SHALL 包含 `view index { title 'OPSX Architecture'; include * }`
- **AND** SHALL 使用 `autoLayout TopBottom`

### Requirement: 迁移命令 SHALL 支持 dry-run 模式

迁移命令 SHALL 提供 `--dry-run` 选项，预览生成的文件而不写入。

#### Scenario: Dry-run 显示预览

- **WHEN** 运行 `opsx migrate opsx-to-likec4 --dry-run`
- **THEN** SHALL 输出 "Preview of generated files"
- **AND** SHALL 显示每个将生成的文件路径和内容预览（前 500 字符）
- **AND** MUST NOT 创建任何文件

### Requirement: 迁移 SHALL 验证生成的 LikeC4 模型

迁移完成后 SHALL 自动运行 LikeC4 验证。

#### Scenario: 验证通过时输出统计

- **WHEN** 迁移完成
- **THEN** SHALL 运行 `npx likec4 validate .opsx/architecture/`
- **AND** 验证通过时 SHALL 输出迁移统计：
  - `✓ Migrated X domains`
  - `✓ Migrated Y capabilities`
  - `✓ Migrated Z relations`

#### Scenario: 验证失败时抛出错误

- **WHEN** 生成的 LikeC4 模型语法错误
- **THEN** SHALL 抛出错误并显示 likec4 验证输出
- **AND** MUST NOT 标记迁移成功

### Requirement: 迁移命令 SHALL 支持 agent-verify 选项

迁移命令 SHALL 提供 `--agent-verify` 选项，生成供 Pi 调用 `opsx-verify-migration` skill 的确定性验证 handoff。CLI 进程本身不拥有 Pi subagent runtime。

#### Scenario: Agent 验证完整性

- **WHEN** 运行 `opsx migrate opsx-to-likec4 --agent-verify`
- **THEN** SHALL 持久化声明 `skill: 'opsx-verify-migration'` 的结构化 handoff 到 `.opsx/architecture/migration-report.json`
- **AND** handoff SHALL 比较所有 domains 的 intent、boundary 与 status
- **AND** handoff SHALL 比较所有 capabilities 的 intent、status 与 Specs metadata
- **AND** handoff SHALL 比较所有 relations 的 direction、type 与 description
- **AND** Pi workflow SHALL 使用该 handoff 调用 `opsx-verify-migration` skill

### Requirement: 迁移 SHALL 保留原始 OPSX 文件为 backup

迁移默认 MUST NOT 删除原始 OPSX YAML 文件。

#### Scenario: 保留 OPSX 为 .backup

- **GIVEN** 存在 `opsx/project.opsx.yaml` 和 `opsx/project.opsx.relations.yaml`
- **WHEN** 运行 `opsx migrate opsx-to-likec4`
- **THEN** SHALL 重命名为 `project.opsx.yaml.backup` 和 `project.opsx.relations.yaml.backup`
- **AND** 原始文件 SHALL 保留至少 1 个月
