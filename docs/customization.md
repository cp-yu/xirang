# Customization

OPSX provides project-level configuration and built-in schema inspection:

| Level | What it does | Best for |
|-------|--------------|----------|
| **Project Config** | Set defaults, inject context/rules | Most teams |
| **Built-in Schemas** | Select and inspect `spec-driven` | All projects |

---

## Project Configuration

The `.opsx/config.yaml` file is the easiest way to customize OPSX for your team. It lets you:

- **Set a default schema** - Skip `--schema` on every command
- **Set document prose language** - Tell OPSX which language to use for natural-language artifact body text
- **Inject project context** - Compile project background into prompt/runtime projection consumers
- **Add per-artifact rules** - Compile artifact-scoped authoring constraints without leaking the whole raw config

### Quick Setup

```bash
opsx setup
```

This walks you through creating a config interactively. Or create one manually:

```yaml
# .opsx/config.yaml
schema: spec-driven
docLanguage: zh-CN

context: |
  Tech stack: TypeScript, React, Node.js, PostgreSQL
  API style: RESTful, documented in docs/api.md
  Testing: Jest + React Testing Library
  We value backwards compatibility for all public APIs

rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format
    - Reference existing patterns before inventing new ones
```

`.opsx/config.yaml` stays intentionally small. OPSX compiles its validated whitelist fields into prompt and runtime projection bundles for downstream consumers.

`docLanguage` only applies to natural-language prose in OPSX artifacts. Template headings, IDs, schema keys, relation types, BDD keywords, file paths, commands, and code identifiers stay in their canonical form.

### How It Works

**Default schema:**

```bash
# Without config
opsx new change my-feature --schema spec-driven

# With config - schema is automatic
opsx new change my-feature
```

**Context and rules injection:**

When generating any artifact, OPSX exposes a compiled projection bundle plus compatibility fields derived from the same normalized inputs:

```xml
<config_projection>
- Use zh-CN for natural-language prose that you newly write or revise.
- Preserve canonical tokens unchanged: SHALL, MUST, section headers, scenario headers, BDD keywords, IDs, schema keys, paths, commands, and code identifiers.
Tech stack: TypeScript, React, Node.js, PostgreSQL
- Include rollback plan
- Identify affected teams
</config_projection>

<project_context>
Tech stack: TypeScript, React, Node.js, PostgreSQL
...
</project_context>

<rules>
- Include rollback plan
- Identify affected teams
</rules>

<template>
[Schema's built-in template]
</template>
```

- **Projection bundle** is the preferred contract for prompt/runtime consumers
- **Context** still appears in ALL artifacts as a compatibility field derived from the same normalized config
- **Rules** still appear only for the matching artifact as a compatibility field derived from the same normalized config

### Schema Resolution Order

When OPSX needs a schema, it checks in this order:

1. CLI flag: `--schema <name>`
2. Change metadata (`.opsx.yaml` in the change folder)
3. Project config (`.opsx/config.yaml`)
4. Default (`spec-driven`)

---

## Built-in Schemas

OPSX resolves one package-owned schema:

- `spec-driven` for proposal, specs, design, tasks, and apply workflows.

Project-local `.opsx/schemas/` directories and user schema directories are ignored. `opsx schema init` and `opsx schema fork` are not available.

Validate one or both built-in schemas:

```bash
opsx schema validate spec-driven
opsx schema validate
```

Inspect their package locations:

```bash
opsx schema which spec-driven
opsx schema which --all
```

Schema binding still follows CLI option → change metadata → project config → `spec-driven`, and no retired schema name is accepted.

## See Also

- [CLI Reference: Schema Commands](cli.md#schema-commands) - Full command documentation
