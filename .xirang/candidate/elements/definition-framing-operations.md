---
entity: element-declaration
identity: definition-framing-operations
kind: capability
parent: deterministic-operations
title: Definition Framing Operations
definition: Definition Framing Operations 是 CLI 中管理 Change Structural Definition 的确定性操作集合。它通过 `xirang framing` commands 管理 Change Structural Definition 的持久化、查询、校验和生命周期转换，并根据其中记录的 Semantic Model 基准快照识别相关结构是否发生变化。
---

## Requirements

### Requirement: 管理完整结构生命周期

Definition Framing Operations SHALL 通过 `xirang framing create|list|show|status|validate|update|rename|consume|discard` 管理非空 Change Structural Definition 的完整 lifecycle。

#### Scenario: 首次持久化确认结构

- **WHEN** create 接收合法 slug 与完整 payload
- **THEN** CLI 生成 explorationId、捕获 Semantic Model baseline 并返回实际 managed path

### Requirement: 返回结构校验与设计影响

Framing validation SHALL 分别返回 structural validity、Semantic Model drift diagnostics 与 Contract、View 等 downstream impacts，SHALL NOT 代替 Agent 或用户作语义决策。

#### Scenario: 新 Element 需要 Contract

- **WHEN** 结构目标有效且其 Kind 要求 Contract
- **THEN** validation 保持结构有效并在 impacts 中报告后续设计工作

### Requirement: 隔离受控文件路径

Framing lifecycle SHALL 仅操作 canonical `.xirang/changes/` direct-child managed regular files，并通过合法名称、`lstat` 类型、symlink 拒绝、filename/frontmatter 一致性及 containment checks fail closed。

#### Scenario: Managed path 是 symlink

- **WHEN** 任一 framing command 定位到 symlink 而非 regular file
- **THEN** CLI 返回稳定路径错误且不跟随链接

### Requirement: 提供稳定 Framing JSON Contract

每个 `xirang framing` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes。

#### Scenario: Validation 发现相关 Drift

- **WHEN** command 成功读取对象但 relevant normalized context 已变化
- **THEN** JSON status 为 invalid、exit code 为 1 且不输出 spinner、颜色或 stack trace

### Requirement: 确定性消费结构来源

Framing consume SHALL 在 Change validation、relevant drift 与四类 Delta coverage 通过后，将源字节冻结为 `change-structural-definition.md`，并以相同副本恢复或相异副本冲突规则完成幂等 copy-then-delete。

#### Scenario: 上次消费在复制后中断

- **WHEN** 隐藏源与 frozen copy 同时存在且字节相同
- **THEN** CLI 重新校验后删除源而不覆盖副本
