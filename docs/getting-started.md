# Getting Started

This guide explains how Xirang works after you've built and initialized it. For source installation instructions, see [Installation](installation.md).

## How It Works

Xirang helps you and your AI coding assistant agree on what to build before any code is written.

**Default quick path:**

```text
/xirang:propose ──► /xirang:apply ──► /xirang:archive
```

Xirang installs a fixed managed workflow surface. `/xirang:archive` checks the Quality Seal and applies the validated Semantic Delta in the same call that archives a Change. An explicitly abandoned Change can be archived without applying its Delta.

## What Xirang Creates

After running `xirang setup`, your project has a minimal formal skeleton. Project Build may later create one active Candidate and durable history:

```
.xirang/
├── model/              # The formal Semantic Model
│   ├── metamodel/      # Element and relationship kinds
│   ├── elements/       # Element Declarations with their Contracts
│   ├── relationships/  # Typed semantic relationships
│   └── views/          # Authored views
├── changes/            # Proposed Semantic Deltas
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       ├── metamodel/
│       ├── elements/
│       ├── relationships/
│       └── views/
├── candidate/          # Optional active Project Build Candidate
├── history/            # Promotion and retired-workspace audit evidence
└── config.yaml         # Project configuration
```

**Three key directories:**

- **`model/`** - The four-partition Semantic Model: `metamodel/` (Element and Relationship Kinds), `elements/` (Element Declarations and their Contracts), `relationships/`, and `views/`. Each Markdown unit declares its `entity` and stable `identity` in frontmatter; file positions are organizational only.

- **`changes/`** - Proposed Semantic Deltas. Each change mirrors the four partitions under `.xirang/changes/<name>/` with `ADDED`/`MODIFIED`/`REMOVED` operations. Combined validation constructs the Expected Semantic Model before delivery.

- **`candidate/`** - Optional active Project Build Candidate that can be promoted atomically into the Semantic Model.

## Understanding Artifacts

Each change folder contains artifacts that guide the work:

| Artifact | Purpose |
|----------|---------|
| `proposal.md` | The "why" and "what" - captures intent, scope, and approach |
| `metamodel/`, `elements/`, `relationships/`, `views/` | Semantic Delta units showing ADDED/MODIFIED/REMOVED operations |
| `design.md` | The "how" - technical approach and architecture decisions |
| `tasks.md` | Implementation checklist with checkboxes |

**Artifacts build on each other:**

```
proposal ──► delta ──► design ──► tasks ──► implement
   ▲          ▲          ▲                    │
   └──────────┴──────────┴────────────────────┘
            update as you learn
```

You can always go back and refine earlier artifacts as you learn more during implementation.

## How Semantic Delta Units Work

Semantic Delta units are the key concept in Xirang. They show what's changing relative to your current Semantic Model.

### The Format

Delta units use `## ADDED/MODIFIED/REMOVED Sections` headings for Section changes. This example changes only Sections of the existing `auth` Element; its Declaration is not modified.

```markdown
---
entity: element-declaration
identity: auth
kind: capability
parent: root
title: Authentication
definition: Authenticates users and manages their sessions.
---

## ADDED Sections

### Section: Two-Factor Authentication
When a user with two-factor authentication enabled submits valid credentials, the system MUST present a one-time password challenge.

## MODIFIED Sections

### Section: Session Timeout
The system SHALL expire sessions after 30 minutes of inactivity.

## REMOVED Sections

### Section: Remember Me
```

A REMOVED entry names the Section only; it does not carry a description or a reason for removal. In Delta headings, use `### Section: <name>` without Markdown closing hashes, so the heading identifies the exact Section.

### What Happens on Archive

When you deliver a Change with `xirang archive <change>` (default or `--quick`), the Semantic Delta is applied to the Formal model:

1. **ADDED** Sections are appended to the Element Contract
2. **MODIFIED** Sections replace the existing version
3. **REMOVED** Sections are deleted from the Contract

