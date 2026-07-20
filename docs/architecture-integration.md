# LikeC4 Architecture Integration

OpenSpec uses Specs plus LikeC4 as its durable semantic source. Specs own observable behavior; `openspec/architecture/` owns architecture intent, capabilities, ownership, boundaries, and semantic relations.

## Layout

```text
openspec/architecture/
├── specification.c4
├── domains/
│   └── <domain>.c4
├── relations.c4
└── views.c4
```

Capabilities are nested in exactly one domain. Ownership is represented by nesting, not a `belongs_to` relation. Capability metadata may include a canonical `capabilityId`, lifecycle `status`, and linked `specs` paths.

```likec4
model {
  cli = domain 'CLI' {
    query = capability 'Query architecture' {
      metadata {
        capabilityId 'cap.cli.arch-query'
        specs ['openspec/specs/arch-query-command/spec.md']
      }
    }
  }
  cli.query -[invokes]-> architecture.reader
}
```

Supported semantic relationship kinds are `invokes`, `consumes`, `precedes`, `constrains`, and `validates`.

## Commands

```bash
openspec arch query cli.query --relations --depth 2
openspec arch validate
openspec arch preview
openspec arch export --format svg --output docs/architecture
```

Native LikeC4 validation checks DSL syntax. `openspec arch validate` also checks OpenSpec ownership, cycle, and metadata rules.

## Change Workflow

Architecture changes belong in `openspec/changes/<name>/architecture-delta.c4`. Extend existing elements and use typed relations:

```likec4
model {
  extend cli {
    export = capability 'Export architecture'
  }
  cli.export -[consumes]-> architecture.reader
}
```

Validate the delta before implementation:

```bash
openspec arch validate --delta openspec/changes/<name>/architecture-delta.c4
```

Sync merges approved deltas into the formal model and rewrites change-local spec metadata to formal spec paths.
