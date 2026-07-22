# Brownfield Semantic Model Bootstrap

Use the managed `/opsx:bootstrap-arch` skill to model an existing repository. Bootstrap is an agent workflow that produces a reviewed OPSX Semantic Model candidate; it is not a code scanner and not a runtime compatibility layer.

## Output

The workflow authors and promotes:

```text
.opsx/architecture/
├── specification.c4
├── model.c4
├── relations.c4
└── views.c4
```

Candidate contract modules are written under `specs/<spec-id>/spec.md` and bind to one stable `elementId` through singular `element` frontmatter. Elements may be nested to arbitrary depth. The generated candidate is not formal source until the review and promotion gates pass.

## Workflow

1. Initialize the bootstrap workspace under `.opsx/bootstrap/`.
2. Scan tracked source, package metadata, configuration, and formal Specs for implementation evidence.
3. Propose one Project Root, metamodel kinds, stable element identities, refinement hierarchy, semantic relationships, and Spec bindings.
4. Review boundaries, summaries, uncertain relationships, identity mappings, and contract ownership with the user.
5. Validate the complete candidate graph and contracts.
6. Promote the approved candidate atomically and retain the bootstrap workspace as audit evidence.

Imports, calls, and source paths are implementation evidence only. They do not define Semantic Model facts. Unsupported or ambiguous interactions stay as review gaps until the user resolves them; bootstrap never guesses an element or Spec owner from a file name.

## Retained Lifecycle Modes

The underlying bootstrap workspace records one of three mode names used by the CLI lifecycle: `full`, `opsx-first`, or `refresh`. When granularity is omitted, restart inherits it from the retained `scope.yaml`; an explicit value overrides it. A formal Semantic Model baseline supports only `formal-opsx -> refresh`. The `/opsx:bootstrap-arch` skill selects and drives these modes from reviewed evidence; users should not treat generated candidate files as durable source until promotion. `opsx-first` leaves contract authoring to normal change workflows.

## Validation

```bash
opsx arch validate
opsx validate --all --strict
opsx view
```

Use `opsx arch query <element-id> --relations --depth 2` to inspect the promoted model. Later graph changes belong in change-local `architecture-delta.c4` files and follow the normal propose, apply, sync, and archive workflow.
