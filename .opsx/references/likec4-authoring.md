# LikeC4 Authoring

## Elements

Use snake_case local element IDs and preserve canonical OPSX IDs in metadata.

```likec4
model {
  cli = domain 'CLI' {
    query = capability 'Query architecture' {
      metadata {
        capabilityId 'cap.cli.arch-query'
        specs ['.opsx/specs/arch-query-command/spec.md']
      }
    }
  }
}
```

Containment expresses ownership; do not define or emit `relationship belongs_to`.

## Relationship kinds

The specification defines:

```likec4
relationship invokes
relationship consumes
relationship precedes
relationship constrains
relationship validates
```

Use kind syntax, not relationship titles:

```likec4
cli.query -[invokes]-> architecture.reader
apply.implement -[precedes]-> verify.review
```

## Change delta

Extend existing domains and point new capability metadata at change-local specs:

```likec4
model {
  extend existing_domain {
    new_capability = capability 'New capability' {
      metadata {
        capabilityId 'cap.example.new-capability'
        specs ['.opsx/changes/<name>/specs/new-capability/spec.md']
      }
    }
  }
}
```

Validate with:

```bash
opsx arch validate --delta .opsx/changes/<name>/architecture-delta.c4
```
