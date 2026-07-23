---
element: cap.quality.ci-nix-validation
---

# ci-nix-validation Specification

## Purpose

Define the executable delivery surfaces currently maintained by the repository: Nix packaging/development and the GitHub cross-platform validation workflow.

## Requirements

### Requirement: Versioned Nix delivery surface

The Nix flake SHALL declare the Node.js and pnpm packages used to build OPSX and enter its development shell.

#### Scenario: Nix package or development shell is evaluated

- **WHEN** a contributor evaluates the package or enters the default development shell
- **THEN** the flake SHALL provide its pinned Node.js and pnpm toolchain
- **AND** SHALL build the current package.json version from the locked pnpm dependency closure

### Requirement: Cross-platform GitHub validation

The GitHub workflow SHALL run the declared root and vendored LikeC4 validation commands on Linux, macOS, and Windows with its pinned Node.js and pnpm versions.

#### Scenario: Cross-platform workflow runs

- **WHEN** a pull request or main-branch push triggers validation
- **THEN** root install, identity audit, lint, build, tests, and browser tests SHALL run on each declared operating system
- **AND** vendored LikeC4 install, typecheck, tests, and build SHALL run on each declared operating system

### Requirement: Delivery claims follow executable configuration

Delivery documentation and contracts SHALL describe only jobs, commands, operating systems, and tool versions present in versioned flake or workflow configuration.

#### Scenario: Delivery configuration changes

- **WHEN** a Nix package, workflow job, command, operating system, or pinned tool version is added, removed, or changed
- **THEN** the corresponding delivery contract SHALL be reconciled in the same change
