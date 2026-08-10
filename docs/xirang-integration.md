# Xirang Programmatic Integration

The persisted Xirang Semantic Model is the only semantic authority. Programmatic consumers should use the CLI or read the four partitions under `.xirang/model/` through Xirang model APIs. Source paths, imports, calls, and symbols remain implementation evidence; they are not persisted semantic facts.

## Load Semantic Context

```bash
xirang arch outline --format json
xirang arch search <query> --json
xirang arch impact <identity> --depth 2 --json
xirang arch query <selected-identities...> --contract --json
xirang arch validate --json
```

Outline returns the complete Element hierarchy, all Relationships, and complete Metamodel Kinds with depth-bounded Definitions. Impact returns identity-only refinement and Relationship context plus canonical paths. Batch query returns complete Declarations for only the explicit stable identities and optionally their owned Contracts; it does not expand children or Relationships. File paths and generated LikeC4 names do not define identity.

## Read Element Contracts

An Element Contract is the `## Requirements` body of its Element unit under `.xirang/model/elements/`. Resolve an Element through the model identity index instead of constructing a file path from its identity. Each Requirement has a stable name within its host Element, and each Scenario remains part of its Requirement.

## Browser Contract API

The embedded Semantic Browser reads Element Contracts from `/__xirang/contract` using `project`, `element`, and optional `variant` query parameters. A valid lookup returns the Element identity and Contract Markdown; a missing Contract returns 404 and is treated as no Contract. The endpoint is a local Browser transport, not a second semantic source.

## Change Integration

- Semantic Delta Entries are declared under `.xirang/changes/<name>/{elements,metamodel,relationships,views}/`.
- `proposal.md`, `design.md`, and `tasks.md` are Change Plan scaffolding and do not override Semantic Delta semantics.
- `xirang show <name> --json` returns a compiler-derived Change view with `valid`, entity-level `summary`, concise `entries`, and `diagnostics`.
- `xirang validate --change <name> --json` validates notation, applies the Delta to the current model, and validates the Expected Semantic Model.
- `xirang sync <name>` applies a valid Semantic Delta atomically.
- `xirang archive <name>` enforces lifecycle gates and moves the complete Change into audit history.

See [Xirang Semantic Model And LikeC4](architecture-integration.md) for the persistence and authoring contract.

## External Or Legacy Input

Former Xirang bundles, persisted LikeC4 graphs, change-local `specs/`, and `architecture-delta.c4` are never runtime fallbacks. Model build or migration may consume them only as explicitly authorized evidence.
