---
element: project.root
---

# OPSX Project Contract

## Purpose

OPSX is a human-intent programming layer. It compiles one versioned Semantic Model—LikeC4 graph modules and element-owned Markdown contracts—into agent workflows and verified project changes.

## Requirements

### Requirement: Project intent and scope

OPSX SHALL let humans express project behavior, architecture intent, ownership, boundaries, and semantic collaboration in a model that an Agent can compile without inventing material decisions.

#### Scenario: Agent compiles a change

- **WHEN** an Agent explores, proposes, applies, verifies, syncs, or archives a change
- **THEN** it SHALL treat Specs and LikeC4 modules as source modules of one OPSX Semantic Model
- **AND** SHALL use implementation code only as current evidence

### Requirement: Success criteria

The project SHALL provide a stable CLI and generated agent workflow surface that preserves the Explore → Propose → Apply → Verify → Sync → Archive lifecycle, validates semantic deltas, and promotes source only after evidence-backed review.

#### Scenario: Change reaches steady state

- **WHEN** a change is completed
- **THEN** its externally observable behavior SHALL be represented by element-owned contracts
- **AND** its architecture intent SHALL be represented by stable elements, refinement containment, and typed semantic relationships
- **AND** validation SHALL detect incomplete or contradictory source before promotion

### Requirement: Global semantic invariants

The Project Root SHALL be unique; every non-root element SHALL have one parent; stable element identity SHALL be independent of containment path; every Spec SHALL have one explicit element owner; and required elements SHALL have real contracts.

#### Scenario: Source is incomplete

- **WHEN** a binding, hierarchy decision, contract, relation endpoint, or required policy cannot be determined from authorized source
- **THEN** OPSX SHALL report a review gap
- **AND** SHALL NOT infer the decision from filenames, imports, calls, source layout, textual similarity, or a catch-all owner

### Requirement: Independent product and durable workspace

OPSX SHALL operate as an independent product through the opsx CLI and the .opsx workspace, without legacy product aliases or fallback semantic stores.

#### Scenario: Project is initialized or updated

- **WHEN** OPSX creates or refreshes a project workspace
- **THEN** generated workflows SHALL target the current OPSX identity and Semantic Model
- **AND** retired compatibility inputs SHALL remain isolated behind explicit migration boundaries

### Requirement: Evidence-gated source promotion

Candidate graph and contract modules SHALL remain isolated until their identities, bindings, policies, relationships, platform behavior, and rollback path have been validated and a human explicitly authorizes promotion.

#### Scenario: Candidate has an unresolved gap

- **WHEN** any required validation or human decision is missing
- **THEN** formal .opsx architecture and Specs SHALL remain unchanged
