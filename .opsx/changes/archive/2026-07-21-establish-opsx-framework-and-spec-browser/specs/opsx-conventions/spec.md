## MODIFIED Requirements

### Requirement: Project Structure

OPSX 项目 SHALL 保持一致的目录结构用于 specifications 和 changes。

#### Scenario: [ADDED] 初始化项目结构

- **WHEN** 初始化 OPSX 项目
- **THEN** 它 SHALL 拥有此结构：
```
.opsx/
├── architecture/          # LikeC4 architecture intent and Spec indexes
├── specs/                 # Durable behavior source
│   └── [capability]/
│       ├── spec.md         # WHAT: behavior contract
│       └── design.md       # HOW (optional established pattern)
├── changes/               # Change-local compilation scaffolding
│   ├── [change-name]/
│   │   ├── proposal.md
│   │   ├── tasks.md
│   │   ├── design.md       # Optional lowering decisions
│   │   └── specs/
│   │       └── [capability]/spec.md
│   └── archive/            # Completed change history
├── references/            # Managed Agent workflow protocols
└── config.yaml            # Project configuration
```

#### Scenario: [REMOVED] Initializing project structure
- **WHEN** an OPSX project is initialized
- **THEN** it SHALL have this structure:
```
opsx/
├── project.md              # Project-specific context
├── AGENTS.md               # AI assistant instructions
├── specs/                  # Current deployed capabilities
│   └── [capability]/       # Single, focused capability
│       ├── spec.md         # WHAT: behavior contract
│       └── design.md       # HOW (optional, for established patterns)
└── changes/                # Proposed changes
    ├── [change-name]/      # Descriptive change identifier
    │   ├── proposal.md     # Why, what, and impact
    │   ├── tasks.md        # Implementation checklist
    │   ├── design.md       # Technical decisions (optional)
    │   └── specs/          # Delta requirements
    │       └── [capability]/
    │           └── spec.md # ADDED/MODIFIED/REMOVED/RENAMED requirements
    └── archive/            # Completed changes
        └── YYYY-MM-DD-[name]/
```

### Requirement: Verb–Noun CLI Command Structure

OPSX CLI 设计 SHALL 使用动词作为顶层命令，通过参数或标志提供名词进行范围界定。

#### Scenario: [ADDED] 动词优先命令发现

- **WHEN** 用户运行像 `opsx list` 这样的命令
- **THEN** 动词清晰传达动作
- **AND** 名词通过标志或参数细化范围（例如 `--changes`、`--specs`）

#### Scenario: [ADDED] 名词命令的向后兼容性

- **WHEN** 用户运行名词前缀命令如 `opsx spec ...` 或 `opsx change ...`
- **THEN** CLI SHALL 继续支持它们至少一个发布周期
- **AND** 显示指向动词优先替代方案的弃用警告

#### Scenario: [ADDED] 消歧义指导

- **WHEN** 项目名在 changes 和 specs 之间有歧义
- **THEN** `opsx show` 和 `opsx validate` SHALL 接受 `--type spec|change`
- **AND** 帮助文本 SHALL 清晰记录这一点

#### Scenario: [REMOVED] Verb-first command discovery
- **WHEN** a user runs a command like `opsx list`
- **THEN** the verb communicates the action clearly
- **AND** nouns refine scope via flags or arguments (e.g., `--changes`, `--specs`)

#### Scenario: [REMOVED] Backward compatibility for noun commands
- **WHEN** users run noun-prefixed commands such as `opsx spec ...` or `opsx change ...`
- **THEN** the CLI SHALL continue to support them for at least one release
- **AND** display a deprecation warning that points to verb-first alternatives

#### Scenario: [REMOVED] Disambiguation guidance
- **WHEN** item names are ambiguous between changes and specs
- **THEN** `opsx show` and `opsx validate` SHALL accept `--type spec|change`
- **AND** the help text SHALL document this clearly
