---
element: project.root/domain.architecture/cap.architecture.bootstrap
---

## REMOVED Requirements

### Requirement: Bootstrap docs and workflow templates SHALL describe only the CLI-backed five-phase flow
**Reason**: Project Build 使用 Agent-directed exploration 和四个 Candidate commands，取代 five-phase bootstrap lifecycle。

**Migration**: 使用 `opsx-build` 与 `opsx candidate init|status|validate|promote`。

### Requirement: Bootstrap contract surfaces SHALL stay consistent
**Reason**: bootstrap schema、phase projections、backfill 与 mode contracts 作为一套旧设计整体退役。

**Migration**: 使用 Project Build 与 Candidate CLI contracts。

### Requirement: Bootstrap 产出 SHALL 基于 bootstrap 工作区填充项目级元数据
**Reason**: Agent-authored `build.md` 和 Candidate Architecture/Specs 取代 workspace-derived metadata assembly。

**Migration**: 在 Candidate source 中编写 project intent，并在 promotion 前完成 validation。

### Requirement: Promote 后 bootstrap 工作区 SHALL 保留，不得主动删除
**Reason**: `.opsx/bootstrap/` 被删除；successful Candidate promotion 仅在 formal source 和 history 完成后删除 active Candidate。

**Migration**: 从 `.opsx/history/builds/` 读取 promotion history。

### Requirement: Completed retained workspace SHALL expose explicit restart guidance
**Reason**: retained bootstrap lifecycle state 不再存在。

**Migration**: `opsx candidate status` 报告 single active Candidate 与 explicit restart guidance。

### Requirement: Bootstrap 文档示例 SHALL 使用当前 schema 字段
**Reason**: Bootstrap phase schema 与其 examples 被删除。

**Migration**: 遵循 Candidate file definitions 与 generated `opsx-build` skill。

### Requirement: Bootstrap generated artifacts SHALL consume runtime projection
**Reason**: CLI-generated Candidate prose 和 review artifacts 被删除；Candidate source 改由 Agent 直接编写。

**Migration**: Generated skill surfaces 继续通过 workflow generation contract 消费 runtime projection。

### Requirement: Bootstrap init-to-scan transition
**Reason**: Agent exploration 不再拆分为 public scan transition。

**Migration**: 先初始化 Candidate，再由 `opsx-build` 自由选择探索顺序。

### Requirement: Bootstrap granularity selection
**Reason**: fixed coarse/fine semantics 错误耦合 element 与 Spec boundaries。

**Migration**: Agent 在 Candidate closure rules 下独立判断 element 和 Spec boundaries。

### Requirement: Bootstrap grouped spec source
**Reason**: `spec_groups` 是 shadow Spec source，因此被删除。

**Migration**: 直接编写全部 singular element-bound Candidate Specs。

### Requirement: Bootstrap completion validation
**Reason**: Completion 改为 Candidate validation、user digest confirmation、promotion 与 formal validation，不再使用 phase completion。

**Migration**: 运行 `opsx candidate validate`，promotion 后运行 `opsx validate --all --strict`。

### Requirement: Bootstrap relation authoring contract
**Reason**: Domain-map relation authoring 被删除；Agent 直接在 Candidate Architecture 中编写 typed relations。

**Migration**: 使用 versioned LikeC4 relation vocabulary 与 CLI validation。

### Requirement: Bootstrap phase file definitions
**Reason**: Phase-specific file definitions 随 bootstrap schema 删除。

**Migration**: 使用 Candidate workspace contract 和 `opsx candidate` commands。

### Requirement: Bootstrap phase instruction projection
**Reason**: `opsx bootstrap instructions` 与 fixed phase instruction projection 被删除。

**Migration**: `opsx-build` 负责 exploration guidance；CLI 负责 Candidate validation 与 promotion constraints。
