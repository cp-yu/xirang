## MODIFIED Requirements

### Requirement: 项目工作区 SHALL 为 .opsx
目标项目的 OPSX durable workspace SHALL 位于项目根目录 `.opsx/`。Project Setup、Candidate 与 history 均 SHALL 使用该唯一 workspace，且 SHALL NOT 回退或双写其他目录。

#### Scenario: Setup 新项目
- **WHEN** 用户运行 `opsx setup`
- **THEN** 系统 SHALL 创建 `.opsx/` durable core
- **AND** SHALL NOT 创建 non-hidden legacy workspace

#### Scenario: 跨平台路径处理
- **WHEN** CLI 在 Windows、macOS 或 Linux 构建 `.opsx/` 路径
- **THEN** SHALL 使用 `path.join()` 或 `path.resolve()`
- **AND** SHALL NOT 硬编码路径分隔符

### Requirement: 工作区目录结构 SHALL 完整
`.opsx/` SHALL 包含 formal Semantic Model、change-local deltas、Agent references 和配置，并 MAY 按操作需要物化一个 active Candidate 与 durable history。

#### Scenario: 标准工作区结构
- **WHEN** 初始化 OPSX 项目
- **THEN** durable core SHALL 包含 `architecture/`、`specs/`、`changes/`、`references/` 和 `config.yaml`
- **AND** Project Build MAY 物化 `.opsx/candidate/`
- **AND** promotion 和 retired workspace cleanup MAY 物化 `.opsx/history/`
- **AND** SHALL NOT 物化 active `.opsx/bootstrap/`、`.opsx/bootstrap-history/` 或 `.opsx/migration-candidate/`

#### Scenario: History 不是 fallback source
- **WHEN** CLI 读取 formal Architecture 或 Specs
- **THEN** SHALL 只读取 `.opsx/architecture/` 与 `.opsx/specs/`
- **AND** SHALL NOT 从 `.opsx/history/` 自动恢复或补全 source

### Requirement: CLI 命令引用 SHALL 一致
所有 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active Specs SHALL 仅引用当前 `opsx --help` 暴露的命令与当前 managed skill names。

#### Scenario: Project Build command references
- **WHEN** active surface 描述 setup 或 Project Build
- **THEN** SHALL 使用 `opsx setup`、`opsx candidate init|status|validate|promote` 与 `opsx-build`
- **AND** SHALL NOT 使用 `opsx init`、`opsx bootstrap`、`opsx migrate` 或 `opsx-bootstrap-arch`

#### Scenario: Archive history 残留
- **WHEN** stale references 仅存在于 `.opsx/changes/archive/**` 或 `.opsx/history/**`
- **THEN** MAY 将其保留为历史证据
- **AND** active surfaces SHALL NOT 从这些文件生成 guidance

### Requirement: Telemetry command identity SHALL 为 opsx
Telemetry events SHALL 使用 `opsx` 作为 executable identity，并使用当前 command path 作为 command property。

#### Scenario: 记录 setup
- **WHEN** 用户执行 `opsx setup`
- **THEN** telemetry SHALL 记录 command `setup`
- **AND** SHALL NOT 记录 `init`

#### Scenario: 记录 Candidate subcommand
- **WHEN** 用户执行 `opsx candidate validate`
- **THEN** telemetry SHALL 记录完整 command path `candidate:validate`
- **AND** SHALL NOT 记录 Candidate paths、digest 或项目内容
