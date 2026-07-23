# OPSX Programmatic Integration

The persisted OPSX Semantic Model is the only semantic authority. Programmatic consumers should read versioned `.opsx/architecture/**/*.c4` graph modules and element-owned `.opsx/specs/**/*.md` contract modules through OPSX/LikeC4 APIs or use the CLI. Source paths, imports, calls, and symbols remain current implementation evidence; they are not persisted semantic facts.

## Query Elements

```bash
opsx arch query <element-id-or-fqn> --relations --depth 2 --json
opsx arch validate --json
```

Query output canonicalizes identity to stable `elementId` and includes the current FQN, summary, parent, children, owned Specs, and directed semantic relationships.

## Read Element Contracts

Each v1 Spec uses singular ownership frontmatter:

```markdown
---
element: order.submit
---
```

Build or consume the derived Spec registry rather than reading graph `metadata.specs`. One element may own multiple Specs; each Spec binds to at most one element. Integrations that read Markdown must require project-relative `.md` paths, authorize the element/path pair against the current registry, and enforce realpath containment under `.opsx/specs/`.

## Change Integration

- Graph changes are declared in `.opsx/changes/<name>/architecture-delta.c4`.
- Contract changes are declared in `.opsx/changes/<name>/specs/**/spec.md`.
- Both module sets form one Target Semantic Model during validation.
- `opsx sync <name>` validates and commits the Semantic Delta atomically.
- `opsx archive <name>` enforces lifecycle gates and moves the change into audit history.

See [OPSX Semantic Model And LikeC4](architecture-integration.md) for the authoring contract.

## External Or Legacy Input

Former OPSX YAML bundles and unversioned LikeC4 models are never runtime fallbacks. `opsx-build` may consume them only as user-approved evidence or an explicit Candidate starting point.
