## MODIFIED Requirements

### Requirement: 内置 reference 物化到 .opsx/references 目录

系统 SHALL 将全部 skill reference 文件以 `opsx-<name>.md` 命名物化到项目级 `.opsx/references/` 目录，作为唯一物理位置；各工具 skill 目录（如 `.claude/skills/<skill>/`）SHALL NOT 再包含 `references/` 子目录。生成的 SKILL.md 中对该目录的引用 SHALL 附带显式 project-root 标记，区分于工具系统的 skill 目录相对路径解析规则。

#### Scenario: [MODIFIED] update 物化全部内置 reference

- **WHEN** 用户在已配置工具的项目中运行 `opsx update`
- **THEN** `.opsx/references/` SHALL 包含全部模板声明的 reference 文件，文件名为 `opsx-<name>.md`（如 `opsx-archive-commit-message.md`、`opsx-merge-summary-message.md`、`opsx-apply-phase2-optimization.md`）
- **AND** 每个文件内容 SHALL 与对应模板常量一致
- **AND** 各工具 skill 目录 SHALL NOT 包含 `references/` 子目录

#### Scenario: [MODIFIED] skill 指令引用项目级路径

- **WHEN** 读取生成的 skill `SKILL.md` 中对 reference 的引用
- **THEN** 引用路径 SHALL 为 `.opsx/references/opsx-<name>.md` 形式
- **AND** SHALL NOT 引用 skill 目录相对的 `references/<name>.md` 路径
- **AND** 引用 SHALL 附带 project-root 标记：inline 引用以 `project-root file` 前缀，列表引用以 `(project-root relative)` 后缀

#### Scenario: [MODIFIED] update 清理 skill 目录残留 references

- **WHEN** 项目中存在旧布局生成的 `.claude/skills/<skill>/references/` 目录
- **AND** 用户运行 `opsx update`
- **THEN** 系统 SHALL 按生成清单显式删除这些受管 skill 目录下的 `references/` 残留
- **AND** SHALL NOT 删除生成清单之外的用户文件

### Requirement: opsx 前缀作为 update 写入所有权边界

`opsx update` 对 `.opsx/references/` 目录 SHALL 只逐文件覆盖生成清单内的 `opsx-` 前缀文件，SHALL NOT 执行目录级删除，SHALL NOT 触碰任何非 `opsx-` 前缀文件。

#### Scenario: [MODIFIED] 用户自定义模板在 update 后幸存

- **WHEN** `.opsx/references/` 中存在用户创建的 `my-boundary.md`
- **AND** 用户运行 `opsx update`
- **THEN** `my-boundary.md` SHALL 原样保留
- **AND** `opsx-` 前缀文件 SHALL 被覆盖为最新模板内容

#### Scenario: [ADDED] 用户改动的 opsx 前缀文件被覆盖

- **WHEN** 用户手动修改了 `.opsx/references/opsx-archive-commit-message.md`
- **AND** 用户运行 `opsx update`
- **THEN** 该文件 SHALL 被覆盖为最新模板内容

#### Scenario: [REMOVED] 用户改动的 opsx 前缀文件被覆盖

- **WHEN** 用户手动修改了 `.opsx/references/opsx-archive-commit-message.md`
- **AND** 用户运行 `opsx update`
- **THEN** 该文件 SHALL 被覆盖为最新模板内容

### Requirement: git.commitMessage 路径覆盖路由

项目配置 SHALL 支持可选的 `git.commitMessage.boundary`、`git.commitMessage.archive`、`git.commitMessage.merge` 字符串字段，取值为项目根相对 POSIX 路径，指向用户自有 commit message 模板；已配置时消费方 SHALL 读取用户文件，未配置时 SHALL 读取 `.opsx/references/` 下对应内置模板。

#### Scenario: [MODIFIED] 配置路径覆盖时读取用户模板

- **WHEN** config 包含 `git.commitMessage.archive: .opsx/references/my-archive.md`
- **AND** archive 流程需要生成归档制品 commit message
- **THEN** agent 指令 SHALL 路由到读取 `.opsx/references/my-archive.md`
- **AND** SHALL NOT 读取 `.opsx/references/opsx-archive-commit-message.md`

#### Scenario: [MODIFIED] boundary 覆盖路由到用户模板

- **WHEN** config 包含 `git.commitMessage.boundary: .opsx/references/my-boundary.md`
- **AND** 消费方流程需要生成 implementation boundary commit message
- **THEN** agent 指令 SHALL 路由到读取 `.opsx/references/my-boundary.md`
- **AND** SHALL NOT 读取对应的内置模板

#### Scenario: [MODIFIED] 未配置时读取内置模板

- **WHEN** config 不含 `git.commitMessage.archive`
- **AND** archive 流程需要生成归档制品 commit message
- **THEN** agent 指令 SHALL 路由到读取 `.opsx/references/opsx-archive-commit-message.md`

#### Scenario: 非法路径被拒绝并回退

- **WHEN** `git.commitMessage.merge` 为绝对路径、包含 `..` 上溯、或使用反斜杠分隔
- **THEN** 配置加载 SHALL 输出 warning 指明非法路径
- **AND** SHALL 丢弃该字段并回退到内置模板路由

#### Scenario: [MODIFIED] Windows 上路径行为一致

- **WHEN** 在 Windows 上解析 `git.commitMessage.*` 配置与物化 `.opsx/references/` 文件
- **THEN** 系统 SHALL 通过 Node.js path 工具构建实际文件路径
- **AND** 配置值与 skill 指令中的路径 SHALL 保持 POSIX 正斜杠形式
- **AND** 行为 SHALL 与 Unix 系统一致
