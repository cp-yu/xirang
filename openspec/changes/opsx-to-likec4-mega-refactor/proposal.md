## Why

当前 OpenSpec 使用 OPSX YAML (v2) 表达架构，存在以下痛点：(1) YAML 格式对人不够直观，缺少可视化；(2) 没有时间维度呈现（数据流、执行序列）；(3) Specs 调用关系不够明确。需要引入 LikeC4 作为架构源码格式，提供图形化架构视图、时间序列数据流呈现，并在 specs 中支持伪代码明确调用链。

## What Changes

**BREAKING**: 用 LikeC4 DSL 完全替代当前的 OPSX YAML 两文件模型作为架构语义源码。

核心变更：
- 架构源码从 `openspec/project.opsx.yaml` + `openspec/project.opsx.relations.yaml` 迁移到 `openspec/architecture/*.c4` 多文件结构
- 提供通用迁移工具 `openspec migrate opsx-to-likec4`，可用于任何 OpenSpec 项目
- 新增 `openspec arch` 命令组，支持查询、验证、预览和导出
- 更新 Agent workflow skills 以生成和使用 LikeC4 模型
- Specs 支持伪代码表达调用序列，可引用 LikeC4 element IDs
- LikeC4 使用 `precedes` relationship 表达时序依赖，在 views 中呈现数据流
- Specs 保持 requirement-level 灵活性，可使用 WHEN/THEN、伪代码或混合表达

## Source Impact

### Behavior Source

#### New Specs

- `migrate-opsx-to-likec4`: 从 OPSX YAML 两文件模型自动转换为 LikeC4 多文件结构的迁移工具行为
- `arch-query-command`: 查询 LikeC4 架构模型中的 elements 和 relations
- `arch-validate-command`: 验证 LikeC4 模型语法和 OpenSpec 语义约束
- `arch-preview-command`: 启动 LikeC4 web 预览服务器
- `arch-export-command`: 导出 LikeC4 架构图为图片格式
- `likec4-semantic-validator`: 补充 LikeC4 原生验证的 OpenSpec 语义检查（ownership、precedes cycle）
- `architecture-delta-artifact`: Change 中使用 LikeC4 DSL 表达架构增量
- `spec-pseudocode-support`: Specs 中伪代码表达调用序列，引用 LikeC4 element IDs

#### Modified Specs

- `init-project-structure`: 初始化项目时生成 `openspec/architecture/` 目录和 LikeC4 模板
- `openspec-propose-skill`: 生成 `architecture-delta.c4` 而非 `opsx-delta.yaml`
- `openspec-apply-skill`: 读取 LikeC4 架构上下文，理解伪代码中的 element ID 引用
- `openspec-bootstrap-opsx`: 重命名为 bootstrap-arch，输出 LikeC4 候选模型
- `openspec-impact-sweeper`: 使用 LikeC4 模型进行语义导航
- `validate-change`: 支持验证 `architecture-delta.c4` 文件
- `archive-sync-workflow`: 合并 `architecture-delta.c4` 到 formal LikeC4 模型

### Architecture Source

#### Added OPSX Nodes

