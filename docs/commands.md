# Workflow Skills And Architecture Commands

OPSX exposes managed workflows as skills. It does not generate a parallel slash-command surface.

## Workflow Skills

| Skill | Purpose |
|---|---|
| `/opsx:explore` | Investigate requirements without modifying code or artifacts |
| `/opsx:propose` | Create proposal, design, tasks, delta Specs, and architecture delta when required |
| `/opsx:apply` | Implement an approved change with TDD and evidence-backed checks |
| `/opsx:archive` | Verify, sync, and archive a completed change |
| `/opsx:build` | Build a versioned Semantic Model candidate from repository evidence |
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

## Project Candidate

```bash
opsx candidate init --from current
opsx candidate init --from clean
opsx candidate init --from-path <path>
opsx candidate status [--json]
opsx candidate validate [--json]
opsx candidate promote --digest <reviewDigest>
```

Project Build authors Architecture and Specs in one isolated Candidate. Validation is read-only, and promotion requires the exact digest confirmed by the user.
