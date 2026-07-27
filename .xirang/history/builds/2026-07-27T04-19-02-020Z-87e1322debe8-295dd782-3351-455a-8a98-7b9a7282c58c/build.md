# Project Build Authorization

## Authorized Scope

- Explore the entire project.
- Exclude generated output and dependency internals as semantic authorities; inspect them only when needed to verify packaging or integration boundaries.
- Treat the vendored `likec4/` tree as an implementation dependency, not as Xirang product intent.

## Sources of Truth

1. `xirang-definition.md` is authoritative for Xirang semantics and Realization responsibilities.
2. `xirang-contract.md` is authoritative for Semantic Model and Semantic Delta storage, notation, identity, synchronization, and semantic-difference rules.
3. Current user requirements in this build conversation override all repository evidence.

## Reference Evidence

- `.xirang/architecture/` is a legacy semantic inventory and relationship reference.
- `.xirang/specs/` is a legacy contract reference.
- Source code, tests, configuration, documentation, Git history, generated Agent surfaces, and package metadata are implementation evidence only.

## Build Decisions

- Initialize from a clean Candidate.
- Author one complete four-partition Semantic Model under `.xirang/candidate/`.
- Preserve stable legacy `elementId` values as identity candidates when they still denote current product semantics; do not persist LikeC4 FQNs or hierarchy paths as identities.
- Extract steady-state Requirements from legacy Specs; do not copy legacy descriptive or change-history prose into Element Contracts.
- Do not infer target hierarchy, contracts, or relationships solely from paths, imports, calls, tests, or implementation existence.
- Use the legacy Metamodel reference vocabulary `project`, `domain`, `capability`, `constrains`, `consumes`, `invokes`, `precedes`, `produces`, and `validates`; preserve its contract policies and avoid adding new Kind identities without user authorization.
- Map the durable Element hierarchy to the complete `xirang-definition.md` Definition Hierarchy; distinguish process activities from Agent work roles with stable `*-role` identities.
- Persist no Authored View until the user explicitly declares one; the Views partition may be empty because Element-derived and Change-derived Views are deterministic and non-persistent.
- Persist only Relationships directly supported by authoritative responsibilities or stage ordering; do not mirror implementation call graphs.
- Decompose each Element Contract into independently addressable Requirements whenever the authority states responsibilities, guarantees, constraints, or behaviors that can change separately; do not impose a mechanical minimum count or repeat Declaration summary prose.
- Resolve authority conflicts in favor of `xirang-definition.md`, then `xirang-contract.md`; ask the user about unresolved conflicts that would change target behavior or architecture.

## Confirmed Product Intent

Xirang is an Agent-oriented project development framework. It represents user intent through a Semantic Model, carries evolution intent through Changes, and realizes that intent through Semantic Model Build and Change Realization, with deterministic CLI operations and a Semantic Browser supporting the process.
