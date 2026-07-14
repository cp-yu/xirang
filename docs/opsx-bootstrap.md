# OPSX Bootstrap Workflow

## Overview

Bootstrap upgrades an existing repository into formal OPSX v2 tracking through five phases:

`init -> scan -> map -> review -> promote`

Promotion writes exactly two formal files:

- `openspec/project.opsx.yaml`
- `openspec/project.opsx.relations.yaml`

The workspace under `openspec/bootstrap/` is retained as audit history.

## Supported Paths

- `specs-based -> full`
- `raw -> full`
- `raw -> opsx-first`
- `formal-opsx -> refresh`

`opsx-first` creates the formal OPSX model plus a README-only specs starter. `full` generates complete candidate specs. `refresh` rebuilds the entire candidate from current evidence; the previous formal model is used only to produce the review diff.

## Commands

The user-facing workflow is `/opsx:bootstrap`. It orchestrates these CLI commands:

```bash
openspec bootstrap status --json
openspec bootstrap init --mode full --granularity coarse
openspec bootstrap advance scan
openspec bootstrap instructions --json
openspec bootstrap validate
openspec bootstrap promote -y
```

For an existing formal v2 repository:

```bash
openspec bootstrap init --mode refresh --granularity coarse
```

If a completed workspace already exists:

```bash
openspec bootstrap init --mode refresh --restart
```

Restart snapshots the retained workspace into `openspec/bootstrap-history/` before creating a fresh workspace. When `--granularity` is omitted, restart inherits it from the retained `scope.yaml`; pass `--granularity coarse|fine` to override it. Initial init always requires an explicit granularity.

## Phases

### 1. Init

Init records mode, scope, and granularity without inferring architecture. Enter scan through the public, auditable transition:

```bash
openspec bootstrap advance scan
openspec bootstrap status --json
```

The transition only accepts `init -> scan`; later transitions remain gate-driven by `openspec bootstrap validate`. Do not edit `.bootstrap.yaml` or call internal APIs.

### 2. Scan

Scan collects current evidence from source files, package/build metadata, configuration, and formal specs. CodeGraph may accelerate symbol, import, and call discovery when already available. Otherwise use ACE, `rg`, `read`, and tracked-file search. Bootstrap never installs CodeGraph automatically.

### 3. Map

Map writes domains, capabilities, candidate relations, and optional spec source into `domain-map/*.yaml`.

```yaml
domain:
  id: dom.orders
  type: domain
  intent: Order processing

capabilities:
  - id: cap.orders.create
    type: capability
    intent: Create an order
    spec:
      folder: orders
      purpose: Order behavior.
      requirements:
        - title: Create order
          text: The system SHALL create an order.
          scenarios:
            - title: Order created
              steps:
                - keyword: WHEN
                  text: a valid order is submitted
                - keyword: THEN
                  text: the order is created

relations:
  - from: cap.orders.create
    type: belongs_to
    to: dom.orders
```

Imports and calls form relation candidates only. Select a semantic relation from its interaction mechanism; unresolved candidates belong in review gaps rather than in the graph.

### 4. Review

`openspec bootstrap validate` regenerates candidate files and `review.md`. Review checks:

- domain boundaries and capability intents
- exactly one ownership edge per capability
- endpoint direction, note policy, and duplicate edges
- unsupported or weakly evidenced interactions
- spec coverage and candidate completeness
- refresh differences from the previous formal model

Any evidence or mapping change makes prior approval stale.

### 5. Promote

`openspec bootstrap promote -y` rechecks every gate and atomically writes the two formal files. In refresh mode it replaces the complete two-file candidate; it does not merge a partial graph.

After promote, deterministic name matching runs automatically. For remaining specs, request the semantic handoff:

```bash
openspec bootstrap backfill-specs --json
```

The JSON includes unmatched spec content/path, candidate capability IDs and intents, the required mapping result format, and the apply command. Give this context to an agent or subagent, retain only evidence-backed mappings, save them as JSON, then apply them:

```bash
openspec bootstrap backfill-specs --mappings semantic-mappings.json --json
```

The command validates every spec and capability before writing and returns the specs still unmatched. Report that list explicitly; never guess or silently associate a capability.

## Mode Outputs

### `opsx-first`

- writes the two formal OPSX files
- creates `openspec/specs/README.md`
- leaves behavior specs to normal change workflows

### `full` on `raw`

- writes the two formal OPSX files
- writes valid specs for all mapped capabilities

### `full` on `specs-based`

- preserves existing specs
- adds missing capability specs
- fails on target-path conflicts

### `refresh` on `formal-opsx`

- scans current source, specs, config, and reviewed workspace evidence
- builds a complete fresh candidate
- uses the old formal model only for added/modified/removed review output
- atomically replaces the two formal files after approval
- produces deterministic output when inputs are unchanged

A git anchor may remain in workspace metadata for audit continuity, but it is not a candidate inference input.

## Cross-platform Behavior

Bootstrap builds paths with the Node.js `path` API. Full scans do not depend on slash style, path casing, or persisted path mappings, so Windows and POSIX repositories follow the same contract.

## After Bootstrap

```bash
openspec validate --all
git add openspec/project.opsx.yaml openspec/project.opsx.relations.yaml openspec/specs
git commit
```

Use `/opsx:propose`, `/opsx:apply`, and `/opsx:archive` for later changes. Use refresh when the formal architecture must be rebuilt from current evidence.

## Troubleshooting

### Invalid partial OPSX

Both formal v2 files are required. A missing file, wrong schema version, or invalid semantic relation graph blocks refresh.

### Missing capabilities

Add evidence and update `domain-map/*.yaml`, then rerun `openspec bootstrap validate`.

### Unclear relations

Do not create a generic edge. Record the gap, inspect specs and live code evidence, and choose a canonical relation only when the interaction is established.

### Stale review

Recheck `review.md` after any evidence, mapping, spec source, or candidate change.
