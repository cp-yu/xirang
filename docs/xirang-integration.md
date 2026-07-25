# Xirang Programmatic Integration

The persisted Xirang Semantic Model is the only semantic authority. Programmatic consumers should read versioned `.xirang/architecture/**/*.c4` graph modules and element-owned `.xirang/specs/**/*.md` contract modules through Xirang/LikeC4 APIs or use the CLI. Source paths, imports, calls, and symbols remain current implementation evidence; they are not persisted semantic facts.

## Query Elements

```bash
xirang arch query <element-id-or-fqn> --relations --depth 2 --json
xirang arch validate --json
```

Query output canonicalizes identity to stable `elementId` and includes the current FQN, summary, parent, children, owned Specs, and directed semantic relationships.

## Read Element Contracts

Each v1 Spec uses singular ownership frontmatter:

```markdown
---
element: order.submit
---
```

Build or consume the derived Spec registry rather than reading graph `metadata.specs`. One element may own multiple Specs; each Spec binds to at most one element. Integrations that read Markdown must require project-relative `.md` paths, authorize the element/path pair against the current registry, and enforce realpath containment under `.xirang/specs/`.

## Change Integration

- Graph changes are declared in `.xirang/changes/<name>/architecture-delta.c4`.
- Contract changes are declared in `.xirang/changes/<name>/specs/**/spec.md`.
- Both module sets form one Target Semantic Model during validation.
- `xirang sync <name>` validates and commits the Semantic Delta atomically.
- `xirang archive <name>` enforces lifecycle gates and moves the change into audit history.

See [Xirang Semantic Model And LikeC4](architecture-integration.md) for the authoring contract.

## External Or Legacy Input

Former Xirang YAML bundles and unversioned LikeC4 models are never runtime fallbacks. `xirang-build` may consume them only as user-approved evidence or an explicit Candidate starting point.
