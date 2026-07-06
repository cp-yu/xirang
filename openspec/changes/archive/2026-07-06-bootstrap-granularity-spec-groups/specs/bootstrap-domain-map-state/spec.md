## ADDED Requirements

### Requirement: Domain-map spec_groups validation
`readBootstrapState()` and `validateGate('map_to_review')` SHALL validate `spec_groups` as first-class domain-map source data when bootstrap scope uses coarse granularity.

#### Scenario: [ADDED] Coarse domain-map with valid spec_groups is valid
- **GIVEN** `scope.yaml` contains `granularity: coarse`
- **AND** `openspec/bootstrap/domain-map/dom.cli.yaml` contains `spec_groups` whose capabilities all exist in the same domain-map capability list
- **AND** every `spec_groups[].folder` is a single cross-platform path segment
- **WHEN** bootstrap state is read and `map_to_review` gate is validated
- **THEN** the domain-map SHALL be classified as valid
- **AND** gate validation SHALL continue to candidate spec validation

#### Scenario: [ADDED] Coarse domain-map without spec_groups is invalid
- **GIVEN** `scope.yaml` contains `granularity: coarse`
- **AND** `openspec/bootstrap/domain-map/dom.cli.yaml` has capabilities but no `spec_groups`
- **WHEN** `validateGate('map_to_review')` runs
- **THEN** gate validation SHALL fail
- **AND** the error SHALL state that coarse granularity requires `spec_groups`

#### Scenario: [ADDED] spec_groups cannot reference missing capabilities
- **GIVEN** a domain-map contains `spec_groups[].capabilities: [cap.cli.missing]`
- **AND** `cap.cli.missing` is not declared in that domain-map `capabilities` list
- **WHEN** `validateGate('map_to_review')` runs
- **THEN** gate validation SHALL fail
- **AND** the error SHALL identify the missing capability id

#### Scenario: [ADDED] spec_groups folder conflicts are rejected
- **GIVEN** a domain-map contains two `spec_groups` entries with the same `folder`
- **WHEN** `validateGate('map_to_review')` runs
- **THEN** gate validation SHALL fail
- **AND** the error SHALL identify the duplicate spec folder

#### Scenario: [ADDED] Windows path separators are rejected in spec_groups folder
- **GIVEN** a domain-map contains `spec_groups[].folder: cli\\commands`
- **WHEN** the domain-map is parsed or validated
- **THEN** validation SHALL fail
- **AND** the error SHALL require a single path segment rather than a platform-specific path
