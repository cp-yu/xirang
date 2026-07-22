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
2. Validate the complete versioned LikeC4 candidate and singular Spec bindings
3. Atomically write `.opsx/architecture/*.c4`
4. Copy reviewed candidate Specs into `.opsx/specs/<spec-id>/spec.md`
5. In `raw + opsx-first`, additionally create `.opsx/specs/README.md`
6. Preserve compatible existing Specs only when explicitly requested
7. Retain `.opsx/bootstrap/` as audit history and direct the next run to `opsx bootstrap init --mode refresh --restart`, which inherits retained `scope.yaml` granularity unless explicitly overridden
8. Run `opsx bootstrap backfill-specs --json` and explicitly report Specs still unmatched
