---
entity: element-declaration
identity: capability.new-in-candidate
kind: capability
parent: perspective.browser
title: New Candidate Capability
definition: Candidate-only capability that does not exist in the current Semantic Model. It is added to the Candidate to test the Candidate View shows new elements and the Candidate Diff View renders them as ADDED.
---

## Requirements

### Requirement: Candidate behavior

This capability SHALL be visible only in Candidate View and Candidate Diff View, not in Model View.

#### Scenario: Shown in Candidate View

- **WHEN** user opens Candidate View
- **THEN** Browser SHALL show this element as part of the candidate target model
