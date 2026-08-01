---
operation: ADDED
entity: element-declaration
identity: capability.added-parent
kind: capability
parent: project.root
title: Added Parent Capability
definition: Groups newly proposed capabilities before they enter the Semantic Model.
---

## ADDED Requirements

### Requirement: Added parent behavior

The added parent SHALL expose its target Contract and semantic delta without requiring a base LikeC4 model element.

#### Scenario: Diff is visible

- **WHEN** the user opens the added parent details
- **THEN** the Browser renders its target declaration and Contract diff

### Requirement: Trailing diff content

The added parent SHALL keep later Contract changes reachable when the Diff tab exceeds the details card height.

#### Scenario: Trailing diff remains reachable

- **WHEN** the Diff tab contains more content than the details card can display
- **THEN** the user can scroll to the final Contract change
