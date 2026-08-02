---
entity: element-declaration
identity: delivery-validation
kind: capability
parent: project.root
title: Delivery Validation
definition: Delivery Validation 定义仓库当前维护的可执行交付面：Nix 打包/开发环境与 GitHub 跨平台验证工作流。它是项目自身的交付契约，作为 Project Root 的细化 Element 独立演进。
---

## Requirements

### Requirement: 版本化 Nix 交付面

Nix flake SHALL 声明用于构建息壤和进入其开发 shell 的 Node.js 与 pnpm 包。

#### Scenario: Nix 包或开发 shell 被求值

- **WHEN** 贡献者求值 package 或进入默认开发 shell
- **THEN** flake SHALL 提供其固定的 Node.js 与 pnpm 工具链
- **AND** SHALL 从锁定的 pnpm dependency closure 构建当前 package.json 版本

### Requirement: 跨平台 GitHub 验证

GitHub workflow SHALL 在 Linux、macOS 与 Windows 上、以其固定的 Node.js 与 pnpm 版本运行声明的 root 与 vendored 验证命令。

#### Scenario: 跨平台工作流运行

- **WHEN** pull request 或 main-branch push 触发验证
- **THEN** root install、identity audit、lint、build、tests 与 browser tests SHALL 在每个声明的操作系统上运行
- **AND** vendored install、typecheck、tests 与 build SHALL 在每个声明的操作系统上运行

### Requirement: 交付声明跟随可执行配置

交付文档与契约 SHALL 只描述 versioned flake 或 workflow 配置中存在的 job、命令、操作系统与工具版本。

#### Scenario: 交付配置变化

- **WHEN** Nix package、workflow job、命令、操作系统或固定工具版本被增删或改变
- **THEN** 相应交付契约 SHALL 在同一 Change 中调和