Delivered Changes move to `.xirang/changes/archive/` for audit history. To keep a Change without applying its Delta, use `xirang archive <change> --abandon`; it moves to `.xirang/changes/archive/abandoned/` and leaves the Formal model unchanged.

## Example: Your First Change

Let's walk through adding dark mode to an application. This example assumes the Formal model already has a `ui` Element of kind `capability`, under the Project Root `root`.

### 1. Start the Change (Default)

```text
You: /xirang:propose add-dark-mode

AI:  Created .xirang/changes/add-dark-mode/
     ✓ proposal.md — why we're doing this, what's changing
     ✓ elements/ui.md — Semantic Delta for the existing ui Element
     ✓ design.md    — technical approach
     ✓ tasks.md     — implementation checklist
     Post-propose check:
     - Fixed: tasks.md checkbox structure
     - Architecture: no delta
     Ready for implementation!
```

### 2. What Gets Created

**proposal.md** - Captures the intent:

```markdown
# Proposal: Add Dark Mode

## Intent
Users have requested a dark mode option to reduce eye strain
during nighttime usage.

## Scope
- Add theme toggle in settings
- Support system preference detection
- Persist preference in localStorage

## Approach
Use CSS custom properties for theming with a React context
for state management.
```

**`elements/ui.md`** - Delta showing a new Section on `ui`:

```markdown
---
entity: element-declaration
identity: ui
kind: capability
parent: root
title: User Interface
definition: Presents settings and application controls.
---

## ADDED Sections

### Section: Theme Selection
The system SHALL allow users to choose between light and dark themes.

- Clicking the theme toggle switches the theme immediately and persists the preference across sessions.
- With no saved preference, the system's preferred color scheme is used on load.
```

**tasks.md** - Implementation checklist:

```markdown
## Goals

- [ ] G1: Implement theme selection in settings
  - Contract: `ui` / Section "Theme Selection"
  - Verify: The toggle switches themes immediately, survives reload, and uses the system preference when no choice is saved.
```

### 3. Implement

```
You: /xirang:apply

AI:  Implemented the theme toggle, persistence, and the system default.
     ✓ G1: Theme Selection verification passed.
```

During implementation, if you discover the design needs adjustment, update the artifact and continue. The persisted Semantic Model remains the authority for element identity, refinement, relationships, and contracts.

### 4. Archive

```
You: /xirang:archive add-dark-mode

AI:  Archive stopped: a valid Quality Seal is required. Return to Apply.

You: /xirang:apply add-dark-mode

AI:  Independent Review passed and a Quality Seal was recorded.

You: /xirang:archive add-dark-mode

AI:  Applied the Semantic Delta and archived the Change at
     .xirang/changes/archive/2025-01-24-add-dark-mode/.
```

Your Semantic Delta is now part of the Semantic Model, documenting how your system works.

Only one archive can commit at a time in a workspace. Let Archive finish before editing or moving the selected Change, its destination, or any Formal files it writes. Archive does not recover interrupted work automatically. Before retrying, inspect `.xirang/model/` and the active and archived Change directories, including any `.archive-source-*` holding directory or `.xirang-sync-*` Formal staging directory named in a warning. An `.archive-lock-*` marker does not block retry when the local PID no longer exists or can be identified as a different process. If a marker still blocks Archive, inspect the workspace and remove it only after confirming its owner is no longer running.

## Verifying and Reviewing

Use the CLI to check on your changes:

```bash
# List active changes
xirang list

# View change details
xirang show add-dark-mode

# Validate the Semantic Delta and Expected Semantic Model
xirang validate add-dark-mode

# Local Architecture and Specs browser
xirang view
```

## Next Steps

- [Workflows](workflows.md) - Common patterns and when to use each command
- [Commands](commands.md) - Full reference for all slash commands
- [Concepts](concepts.md) - Deeper understanding of specs, changes, and schemas
- [Customization](customization.md) - Make Xirang work your way
