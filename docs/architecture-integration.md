# Xirang Semantic Model And LikeC4

Xirang has one durable Semantic Model. Versioned LikeC4 graph modules under `.xirang/architecture/` define the Project Root, element vocabulary, stable elements, refinement hierarchy, semantic relationships, and views. Markdown contract modules under `.xirang/specs/` define element-owned guarantees. Agents and CLI commands read these persisted files directly; Xirang does not require a public or persisted intermediate representation.

## Layout

```text
.xirang/
├── architecture/
│   ├── specification.c4
│   ├── model.c4
│   ├── relations.c4
│   └── views.c4
└── specs/
    └── <spec-id>/spec.md
```

A v1 graph declares its language version and metamodel explicitly. The metamodel may define project-specific element and relationship kinds. Nesting is open unless a kind declares `parents` or `children` constraints.

```likec4
xirang {
  languageVersion '1'
}

specification {
  element project {
    xirang { root true contract required }
  }
  element area {
    xirang { contract optional parents [project] }
  }
  element operation {
    xirang { contract required parents [area] }
  }
  relationship invokes {
    xirang { sourceKinds [operation] targetKinds [operation] }
  }
}

model {
  projectRoot = project 'Payments' 'Payment platform intent' {
    metadata { elementId 'project.root' }

    payments = area 'Payments' 'Payment processing area' {
      metadata { elementId 'payments' }

      authorize = operation 'Authorize' 'Authorize a payment' {
        metadata { elementId 'payment.authorize' }
      }
    }
  }
}
```

`elementId` is the stable identity. The current LikeC4 FQN is a navigation path and may change when an element moves. Containment expresses abstraction and refinement, not ownership inferred from a fixed domain/capability depth.

## Element Contracts

Each v1 Spec binds to one element through singular frontmatter:

```markdown
---
element: payment.authorize
---

# Payment Authorization

## Purpose
Define the authorization contract.
```

One element may own multiple Specs, but each Spec has at most one owner. The derived Spec registry scans `.xirang/specs/<spec-id>/spec.md`; graph metadata does not duplicate Spec paths. A metamodel kind may require a contract with `contract required` or allow it with `contract optional`.

## Commands

```bash
xirang view --port 5173
xirang arch query payment.authorize --relations --depth 2
xirang arch validate
xirang arch export --format svg --output docs/architecture
```

`xirang arch query` accepts a stable `elementId` or current FQN and returns the canonical `elementId`, parent, children, summary, owned Specs, and semantic relationships. `xirang view` uses the vendored LikeC4 source; there is no external runtime fallback.

## Semantic Delta

A change may contain graph operations in `.xirang/changes/<name>/architecture-delta.c4` and contract operations in `.xirang/changes/<name>/specs/**/spec.md`. Together they form one Semantic Delta.

```likec4
model {
  extend projectRoot.payments {
    capture = operation 'Capture' 'Capture an authorized payment' {
      metadata { elementId 'payment.capture' }
    }
  }

  projectRoot.payments.capture -[invokes]-> projectRoot.payments.authorize
}
```

Validate the combined target before implementation or sync:

```bash
xirang validate --change <name> --json
xirang arch validate --delta .xirang/changes/<name>/architecture-delta.c4
```

`xirang sync <name>` prepares and validates graph and contract modules together, then commits them atomically.

## Specs Browser Security

The local endpoint accepts `GET /__opsx/spec?project=<project-id>&element=<element-id>&path=<relative-path>`. Every request is authorized against the current derived Spec registry. Absolute paths, backslashes, traversal segments, non-Markdown files, unregistered element/path pairs, missing files, and symlink escapes are rejected. Responses disable caching, and watcher events contain only the precise project-relative Spec path.

## Legacy Models

Unversioned domain/capability LikeC4 models are not canonical v1 source and are never silently rewritten. They may only be consumed by `xirang-build` as user-approved evidence or an explicit Candidate starting point.
