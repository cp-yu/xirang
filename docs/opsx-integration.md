# OPSX Programmatic Integration

LikeC4 is the only active architecture source. Programmatic consumers should read `.opsx/architecture/**/*.c4` through LikeC4 APIs or use the OPSX CLI instead of reading a parallel YAML model.

## Query Architecture

```bash
opsx arch query <element-id> --relations --depth 2 --json
opsx arch validate --json
```

Query output preserves element IDs, semantic relation direction, and relation type. Source paths, imports, calls, and symbols remain live implementation evidence and are not persisted as architecture truth.

## Read Formal Specs

Formal behavior is stored under `.opsx/specs/**/*.md`. A LikeC4 element may index one or more Specs:

```likec4
metadata {
  specs ['.opsx/specs/orders/spec.md', '.opsx/specs/payments/spec.md']
}
```

`opsx view` reads indexed Markdown through its local authorized API. Other integrations should apply the same path controls: project-relative `.md` paths only, current-model authorization, and realpath containment under `.opsx/specs/`.

## Change Integration

- Behavior changes are declared in `.opsx/changes/<name>/specs/**/spec.md`.
- Architecture changes are declared in `.opsx/changes/<name>/architecture-delta.c4`.
- `opsx sync <name>` reconciles approved deltas into formal Specs and LikeC4.
- `opsx archive <name>` verifies lifecycle gates and moves the change into audit history.

See [LikeC4 Architecture Integration](architecture-integration.md) for the model contract.
