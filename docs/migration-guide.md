# Migration Guide

OPSX has one active CLI identity and one active workspace layout:

- CLI: `opsx`
- Workspace: `.opsx/`
- Behavior source: `.opsx/specs/**/*.md`
- Architecture source: `.opsx/architecture/**/*.c4`

There is no legacy CLI alias, directory fallback, dual read/write mode, or automatic workspace relocation.

## Move Project Content Explicitly

Commit or back up the repository first. Move durable content into `.opsx/` with normal filesystem or Git operations, then update links and automation to use `opsx` and `.opsx/`. OPSX will not discover a previous workspace name for you.

Preserve archive history as history. Do not rewrite archived change content solely to modernize terminology.

## Convert Former OPSX YAML Architecture

The explicit one-time converter remains available for repositories that already have the former OPSX YAML architecture bundle:

```bash
opsx migrate opsx-to-likec4 --dry-run
opsx migrate opsx-to-likec4
opsx arch validate
```

The command validates generated LikeC4 before preserving the YAML inputs with `.backup` suffixes. Runtime commands never read those backup files.

Review domain ownership, capability intent, relationship direction, and every `metadata.specs` path after conversion:

```bash
opsx arch query <element-id> --relations --depth 2
opsx view
```

## Refresh Managed Skills

```bash
opsx update
```

This regenerates OPSX-owned workflow skills for configured tools. User-authored files and archive history remain outside that managed output set.

## Validation Checklist

```bash
opsx --help
opsx validate --all --strict
opsx arch validate
opsx view --port 5173
```

- No active command invokes a legacy CLI name.
- No active workflow reads a workspace other than `.opsx/`.
- Formal Spec links resolve beneath `.opsx/specs/`.
- LikeC4 elements index Spec paths instead of embedding Markdown.
- CI installs and builds the root and vendored LikeC4 workspaces explicitly.
