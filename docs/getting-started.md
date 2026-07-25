# Getting Started

This guide explains how Xirang works after you've built and initialized it. For source installation instructions, see [Installation](installation.md).

## How It Works

Xirang helps you and your AI coding assistant agree on what to build before any code is written.

**Default quick path:**

```text
/xirang:propose ──► /xirang:apply ──► /xirang:archive
```

Xirang installs a fixed managed workflow surface. `/xirang:archive` syncs the graph and contract modules of one Semantic Delta into the formal Xirang Semantic Model before archiving, and it runs a full verify gate before archive.

## What Xirang Creates

After running `xirang setup`, your project has a minimal formal skeleton. Project Build may later create one active Candidate and durable history:

```
.xirang/
├── architecture/       # Versioned graph modules and Project Root
│   ├── specification.c4
│   ├── model.c4
│   ├── relations.c4
│   └── views.c4
├── specs/              # Element-owned contract modules
│   └── <spec-id>/spec.md
├── changes/            # Proposed Semantic Deltas
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       ├── architecture-delta.c4
│       └── specs/<spec-id>/spec.md
├── candidate/          # Optional active Project Build Candidate
├── history/            # Promotion and retired-workspace audit evidence
└── config.yaml         # Project configuration
```

**Three key directories:**

- **`architecture/`** - The graph modules of the Xirang Semantic Model: Project Root, stable elements, refinement, semantic relationships, metamodel, and views.

- **`specs/`** - Element-owned contract modules. Each v1 Spec uses singular `element: <elementId>` frontmatter; one element may own multiple Specs.

- **`changes/`** - Proposed graph and contract deltas. Combined validation constructs the Target Semantic Model before sync/archive.

## Understanding Artifacts

Each change folder contains artifacts that guide the work:

| Artifact | Purpose |
|----------|---------|
| `proposal.md` | The "why" and "what" - captures intent, scope, and approach |
| `specs/` | Delta specs showing ADDED/MODIFIED/REMOVED requirements |
| `design.md` | The "how" - technical approach and architecture decisions |
| `tasks.md` | Implementation checklist with checkboxes |

**Artifacts build on each other:**

```
proposal ──► specs ──► design ──► tasks ──► implement
   ▲           ▲          ▲                    │
   └───────────┴──────────┴────────────────────┘
            update as you learn
```

You can always go back and refine earlier artifacts as you learn more during implementation.

## How Delta Specs Work

Delta specs are the key concept in Xirang. They show what's changing relative to your current specs.

### The Format

Delta specs use sections to indicate the type of change:

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

#### Scenario: OTP required
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented

## MODIFIED Requirements

### Requirement: Session Timeout
The system SHALL expire sessions after 30 minutes of inactivity.
(Previously: 60 minutes)

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA)
```

### What Happens on Archive

When you archive a change:

1. **ADDED** requirements are appended to the main spec
2. **MODIFIED** requirements replace the existing version
3. **REMOVED** requirements are deleted from the main spec

The change folder moves to `.xirang/changes/archive/` for audit history.

## Example: Your First Change

Let's walk through adding dark mode to an application.

### 1. Start the Change (Default)

```text
You: /xirang:propose add-dark-mode

AI:  Created .xirang/changes/add-dark-mode/
     ✓ proposal.md — why we're doing this, what's changing
     ✓ specs/       — requirements and scenarios
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

**specs/ui/spec.md** - Delta showing new requirements:

```markdown
# Delta for UI

## ADDED Requirements

### Requirement: Theme Selection
The system SHALL allow users to choose between light and dark themes.

#### Scenario: Manual toggle
- GIVEN a user on any page
- WHEN the user clicks the theme toggle
- THEN the theme switches immediately
- AND the preference persists across sessions

#### Scenario: System preference
- GIVEN a user with no saved preference
- WHEN the application loads
- THEN the system's preferred color scheme is used
```

**tasks.md** - Implementation checklist:

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [ ] 1.2 Add CSS custom properties for colors
- [ ] 1.3 Implement localStorage persistence

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
- [ ] 2.2 Add toggle to settings page
- [ ] 2.3 Update Header to include quick toggle

## 3. Styling
- [ ] 3.1 Define dark theme color palette
- [ ] 3.2 Update components to use CSS variables
```

### 3. Implement

```
You: /xirang:apply

AI:  Working through tasks...
     ✓ 1.1 Created ThemeContext with light/dark state
     ✓ 1.2 Added CSS custom properties to globals.css
     ✓ 1.3 Implemented localStorage persistence
     ✓ 2.1 Created ThemeToggle component
     ...
     All tasks complete!
```

During implementation, if you discover the design needs adjustment, update the artifact and continue. The persisted Semantic Model remains the authority for element identity, refinement, relationships, and contracts.

### 4. Archive

```
You: /xirang:archive

AI:  Archiving add-dark-mode...
     ✓ No fresh verify result found, running full verify
     ✓ Full verify passed
     ✓ Merged specs into .xirang/specs/ui/spec.md
     ✓ Moved to .xirang/changes/archive/2025-01-24-add-dark-mode/
     Done! Ready for the next feature.
```

Your delta specs are now part of the main specs, documenting how your system works.

## Verifying and Reviewing

Use the CLI to check on your changes:

```bash
# List active changes
xirang list

# View change details
xirang show add-dark-mode

# Validate spec formatting
xirang validate add-dark-mode

# Local Architecture and Specs browser
xirang view
```

## Next Steps

- [Workflows](workflows.md) - Common patterns and when to use each command
- [Commands](commands.md) - Full reference for all slash commands
- [Concepts](concepts.md) - Deeper understanding of specs, changes, and schemas
- [Customization](customization.md) - Make Xirang work your way