- `cap.migration.opsx-to-likec4-converter`: 核心转换逻辑，将 OPSX domains/capabilities/relations 映射为 LikeC4 elements/relationships
- `cap.migration.likec4-file-generator`: 生成多文件 LikeC4 结构（specification.c4, domains/*.c4, views.c4）
- `cap.migration.spec-path-inference`: 从现有 specs 目录推断 spec 文件路径
- `cap.migration.agent-verification-workflow`: Agent 逐一验证迁移结果的完整性和正确性
- `cap.cli.arch-query`: 查询 LikeC4 模型中的 elements 和 directed relations
- `cap.cli.arch-validate`: 验证 LikeC4 语法和 OpenSpec 语义约束
- `cap.cli.arch-preview`: 启动 likec4 预览服务器
- `cap.cli.arch-export`: 导出架构图
- `cap.architecture.likec4-reader`: 读取和解析 LikeC4 多文件模型
- `cap.architecture.semantic-validator`: OpenSpec 特有的语义验证（ownership、cycle 检测）
- `cap.architecture.delta-merger`: 合并 architecture-delta.c4 到 formal LikeC4 模型

#### Modified OPSX Nodes

- `cap.cli.init-command`: 生成 LikeC4 架构目录结构而非 OPSX YAML
- `cap.cli.validate-command`: 增加 LikeC4 模型验证
- `cap.ai.propose-smart-routing`: 指导 Agent 生成 architecture-delta.c4
- `cap.ai.skill-generation`: 更新 propose/apply/bootstrap/sweeper skills 的 LikeC4 相关指令
- `cap.change-workflow.sync-reconciliation`: 合并 architecture-delta.c4 而非 opsx-delta.yaml
- `cap.validation.change-validation`: 验证 architecture-delta.c4 语法和语义

#### Removed OPSX Nodes

- `cap.opsx.yaml-reader`: LikeC4 reader 替代 OPSX YAML reader
- `cap.opsx.yaml-writer`: LikeC4 writer 替代 OPSX YAML writer
- `cap.opsx.relation-definition-registry`: LikeC4 specification.c4 定义 relationship kinds
- `cap.opsx.delta-yaml-merger`: 被 architecture-delta merger 替代

#### Architecture Relations

- 新增 migration domain 与 cli/architecture domains 的协作关系
- arch 命令组调用 architecture.likec4-reader 和 semantic-validator
- propose/apply skills 调用 architecture.likec4-reader 读取架构上下文
- validate-command 使用 architecture.semantic-validator 补充验证
- sync 流程使用 architecture.delta-merger 合并增量

## Impact

**代码影响**：
- 新增 `src/migration/` 目录：opsx-to-likec4 转换器、生成器、验证器
- 新增 `src/commands/arch/` 目录：arch 命令组实现
- 新增 `src/utils/likec4-reader.ts`：LikeC4 多文件读取和解析
- 新增 `src/utils/architecture-validator.ts`：OpenSpec 语义验证器
- 修改 `src/commands/init.ts`：生成 LikeC4 目录结构
- 修改 `src/commands/validate.ts`：增加 LikeC4 验证
- 修改 `.pi/skills/openspec-propose/SKILL.md`：architecture-delta.c4 生成指导
- 修改 `.pi/skills/openspec-apply/SKILL.md`：LikeC4 上下文读取指导
- 修改 `.pi/skills/openspec-bootstrap-opsx/SKILL.md`：重命名为 bootstrap-arch
- 修改 `src/utils/change-manager.ts`：处理 architecture-delta.c4
- 标记 deprecated：`src/utils/opsx-utils.ts` 中的 YAML 读写函数

**依赖变更**：
- 新增：`likec4@1.59.0` (devDependencies)

**数据影响**：
- 新架构源码位置：`openspec/architecture/`（多文件 .c4）
- 旧架构源码保留为 `.backup`：`openspec/project.opsx.yaml.backup`、`openspec/project.opsx.relations.yaml.backup`
- Change 中 `opsx-delta.yaml` 替换为 `architecture-delta.c4`

**工作流影响**：
- 迁移后 OpenSpec 自身使用 LikeC4 模型继续开发（自举）
- 所有 OpenSpec 项目需要运行 `openspec migrate opsx-to-likec4` 迁移到新架构格式
- Agent 需要学习 LikeC4 DSL 语法生成和理解架构
- Specs 可以包含伪代码引用 LikeC4 element IDs

**文档影响**：
- 更新 `AGENTS.md`：Specs + LikeC4 为持久语义源码
- 新增 `docs/architecture-integration.md`：LikeC4 集成指南
- 新增 `openspec/references/likec4-authoring.md`：LikeC4 DSL 编写参考
- 更新 `docs/workflows.md`、`docs/commands.md`：arch 命令组
- 新增迁移指南：针对现有 OpenSpec 用户
