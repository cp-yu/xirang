---
operation: MODIFIED
entity: element-declaration
identity: alpha.id
kind: capability
parent: project.root
title: Alpha
summary: Deterministic alpha module used by the validation harness
---

## ADDED Requirements

### Requirement: Parser SHALL accept CRLF change proposals
The parser SHALL accept CRLF change proposals without manual edits.

#### Scenario: Validate CRLF change
- **GIVEN** a change proposal saved with CRLF line endings
- **WHEN** a developer runs xirang validate on the proposal
- **THEN** validation succeeds without section errors
