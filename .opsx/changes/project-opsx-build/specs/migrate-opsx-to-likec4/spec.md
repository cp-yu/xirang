## REMOVED Requirements

### Requirement: LikeC4 工具链 SHALL 使用兼容的 Node.js runtime
**Reason**: 该 Requirement 属于被删除的 migration command contract，不再作为独立 migration behavior 保留。

**Migration**: Supported runtime behavior 由 project delivery 与 validation contracts 覆盖。

### Requirement: 迁移命令 SHALL 读取 OPSX 两文件模型
**Reason**: 整个 migration command family 被删除。

**Migration**: Agent MAY 将 legacy files 作为 user-approved Build evidence 读取。

### Requirement: 迁移 SHALL 生成 LikeC4 多文件结构
**Reason**: Project Build 直接编写 Candidate Architecture。

**Migration**: 使用 `opsx-build`。

### Requirement: Specification 文件 SHALL 定义 element 和 relationship kinds
**Reason**: 被删除的 migration command 不再拥有 metamodel generation。

**Migration**: Candidate Architecture 定义 target metamodel。

### Requirement: Domain 文件 SHALL 包含嵌套的 capabilities
**Reason**: fixed legacy domain/capability taxonomy 不属于 Project Build contract。

**Migration**: Agent 使用 project-defined kinds 和 arbitrary-depth containment。

### Requirement: 转换 SHALL 保留所有 metadata
**Reason**: 不再保留 automatic migration conversion。

**Migration**: Agent 判断哪些 user-approved source facts 应进入 Candidate。

### Requirement: 转换 SHALL 推断 specs 路径
**Reason**: Spec paths 由 Agent 在 Candidate 中显式编写。

**Migration**: 使用 canonical `specs/<spec-id>/spec.md` paths。

### Requirement: 转换 SHALL 映射 semantic relations
**Reason**: Relations 在 semantic reasoning 后直接写入 Candidate Architecture。

**Migration**: 使用 typed Candidate relations 与 CLI validation。

### Requirement: 迁移 SHALL 生成基础 views
**Reason**: Candidate Architecture 为完整 target model 定义 views。

**Migration**: Agent 编写 `candidate/architecture/views.c4`。

### Requirement: 迁移命令 SHALL 支持 dry-run 模式
**Reason**: Migration command 被删除。

**Migration**: `opsx candidate validate` 提供 read-only Candidate check。

### Requirement: 迁移 SHALL 验证生成的 LikeC4 模型
**Reason**: Candidate validation 是唯一 programmatic validation boundary。

**Migration**: 运行 `opsx candidate validate`。

### Requirement: 迁移命令 SHALL 支持 agent-verify 选项
**Reason**: 不再保留 migration-specific reviewer 或 verification option。

**Migration**: Optional subagents 由 `opsx-build` 控制，且不是 promotion gate。

### Requirement: 迁移 SHALL 保留原始 OPSX 文件为 backup
**Reason**: Project Build history snapshots 取代 migration-specific backup behavior。

**Migration**: Previous formal source 在 promotion 时保存到 `.opsx/history/builds/<build-id>/previous/`。
