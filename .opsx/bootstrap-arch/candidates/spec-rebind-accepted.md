# Spec Rebind — Accepted (new caps added)

## Status
- Agent judgements accepted; low-confidence overridden
- **8 missing capabilities added** to candidate `domains/*.c4`
- Candidate dry-run validate: **pass** (150 elements, 133 capabilities, 97 relations)

## Totals
| Class | Count |
| --- | ---: |
| Ready binds | **112** |
| needs-new-cap | **0** |
| keep-coarse | **2** |
| split | **1** |

## New capabilities
- `cap.cli.legacy-cleanup`
- `cap.apply.change-workflow`
- `cap.cli.arch-plan-remove`
- `cap.cli.artifact-workflow`
- `cap.cli.candidate`
- `cap.cli.diff`
- `cap.architecture.project-build`
- `cap.framework.conventions`

| Spec | New elementId |
| --- | --- |
| legacy-cleanup | `cap.cli.legacy-cleanup` |
| apply-change-workflow | `cap.apply.change-workflow` |
| arch-plan-remove-command | `cap.cli.arch-plan-remove` |
| cli-artifact-workflow | `cap.cli.artifact-workflow` |
| cli-candidate | `cap.cli.candidate` |
| cli-diff | `cap.cli.diff` |
| opsx-build | `cap.architecture.project-build` |
| opsx-conventions | `cap.framework.conventions` |

## Remaining residual
- keep-coarse: `artifact-graph` (umbrella), `project-contract` → `project.root`
- split: `spec-content-browser` (panel vs gateway)

## Next
Promote multi-file detailed + apply 112 Spec binds, or resolve residual first.
