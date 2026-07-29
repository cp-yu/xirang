# Xirang Semantic Model And LikeC4

Xirang has one durable Semantic Model. Its normative source is persisted under `.xirang/model/` in four partitions. LikeC4 is generated from the complete model into `.xirang/.cache-likec4/` for visualization and is never a persistence authority.

## Layout

```text
.xirang/
├── model/
│   ├── metamodel/
│   ├── elements/
│   ├── relationships/
│   └── views/
└── .cache-likec4/
```

Each Markdown unit declares its `entity` and stable `identity` in frontmatter. File names and directory positions are organizational only; hierarchy comes from Element `parent` identities.

```markdown
---
entity: element-declaration
identity: payment.authorize
kind: operation
parent: payments
title: Authorize
definition: Represents the payment authorization responsibility and boundary.
---

## Requirements

### Requirement: Authorize valid payments
The operation SHALL authorize a valid payment request.

#### Scenario: Valid request succeeds
- **WHEN** a valid payment request is submitted
- **THEN** authorization succeeds
```

An Element unit combines one Element Declaration with at most one Element Contract. Metamodel units define Element Kinds and Relationship Kinds. Relationship YAML files are containers for directed `source`, `kind`, and `target` triples. Authored View units select model identities without adding normative semantics.

## Commands

```bash
xirang view --port 5173
xirang arch query payment.authorize --relations --depth 2 --contract --json
xirang arch search authorization --json
xirang arch validate --json
```

Queries address semantic objects by stable identity. Generated local names and LikeC4 FQNs are presentation details and are not persisted back into the model.

## Semantic Delta

A Change uses the same four partitions under `.xirang/changes/<name>/`. Each Semantic Delta Entry declares `operation: ADDED|MODIFIED|REMOVED`, its entity type, and stable identity. ADDED and MODIFIED carry the complete target state; REMOVED carries identity only.

```text
.xirang/changes/add-payment-capture/
├── proposal.md
├── design.md
├── tasks.md
├── elements/
│   └── payment.capture.md
├── metamodel/
├── relationships/
│   └── invokes.yaml
└── views/
```

Requirement Entries live in the body of their host Element unit under `## ADDED Requirements`, `## MODIFIED Requirements`, or `## REMOVED Requirements`. Relationship Entries use ADDED or REMOVED because the complete triple is their identity.

Validate the Expected Semantic Model before implementation or sync:

```bash
xirang validate --change <name> --json
xirang arch validate --change <name> --json
```

`xirang show <name> --json` returns the compiler-derived `valid`, `summary`, concise `entries`, and `diagnostics`. `xirang sync <name>` validates and applies the Semantic Delta atomically to the formal model.

## Legacy Input

Persisted LikeC4 graphs, change-local `specs/`, and `architecture-delta.c4` are not current Semantic Model or Semantic Delta sources. They may be considered only as explicitly authorized evidence during model construction or migration.
