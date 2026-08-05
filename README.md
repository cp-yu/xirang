<p align="center">
  <a href="https://github.com/cp-yu/xirang">
    <picture>
      <source srcset="assets/xirang_bg.png">
      <img src="assets/xirang_bg.png" alt="Xirang logo">
    </picture>
  </a>
</p>

# Xirang

Xirang is a human-intent programming framework for agent-driven software development. Versioned LikeC4 graph modules and element-owned Markdown contract modules form one Xirang Semantic Model. Agents read these persisted files directly and translate authorized human intent into code.

## Core Model

```text
.xirang/
├── architecture/        # Versioned graph modules and Project Root
├── specs/               # Element-owned contract modules
├── changes/             # Semantic Deltas and compilation scaffolding
├── references/          # Managed workflow references
└── config.yaml          # Project configuration
```

Every v1 graph element has a stable `elementId`; each Spec binds to one element through `element: <elementId>` frontmatter. `proposal.md`, `design.md`, and `tasks.md` guide compilation, but they do not replace the Semantic Model or create a persisted intermediate representation.

## Requirements

- Node.js 22.22.3 or newer
- pnpm 9 or newer

Xirang currently runs from source. The project does not publish an npm package or download the LikeC4 runtime during installation.

```bash
git clone https://github.com/cp-yu/xirang.git
cd xirang
pnpm install --frozen-lockfile
pnpm run likec4:install
pnpm run likec4:build
pnpm build
node bin/xirang.js --help
```

The vendored LikeC4 `v1.59.0` subtree is the only browser engine used by the CLI.

## Start A Project

```bash
cd your-project
/path/to/xirang/bin/xirang.js setup
```

Then use the managed workflow skills installed for your agent:

| Skill | Purpose |
|---|---|
| `/xirang:explore` | Investigate an idea and resolve ambiguous intent |
| `/xirang:propose` | Create a complete change proposal and semantic deltas |
| `/xirang:apply` | Implement tasks with evidence-backed TDD |
| `/xirang:archive` | Verify, sync, and archive a completed change |
| `/xirang:build` | Build or rebuild Architecture and Specs as one reviewed Candidate |
| `/xirang:snack` | Reconcile already-written code into Xirang artifacts |

Tool-specific invocation syntax is documented in [Supported Tools](docs/supported-tools.md).

## Browse Architecture And Specs

From a project or any nested directory:

```bash
xirang view
xirang view --port 5173
```

`xirang view` discovers the nearest `.xirang/`, starts the vendored LikeC4 application, and renders `.xirang/architecture/**/*.c4`. Elements with entries in the derived Spec registry expose a Specs tab that loads their `.xirang/specs/**/*.md` contract modules on demand. The registry is derived from singular Spec frontmatter; graph metadata does not duplicate Spec paths.

The local Spec API authorizes every element/path pair against the current registry and rejects unsafe, unregistered, non-Markdown, and symlink-escaping paths. Editing the current Spec refreshes its rendered content through a precise HMR event.

## Common CLI Commands

```bash
xirang list
xirang show <change-or-spec>
xirang validate --all --strict
xirang arch query <element-id> --relations --depth 2
xirang arch validate
xirang arch export --format svg --output docs/architecture
xirang view --port 5173
```

There is no legacy CLI alias, previous-workspace fallback, runtime grammar fallback, migration command family, or secondary architecture preview command. External or legacy material can only be used as user-approved Project Build evidence or as an explicit Candidate starting point.

## Change Workflow

```text
You: /xirang:propose add-dark-mode
AI:  Created .xirang/changes/add-dark-mode/
     - proposal.md
     - design.md
     - tasks.md
     - specs/**/spec.md
     - architecture-delta.c4 when architecture changes

You: /xirang:apply
AI:  Implemented each behavior through RED -> GREEN -> REFACTOR
     and marked checks only after validation passed.

You: /xirang:archive
AI:  Verified and synced the semantic deltas, then moved the change to
     .xirang/changes/archive/YYYY-MM-DD-add-dark-mode/
```

## Documentation

- [Getting Started](docs/getting-started.md)
- [Workflows](docs/workflows.md)
- [Workflow Skills](docs/commands.md)
- [CLI Reference](docs/cli.md)
- [LikeC4 Architecture](docs/architecture-integration.md)
- [Supported Tools](docs/supported-tools.md)
- [Concepts](docs/concepts.md)
- [Customization](docs/customization.md)

## Development

```bash
pnpm install --frozen-lockfile
pnpm run likec4:install
pnpm lint
pnpm build
pnpm test
pnpm run likec4:typecheck
pnpm run likec4:test
pnpm run likec4:build
pnpm run test:e2e:install
pnpm run test:e2e
node scripts/audit-xirang-identity.mjs
```

Root and `likec4/` are independent pnpm workspaces. Root scripts use `pnpm --dir likec4` to orchestrate the vendored engine explicitly.

## Telemetry

Xirang records anonymous command names and version only. It does not collect arguments, paths, file content, or personally identifiable information. Telemetry is disabled in CI.

```bash
export XIRANG_TELEMETRY=0
```

`DO_NOT_TRACK=1` is also respected.

## License

MIT
