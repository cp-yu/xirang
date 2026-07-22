---
element: project.root/domain.cli/cap.cli.project-setup
---

# init-opsx-skeleton Specification

## Purpose
Define the first-run LikeC4 skeleton and bootstrap-arch guidance emitted by `opsx init`.

## Requirements
### Requirement: OPSX Skeleton Generation on Init
First-time non-extend init SHALL create the durable `.opsx` core and a versioned LikeC4 architecture skeleton only when targets do not exist; it MUST NOT create legacy project YAML or code-map files.

#### Scenario: First-time init creates LikeC4 source
- **WHEN** `opsx init` runs in a project without an OPSX workspace
- **THEN** it SHALL create `.opsx/architecture/specification.c4`, `model.c4`, `relations.c4`, and `views.c4`
- **AND** SHALL preserve portable paths and project identity derived from package metadata or directory name

#### Scenario: Extend mode preserves source
- **WHEN** init extends an existing workspace
- **THEN** existing architecture and Specs SHALL NOT be overwritten

### Requirement: Bootstrap Guidance in Init Success Output
Init success output SHALL show tool-native guidance for the installed `bootstrap-arch` skill only when that workflow is present and the run is not extend mode.

#### Scenario: Bootstrap skill is installed
- **WHEN** first-time init installs `opsx-bootstrap-arch`
- **THEN** success output SHALL point to its tool-specific invocation
- **AND** SHALL NOT print the retired `/opsx:bootstrap` alias
