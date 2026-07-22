# OPSX Semantic Model And LikeC4

OPSX has one durable Semantic Model. Versioned LikeC4 graph modules under `.opsx/architecture/` define the Project Root, element vocabulary, stable elements, refinement hierarchy, semantic relationships, and views. Markdown contract modules under `.opsx/specs/` define element-owned guarantees. Agents and CLI commands read these persisted files directly; OPSX does not require a public or persisted intermediate representation.

## Layout

```text
.opsx/
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
opsx {
  languageVersion '1'
}

specification {
  element project {
    opsx { root true contract required }
  }
  element area {
    opsx { contract optional parents [project] }
  }
  element operation {
    opsx { contract required parents [area] }
  }
  relationship invokes {
    opsx { sourceKinds [operation] targetKinds [operation] }
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

One element may own multiple Specs, but each Spec has at most one owner. The derived Spec registry scans `.opsx/specs/<spec-id>/spec.md`; graph metadata does not duplicate Spec paths. A metamodel kind may require a contract with `contract required` or allow it with `contract optional`.

## Commands

```bash
opsx view --port 5173
opsx arch query payment.authorize --relations --depth 2
opsx arch validate
opsx arch export --format svg --output docs/architecture
```

`opsx arch query` accepts a stable `elementId` or current FQN and returns the canonical `elementId`, parent, children, summary, owned Specs, and semantic relationships. `opsx view` uses the vendored LikeC4 source; there is no external runtime fallback.

## Semantic Delta

A change may contain graph operations in `.opsx/changes/<name>/architecture-delta.c4` and contract operations in `.opsx/changes/<name>/specs/**/spec.md`. Together they form one Semantic Delta.

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
opsx validate --change <name> --json
opsx arch validate --delta .opsx/changes/<name>/architecture-delta.c4
```

`opsx sync <name>` prepares and validates graph and contract modules together, then commits them atomically.

## Specs Browser Security

The local endpoint accepts `GET /__opsx/spec?project=<project-id>&element=<element-id>&path=<relative-path>`. Every request is authorized against the current derived Spec registry. Absolute paths, backslashes, traversal segments, non-Markdown files, unregistered element/path pairs, missing files, and symlink escapes are rejected. Responses disable caching, and watcher events contain only the precise project-relative Spec path.

## Legacy Models

Unversioned domain/capability LikeC4 models remain readable only as the legacy profile. They are not the canonical v1 authoring format and are never silently rewritten. Use the explicit migration workflow documented in [Migration Guide](migration-guide.md) to generate and review a v1 candidate.
