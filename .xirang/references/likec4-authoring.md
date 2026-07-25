# LikeC4 Authoring

## Language And Metamodel

Author new OPSX Semantic Models with an explicit language version and project-specific vocabulary.

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
```

Nesting is open unless `parents` or `children` constraints are declared. Define constraints only when they express durable human intent.

## Elements

Every model has one Project Root. Use snake_case local LikeC4 IDs, stable `elementId` metadata, and a non-empty authored summary. Stable identity does not depend on the current containment path.

```likec4
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

Containment expresses abstraction and refinement. Do not infer ownership from a fixed nesting depth or emit a `belongs_to` relationship.

## Element Contracts

Bind each Spec to exactly one stable element in Markdown frontmatter:

```markdown
---
element: payment.authorize
---
```

One element may own multiple Specs. Do not add `metadata.specs`, `capabilityId`, or `capabilities: []` ownership indexes to v1 source.

## Relationships

Declare relationship kinds in the metamodel and author directed edges with kind syntax:

```likec4
projectRoot.payments.capture -[invokes]-> projectRoot.payments.authorize
```

Optional `sourceKinds` and `targetKinds` constraints validate endpoints. Preserve the authored source/kind/target direction.

## Change Delta

Extend an existing element by its current FQN, then give every new element a stable identity:

```likec4
model {
  extend projectRoot.payments {
    capture = operation 'Capture' 'Capture an authorized payment' {
      metadata { elementId 'payment.capture' }
    }
  }
}
```

A change-local Spec may bind to an element introduced by the same delta. Validate the combined target:

```bash
xirang validate --change <name> --json
xirang arch validate --delta .xirang/changes/<name>/architecture-delta.c4
```

## Legacy Authoring

Unversioned domain/capability models with `capabilityId` or `metadata.specs` are legacy migration input, not canonical v1 examples. Do not restore those fields or legacy YAML as runtime fallback behavior.
