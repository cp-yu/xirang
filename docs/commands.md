# Workflow Skills And Architecture Commands

OPSX exposes managed workflows as skills. It does not generate a parallel slash-command surface.

## Workflow Skills

| Skill | Purpose |
|---|---|
| `/opsx:explore` | Investigate requirements without modifying code or artifacts |
| `/opsx:propose` | Create proposal, design, tasks, delta Specs, and architecture delta when required |
| `/opsx:apply` | Implement an approved change with TDD and evidence-backed checks |
| `/opsx:archive` | Verify, sync, and archive a completed change |
| `/opsx:bootstrap-arch` | Build a LikeC4 architecture model from repository evidence |
| `/opsx:snack` | Reconcile existing code into OPSX semantic artifacts |

Invocation syntax varies by agent tool. See [Supported Tools](supported-tools.md).

## Architecture CLI

### Browse

```bash
opsx view [--port <n>]
```

Discovers the nearest `.opsx/`, starts the vendored LikeC4 engine, and serves the Architecture and indexed Specs browser.

### Query

```bash
opsx arch query <element-id> [--relations] [--depth <n>] [--json]
```

Queries a LikeC4 domain or capability. Canonical capability IDs in metadata are also accepted.

### Validate

```bash
opsx arch validate [--json]
opsx arch validate --delta <architecture-delta.c4> [--json]
```

Validates the formal LikeC4 model or a change-local delta.

### Export

```bash
opsx arch export [--format png|svg|pdf] [--output <directory>]
```

Exports architecture diagrams without changing the semantic model.

## Explicit Legacy YAML Migration

```bash
opsx migrate opsx-to-likec4 [--dry-run]
```

This one-time command converts the former OPSX YAML architecture bundle into `.opsx/architecture/`. Runtime commands never fall back to that legacy format.
