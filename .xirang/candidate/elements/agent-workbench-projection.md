---
entity: element-declaration
identity: agent-workbench-projection
kind: element
parent: project-tooling-configuration
title: Agent 工作面投影与同步
definition: Agent 工作面投影与同步是 CLI 中维护息壤托管的 Agent 工作面及其 instructions、templates 与 references 的能力。它通过共享 artifact sync engine 与 canonical workflow manifest 生成六个固定 workflow skills 与 internal subagent artifacts，将共享片段与 references 物化到项目本地，并保证生成产物的行为等价与长度约束。
---

## Requirements

### Requirement: 使用共享生成引擎

Setup 和 update SHALL 使用 shared artifact sync engine 与 canonical workflow manifest 生成受管 workflow skills 与 internal subagent artifacts，并收敛到六个 fixed workflow set。

#### Scenario: Setup/update 保持 parity

- **WHEN** setup 或 update 写入 workflow skills
- **THEN** 两者使用同一个 manifest-derived engine，且输出收敛到六个固定 workflow set

### Requirement: 物化共享片段与 references

Workflow skill 模板 SHALL 复用共享片段常量，并将长协议物化到 `.xirang/references/` 目录作为唯一物理位置；各工具 skill 目录 SHALL NOT 再包含 references 子目录。

#### Scenario: update 物化全部内置 reference

- **WHEN** 用户在已配置工具的项目中运行 `xirang update`
- **THEN** `.xirang/references/` 包含全部模板声明的 reference 文件
- **AND** 各工具 skill 目录不包含 references 子目录

#### Scenario: 前缀所有权边界

- **WHEN** update 写入 `.xirang/references/`
- **THEN** 只逐文件覆盖生成清单内的受管前缀文件，不执行目录级删除，不触碰用户文件

### Requirement: 保持生成产物行为等价

生成测试 SHALL 验证 manifest-derived projections 保持一致，且代表性 workflow/tool 组合的生成 skill artifacts 与已批准基线行为等价。

#### Scenario: 投影 parity 检查

- **WHEN** CI 运行模板生成测试
- **THEN** 检测缺失 exports 或缺失 workflow registration

### Requirement: 维护 internal subagent 制品

系统 SHALL 显式注册 `xirang-reviewer` 与 `xirang-optimizer` 两个 internal subagents，并按工具原生格式渲染与写入 subagent artifacts。

#### Scenario: 显式注册两个 internal subagents

- **WHEN** 读取 internal subagent 模板常量
- **THEN** 只包含 `xirang-reviewer` 与 `xirang-optimizer` 两个显式条目

#### Scenario: 写入路径遵循工具原生规范

- **WHEN** 为支持的工具生成 internal subagent artifact
- **THEN** 写入 `<projectRoot>/<agentsDir>/agents/<name>.<ext>`，不指向任何全局 agent 目录

### Requirement: 遵守生成行数约束

生成的 workflow `SKILL.md` 与 reference 文件 SHALL 分别不超过 200 行与 500 行。

#### Scenario: 超标报告

- **WHEN** 存在超标的 `SKILL.md` 或 reference 文件
- **THEN** 测试按文件分组报告变体、最大行数与超限行数，不汇总同一 skill 目录的总行数
