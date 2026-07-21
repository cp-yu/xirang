<p align="center">
  <a href="https://github.com/cp-yu/opsx">
    <picture>
      <source srcset="assets/opsx_bg.png">
      <img src="assets/opsx_bg.png" alt="OPSX logo">
    </picture>
  </a>
</p>

# OPSX

OPSX is a human-intent programming framework for agent-driven software development. Specs define externally observable behavior. LikeC4 defines architecture intent, capability ownership, boundaries, and semantic relations. Agents compile both sources into code.

## Core Model

```text
.opsx/
├── architecture/        # LikeC4 architecture source
├── specs/               # Formal behavioral Specs
├── changes/             # Change-local deltas and compilation scaffolding
├── references/          # Managed workflow references
└── config.yaml          # Project configuration
```

`proposal.md`, `design.md`, and `tasks.md` guide a change, but they do not replace Specs or LikeC4 as durable semantic source.

## Requirements

- Node.js 22.22.3 or newer
- pnpm 9 or newer

OPSX currently runs from source. The project does not publish an npm package or download the LikeC4 runtime during installation.

```bash
git clone https://github.com/cp-yu/opsx.git
cd opsx
pnpm install --frozen-lockfile
pnpm run likec4:install
pnpm run likec4:build
pnpm build
node bin/opsx.js --help
```

The vendored LikeC4 `v1.59.0` subtree is the only browser engine used by the CLI.

## Start A Project

```bash
cd your-project
/path/to/opsx/bin/opsx.js init
```

Then use the managed workflow skills installed for your agent:

| Skill | Purpose |
|---|---|
| `/opsx:explore` | Investigate an idea and resolve ambiguous intent |
| `/opsx:propose` | Create a complete change proposal and semantic deltas |
| `/opsx:apply` | Implement tasks with evidence-backed TDD |
| `/opsx:archive` | Verify, sync, and archive a completed change |
| `/opsx:bootstrap-arch` | Model an existing repository in LikeC4 |
| `/opsx:snack` | Reconcile already-written code into OPSX artifacts |

Tool-specific invocation syntax is documented in [Supported Tools](docs/supported-tools.md).

## Browse Architecture And Specs

From a project or any nested directory:

```bash
opsx view
opsx view --port 5173
```

`opsx view` discovers the nearest `.opsx/`, starts the vendored LikeC4 application, and renders `.opsx/architecture/**/*.c4`. Elements with `metadata.specs` expose a Specs tab that loads the indexed `.opsx/specs/**/*.md` files on demand. Spec files remain the single behavioral source; Markdown is not copied into the architecture model.

The local Spec API authorizes every request against the current computed LikeC4 model and rejects unsafe, unindexed, non-Markdown, and symlink-escaping paths. Editing the current Spec refreshes its rendered content through a precise HMR event.

## Common CLI Commands

```bash
opsx list
opsx show <change-or-spec>
opsx validate --all --strict
opsx arch query <element-id> --relations --depth 2
opsx arch validate
opsx arch export --format svg --output docs/architecture
opsx view --port 5173
```

There is no legacy CLI alias, previous-workspace fallback, or secondary architecture preview command.

## Change Workflow

```text
You: /opsx:propose add-dark-mode
AI:  Created .opsx/changes/add-dark-mode/
     - proposal.md
     - design.md
     - tasks.md
     - specs/**/spec.md
     - architecture-delta.c4 when architecture changes

You: /opsx:apply
AI:  Implemented each behavior through RED -> GREEN -> REFACTOR
     and marked checks only after validation passed.

You: /opsx:archive
AI:  Verified and synced the semantic deltas, then moved the change to
     .opsx/changes/archive/YYYY-MM-DD-add-dark-mode/
```

## Documentation

- [Getting Started](docs/getting-started.md)
- [Workflows](docs/workflows.md)
- [Workflow Skills](docs/commands.md)
- [CLI Reference](docs/cli.md)
- [LikeC4 Architecture](docs/architecture-integration.md)
- [Migration Guide](docs/migration-guide.md)
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
node scripts/audit-opsx-identity.mjs
```

Root and `likec4/` are independent pnpm workspaces. Root scripts use `pnpm --dir likec4` to orchestrate the vendored engine explicitly.

## Telemetry

OPSX records anonymous command names and version only. It does not collect arguments, paths, file content, or personally identifiable information. Telemetry is disabled in CI.

```bash
export OPSX_TELEMETRY=0
```

`DO_NOT_TRACK=1` is also respected.

## License

MIT
