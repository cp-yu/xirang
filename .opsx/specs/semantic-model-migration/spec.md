# semantic-model-migration Specification

## Purpose
This specification records behavior introduced by change unify-opsx-semantic-model. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: Semantic Model migration SHALL 显式生成候选模型

系统 SHALL 提供从 legacy LikeC4 profile 到目标 language version 的显式 migration。Migration SHALL 生成独立 candidate files 与结构化 report，MUST NOT 原地静默改写 formal OPSX Semantic Model。

#### Scenario: 生成 versioned candidate
- **WHEN** 用户对 legacy model 启动 semantic model migration
- **THEN** 系统 SHALL 读取 legacy graph 与 formal Specs
- **AND** SHALL 在 candidate workspace 中生成目标 version 的 Project Root、Metamodel、elements、relationships 与 Spec bindings
- **AND** formal source SHALL 保持不变

### Requirement: Migration SHALL 只接受确定的 identity 与 binding

Migrator SHALL 仅转换能够由现有 canonical ID 或唯一 source mapping 确定的 `elementId` 与 Spec owner。文件名、目录名、import、call 或相似文本 MUST NOT 单独形成确定 binding。

#### Scenario: 唯一 mapping 自动迁移
- **WHEN** legacy capability ID 与 Spec mapping 均唯一且引用存在
- **THEN** candidate SHALL 生成一个稳定 `elementId`
- **AND** Spec candidate SHALL 使用 singular `element` binding

#### Scenario: 多 owner 或 orphan 形成 review gap
- **WHEN** Spec 对应多个 legacy capabilities、没有 owner、或引用不存在的 element
- **THEN** migration report SHALL 记录 review gap
- **AND** MUST NOT 自动选择 catch-all owner 或按文件名猜测 owner

### Requirement: Migration promotion SHALL 由完整验证和 human authorization 门禁

Candidate 只有在所有 review gaps 已解决、目标模型 validation 通过且用户授权后才 SHALL 原子 promotion。任何失败 MUST 保持 formal source 未改变。

#### Scenario: 未解决 gap 阻塞 promotion
- **WHEN** migration report 仍包含 unresolved identity、hierarchy 或 Spec binding gap
- **THEN** promotion SHALL 失败
- **AND** 错误 SHALL 列出需要 human decision 的 entries

#### Scenario: 授权后原子 promotion
- **WHEN** candidate 无 unresolved gaps、完整 validation 通过且用户确认 promotion
- **THEN** graph 与 contract modules SHALL 作为一个事务写入 formal model
- **AND** 任一写入失败 SHALL 回滚全部修改

### Requirement: Migration paths SHALL 跨平台且可审计

Migration SHALL 使用 Node.js `path.join()` 与 `path.resolve()` 构造 project、candidate、graph 和 Spec paths，并 SHALL 保留源 version、目标 version、resolved mappings 与 gaps 的 report。

#### Scenario: Windows candidate path
- **WHEN** migration 在 Windows path separator 环境执行
- **THEN** 所有 candidate 与 formal paths SHALL 通过 Node.js path API 解析
- **AND** report 中的 project-relative source references SHALL 保持可定位

