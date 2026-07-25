# Workflow Skills And Architecture Commands

Xirang exposes managed workflows as skills. It does not generate a parallel slash-command surface.

## Workflow Skills

| Skill | Purpose |
|---|---|
| `/xirang:explore` | Investigate requirements without modifying code or artifacts |
| `/xirang:propose` | Create proposal, design, tasks, delta Specs, and architecture delta when required |
| `/xirang:apply` | Implement an approved change with TDD and evidence-backed checks |
| `/xirang:archive` | Verify, sync, and archive a completed change |
| `/xirang:build` | Build a versioned Semantic Model candidate from repository evidence |
| `/xirang:snack` | Reconcile existing code into one Semantic Delta |

Invocation syntax varies by agent tool. See [Supported Tools](supported-tools.md).

## Architecture CLI

### Browse

```bash
xirang view [--port <n>]
```

Discovers the nearest `.xirang/`, starts the vendored LikeC4 engine, and serves graph elements with contracts authorized by the derived Spec registry.

### Query

```bash
xirang arch query <element-id> [--relations] [--depth <n>] [--json]
```

Queries any Semantic Model element by stable `elementId` or current LikeC4 FQN. Output identity is canonicalized to `elementId`.

### Validate

```bash
xirang arch validate [--json]
xirang arch validate --delta <architecture-delta.c4> [--json]
```

Validates the formal Semantic Model graph or a change-local graph delta. Use `xirang validate --change <name> --json` for combined graph and contract validation.

### Export

```bash
xirang arch export [--format png|svg|pdf] [--output <directory>]
```

Exports architecture diagrams without changing the semantic model.

## Project Candidate

```bash
xirang candidate init --from current
xirang candidate init --from clean
xirang candidate init --from-path <path>
xirang candidate status [--json]
xirang candidate validate [--json]
xirang candidate promote --digest <reviewDigest>
```

Project Build authors Architecture and Specs in one isolated Candidate. Validation is read-only, and promotion requires the exact digest confirmed by the user.
