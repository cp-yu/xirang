# Workflow Skills And Architecture Commands

Xirang exposes managed workflows as skills. It does not generate a parallel slash-command surface.

## Workflow Skills

| Skill | Purpose |
|---|---|
| `/xirang:explore` | Investigate requirements without modifying code or artifacts |
| `/xirang:propose` | Create proposal, design, tasks, and the four-partition Semantic Delta when required |
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

### Outline

```bash
xirang arch outline [--definition-depth <n>] [--format text|markdown|json]
```

Projects the complete Element hierarchy, all Relationships, and complete Metamodel Kinds. Definition depth controls only which Element Definitions are loaded; it does not hide Elements or load Contracts.

### Impact

```bash
xirang arch impact <identities...> [--depth <n>] [--json]
```

Discovers identity-only refinement context, directed Relationships, and canonical paths around explicit focus Elements. Use the returned identities to select a bounded semantic read.

### Query

```bash
xirang arch query <identities...> [--contract] [--json]
```

Reads complete Declarations for explicit stable identities, with complete owned Contracts only when `--contract` is present. The command is atomic for a batch: an unknown identity fails the whole request. LikeC4 FQNs are derived generation artifacts and never address the persistent source; use `xirang arch search` to find identities first.

### Validate

```bash
xirang arch validate [--json]
xirang arch validate --change <name> [--json]
```

Validates the formal Semantic Model under `.xirang/model/`, or the Expected Semantic Model of an active change with `--change`. Use `xirang validate --change <name> --json` for combined Delta and model validation.

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
