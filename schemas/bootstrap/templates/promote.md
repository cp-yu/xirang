# Bootstrap Promote

Confirm promotion of candidate OPSX files to formal project files.

## Pre-promote Checklist

- [ ] review.md matches the current candidate output
- [ ] All review checkboxes checked
- [ ] Referential integrity validated
- [ ] Relation semantic validation passed
- [ ] Scan/map completeness re-validated

## Actions

1. Re-check all promotion gates before any formal write
2. Write openspec/project.opsx.yaml
3. Write openspec/project.opsx.relations.yaml
4. In `raw + full`, copy reviewed candidate specs into `openspec/specs/<capability-folder>/spec.md`
5. In `raw + opsx-first`, create only `openspec/specs/README.md`
6. In `specs-based + full`, preserve existing specs and add only missing capability specs
7. Retain openspec/bootstrap/ as audit history and direct the next run to `openspec bootstrap init --mode refresh --restart`, which inherits retained `scope.yaml` granularity unless explicitly overridden
8. Run `openspec bootstrap backfill-specs --json`; pass unmatched spec content and candidate capability intents to a subagent, apply only reviewed mappings with `--mappings <mapping-file>`, and explicitly report specs still unmatched
