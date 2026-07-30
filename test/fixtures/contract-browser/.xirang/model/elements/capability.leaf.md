---
entity: element-declaration
identity: capability.leaf
kind: capability
parent: capability.drill
title: Leaf Capability
definition: Terminates the nested Model View navigation branch.
---

## Requirements

### Requirement: Leaf refinement context

The leaf SHALL expose its refinement Contract from the focused parent context.

#### Scenario: Contract is visible

- **WHEN** the user opens the leaf details
- **THEN** the Browser renders the leaf refinement Contract
