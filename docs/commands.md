# Workflow Skills And Architecture Commands

OPSX exposes managed workflows as skills. It does not generate a parallel slash-command surface.

## Workflow Skills

| Skill | Purpose |
|---|---|
| `/opsx:explore` | Investigate requirements without modifying code or artifacts |
| `/opsx:propose` | Create proposal, design, tasks, delta Specs, and architecture delta when required |
| `/opsx:apply` | Implement an approved change with TDD and evidence-backed checks |
| `/opsx:archive` | Verify, sync, and archive a completed change |
| `/opsx:bootstrap-arch` | Build a versioned Semantic Model candidate from repository evidence |
| `/opsx:snack` | Reconcile existing code into one Semantic Delta |

Invocation syntax varies by agent tool. See [Supported Tools](supported-tools.md).

## Architecture CLI

### Browse

```bash
opsx view [--port <n>]
```

Discovers the nearest `.opsx/`, starts the vendored LikeC4 engine, and serves graph elements with contracts authorized by the derived Spec registry.

### Query

```bash
opsx arch query <element-id> [--relations] [--depth <n>] [--json]
```

Queries any Semantic Model element by stable `elementId` or current LikeC4 FQN. Output identity is canonicalized to `elementId`.

### Validate

```bash
opsx arch validate [--json]
opsx arch validate --delta <architecture-delta.c4> [--json]
```

Validates the formal Semantic Model graph or a change-local graph delta. Use `opsx validate --change <name> --json` for combined graph and contract validation.

### Export

```bash
opsx arch export [--format png|svg|pdf] [--output <directory>]
```

Exports architecture diagrams without changing the semantic model.

## Explicit Semantic Model Migration

```bash
opsx migrate semantic-model [--candidate <path>] [--json]
opsx migrate semantic-model --promote --yes [--json]
```

This command converts an unversioned legacy LikeC4 profile into an independently validated v1 candidate. Promotion requires resolved identities and Spec bindings plus explicit authorization.

## Legacy YAML Conversion

```bash
opsx migrate opsx-to-likec4 [--dry-run]
```

This retained one-time command accepts only the former OPSX YAML architecture bundle. It is a legacy conversion path, not a runtime fallback or the canonical v1 migration workflow.
