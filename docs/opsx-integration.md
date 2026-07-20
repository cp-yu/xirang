# OPSX Programmatic Integration

> [!WARNING]
> Deprecated legacy OPSX YAML reference. LikeC4 is the active architecture source. See [LikeC4 Architecture Integration](architecture-integration.md) and [Migration Guide](migration-guide.md).


## Overview

OPSX v2 stores the project architecture in exactly two files:

- `openspec/project.opsx.yaml` — project metadata, domains, and capabilities
- `openspec/project.opsx.relations.yaml` — directed semantic relations

The model provides stable architecture boundaries for validation, workflows, and AI navigation. Code locations remain live evidence and are discovered with optional CodeGraph or repository search tools.

## Project Model

```yaml
# openspec/project.opsx.yaml
schema_version: 2
project:
  id: proj.my-app
  name: My App
  intent: Application and API surface

domains:
  - id: dom.auth
    type: domain
    intent: Authentication boundary

capabilities:
  - id: cap.auth.login
    type: capability
    intent: Authenticate a user
```

Every capability has exactly one ownership relation:

```yaml
# openspec/project.opsx.relations.yaml
schema_version: 2
relations:
  - from: cap.auth.login
    type: belongs_to
    to: dom.auth
```

## Semantic Relations

OPSX v2 supports six relation types:

- `belongs_to` — capability ownership within one domain
- `invokes` — one capability actively triggers another
- `consumes` — one capability uses another capability's output or contract
- `precedes` — one capability must complete before another
- `constrains` — one capability limits another capability's valid behavior
- `validates` — one capability judges another capability's validity

The canonical endpoint rules, note policy, selection guide, and examples are in [`openspec/references/openspec-relation-authoring.md`](../openspec/references/openspec-relation-authoring.md).

Do not infer semantic relations mechanically from imports or calls. Use code evidence to form candidates, then select a relation only when the interaction mechanism is clear.

## Workflow Integration

### Propose

A change may include `opsx-delta.yaml`:

```yaml
schema_version: 2
ADDED:
  capabilities:
    - id: cap.auth.logout
      type: capability
      intent: End a user session
  relations:
    - from: cap.auth.logout
      type: belongs_to
      to: dom.auth
MODIFIED: {}
REMOVED: {}
```

### Apply

Apply uses project metadata and semantic relation paths as architecture context. It locates implementation evidence from the current repository rather than from persisted path mappings.

### Sync and archive

Sync applies the reviewed delta to the two-file model and validates the complete relation graph. Archive runs the verification gates before linking the change into the main specs and OPSX files.

## Query and Authoring Help

```bash
openspec opsx query cap.auth.login --json
openspec opsx query cap.auth.login --depth 2 --json
openspec help authoring
openspec help authoring project.opsx.relations.yaml
openspec help authoring opsx-delta.yaml --json
```

Query output preserves relation direction and type. Use CodeGraph, ACE, `rg`, or `read` after semantic navigation when implementation locations are needed.

## Validation

The v2 validator checks:

- schema version and the fixed two-file layout
- relation endpoint kinds and dangling endpoints
- exactly one `belongs_to` relation per capability
- duplicate edges and self-loops
- note policy and length
- forbidden `precedes` cycles

Other semantic cycles are reported as non-blocking diagnostics for review.

```bash
openspec validate --all
```

## Bootstrap

For an existing repository:

```bash
/opsx:bootstrap
```

Bootstrap discovers a complete candidate from current source, specs, configuration, and reviewed evidence. Imports and calls are candidate evidence only. Promotion writes the two formal v2 files after semantic review.

See [OPSX Bootstrap Workflow](./opsx-bootstrap.md).

## API

```typescript
import { readProjectOpsx, writeProjectOpsx } from './utils/opsx-utils.js';

const bundle = await readProjectOpsx(projectRoot);
if (bundle) {
  console.log(bundle.domains, bundle.capabilities, bundle.relations);
}

await writeProjectOpsx(projectRoot, {
  schema_version: 2,
  project: { id: 'proj.my-app', name: 'My App' },
  domains: [{ id: 'dom.core', type: 'domain' }],
  capabilities: [{ id: 'cap.core.start', type: 'capability' }],
  relations: [{ from: 'cap.core.start', type: 'belongs_to', to: 'dom.core' }],
});
```

## Migration

OPSX v1 files are not normalized at runtime. Rebuild the architecture with bootstrap, review every relation by mechanism, and validate the resulting v2 graph. This explicit migration prevents vague dependencies and stale path evidence from silently entering the semantic model.
