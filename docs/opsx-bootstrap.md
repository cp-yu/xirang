# Brownfield Architecture Bootstrap

Use the managed `/opsx:bootstrap-arch` skill to model an existing repository. Bootstrap is an agent workflow, not a code scanner and not a runtime compatibility layer.

## Output

The workflow authors and promotes:

```text
.opsx/architecture/
├── specification.c4
├── domains/*.c4
├── relations.c4
└── views.c4
```

Existing `.opsx/specs/**/*.md` remain the behavioral source. Architecture elements may index them through `metadata.specs`.

## Workflow

1. Initialize the bootstrap workspace under `.opsx/bootstrap/`.
2. Scan tracked source, package metadata, configuration, and formal Specs for evidence.
3. Map domains, capabilities, ownership, and semantic relation candidates.
4. Review boundaries, terminology, uncertain relations, and Spec coverage with the user.
5. Promote the approved LikeC4 model and retain the bootstrap workspace as audit evidence.

Imports, calls, and source paths are implementation evidence only. They do not define architecture semantics. Unsupported or ambiguous interactions stay as review gaps until the user resolves them.

## Retained Lifecycle Modes

The underlying bootstrap workspace records one of three mode names used by the CLI lifecycle: `full`, `opsx-first`, or `refresh`. When granularity is omitted, restart inherits it from the retained `scope.yaml`; an explicit value overrides it. A formal OPSX baseline supports only `formal-opsx -> refresh`. The `/opsx:bootstrap-arch` skill selects and drives these modes from reviewed evidence; users should not treat the generated candidate files as durable architecture source. `opsx-first` leaves Specs to normal change workflows.

## Validation

```bash
opsx arch validate
opsx validate --all --strict
opsx view
```

Use `opsx arch query <element-id> --relations --depth 2` to inspect the promoted model. Later architecture changes belong in change-local `architecture-delta.c4` files and follow the normal propose, apply, sync, and archive workflow.
