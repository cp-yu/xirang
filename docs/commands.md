# Commands

OpenSpec's managed workflow surface is skills-only. Older slash command files may remain as legacy artifacts.

## Workflow Surface

| Command | Purpose |
|---|---|
| `/opsx:propose` | Create or update a change and author its semantic deltas |
| `/opsx:explore` | Investigate requirements before proposing a change |
| `/opsx:apply` | Implement tasks with architecture-first TDD |
| `/opsx:archive` | Verify, sync, and archive a completed change |
| `/opsx:bootstrap-arch` | Bootstrap a LikeC4 model from repository evidence |
| `/opsx:snack` | Reconcile existing code into OpenSpec artifacts |

## Architecture CLI

### Query

```bash
openspec arch query <element-id> [--relations] [--depth <n>] [--json]
```

Queries a LikeC4 domain or capability. Canonical capability IDs in metadata are also accepted.

### Validate

```bash
openspec arch validate [--json]
openspec arch validate --delta <architecture-delta.c4> [--json]
```

Validates the formal model or a change-local delta against the formal model.

### Preview

```bash
openspec arch preview [--port <n>]
```

Starts the LikeC4 browser preview.

### Export

```bash
openspec arch export [--format png|svg|pdf] [--output <directory>]
```

Exports diagrams to `docs/architecture` by default.

## Migration CLI

```bash
openspec migrate opsx-to-likec4 [--dry-run]
```

Converts the legacy OPSX YAML bundle to `openspec/architecture/`. A successful migration validates the generated LikeC4 and renames the source YAML files with `.backup` suffixes.
