# LikeC4 Architecture Integration

OPSX uses Specs plus LikeC4 as its durable semantic source. Specs own observable behavior. `.opsx/architecture/` owns architecture intent, capabilities, ownership, boundaries, and semantic relations.

## Layout

```text
.opsx/architecture/
├── specification.c4
├── domains/
│   └── <domain>.c4
├── relations.c4
└── views.c4
```

Capabilities are nested in exactly one domain. Ownership is represented by nesting, not by a relationship. Metadata may include a canonical `capabilityId`, lifecycle `status`, and one or more formal Spec paths.

```likec4
model {
  cli = domain 'CLI' {
    query = capability 'Query architecture' {
      metadata {
        capabilityId 'cap.cli.arch-query'
        status 'active'
        specs ['.opsx/specs/arch-query-command/spec.md']
      }
    }
  }

  cli.query -[invokes]-> architecture.reader
}
```

`metadata.specs` stores project-relative indexes only. Markdown remains in `.opsx/specs/**/*.md` and is loaded on demand by `opsx view`.

Supported semantic relationships are `invokes`, `consumes`, `precedes`, `constrains`, and `validates`.

## Commands

```bash
opsx view --port 5173
opsx arch query cli.query --relations --depth 2
opsx arch validate
opsx arch export --format svg --output docs/architecture
```

`opsx view` uses the LikeC4 source vendored in the OPSX repository. There is no external runtime fallback.

## Change Workflow

Architecture changes belong in `.opsx/changes/<name>/architecture-delta.c4`. Extend an existing target before adding new elements or semantic relations.

```likec4
model {
  extend cli {
    export = capability 'Export architecture'
  }

  cli.export -[consumes]-> architecture.reader
}
```

Validate before implementation:

```bash
opsx arch validate --delta .opsx/changes/<name>/architecture-delta.c4
```

Sync merges an approved delta into the formal LikeC4 model and formalizes linked change-local Spec paths.

## Specs Browser Security

The local endpoint accepts `GET /__opsx/spec?element=<id>&path=<relative-path>`. Every request is authorized against the current computed model. Absolute paths, backslashes, traversal segments, non-Markdown files, unindexed paths, missing files, and symlink escapes are rejected. Responses disable caching, and watcher events contain only the precise project-relative Spec path.
