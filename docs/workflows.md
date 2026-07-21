# Workflows

OPSX combines Specs with LikeC4 architecture and exposes managed workflows as skills.

## Current Surface

- `/opsx:propose`
- `/opsx:explore`
- `/opsx:apply`
- `/opsx:archive`
- `/opsx:bootstrap-arch`
- `/opsx:snack`

## Typical Flows

### Standard

```text
/opsx:propose ──► /opsx:apply ──► /opsx:archive
```

Propose authors behavior deltas and, when architecture changes, `architecture-delta.c4`. Apply queries affected LikeC4 elements before implementing serial TDD tasks. Archive verifies and syncs approved deltas.

### Explore First

```text
/opsx:explore ──► /opsx:propose ──► /opsx:apply ──► /opsx:archive
```

Use this when behavior or architecture decisions remain undefined.

### Bootstrap Architecture

```text
/opsx:bootstrap-arch ──► review candidates ──► opsx arch validate
```

The bootstrap workflow scans current evidence, produces reviewed LikeC4 candidates, and promotes them only after approval.

### Code-First Reconciliation

```text
/opsx:snack ──► /opsx:archive
```

Use this when code already exists and OPSX artifacts must be reconciled afterward.

## Archive Contract

`/opsx:archive` requires fresh verification, synchronizes delta Specs and `architecture-delta.c4`, then establishes the archive boundary.
