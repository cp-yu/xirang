# Concepts

This guide explains the core ideas behind Xirang and how they fit together. For practical usage, see [Getting Started](getting-started.md) and [Workflows](workflows.md).

## Philosophy

Xirang is built around four principles:

```
fluid not rigid         — no phase gates, work on what makes sense
iterative not waterfall — learn as you build, refine as you go
easy not complex        — lightweight setup, minimal ceremony
brownfield-first        — works with existing codebases, not just greenfield
```

### Why These Principles Matter

**Fluid not rigid.** Traditional spec systems lock you into phases: first you plan, then you implement, then you're done. Xirang is more flexible — you can create artifacts in any order that makes sense for your work.

**Iterative not waterfall.** Requirements change. Understanding deepens. What seemed like a good approach at the start might not hold up after you see the codebase. Xirang embraces this reality.

**Easy not complex.** Some spec frameworks require extensive setup, rigid formats, or heavyweight processes. Xirang stays out of your way. Initialize in seconds, start working immediately, customize only if you need to.

**Brownfield-first.** Most software work isn't building from scratch — it's modifying existing systems. Xirang's delta-based approach makes it easy to specify changes to existing behavior, not just describe new systems.

## The Big Picture

Xirang has one persisted Semantic Model in four partitions:

```text
.xirang/
├── model/              # The formal Semantic Model
│   ├── metamodel/      # Element Kinds and Relationship Kinds
│   ├── elements/       # Element Declarations with their Contracts
│   ├── relationships/  # Typed semantic relationships
│   └── views/          # Authored views
└── changes/            # Proposed Semantic Deltas and scaffolding
```

LikeC4 is generated from the complete model into `.xirang/.cache-likec4/` for visualization only and is never a persistence authority. The four partitions together express the current authorized human intent. Agents read these files directly and translate them into implementation; transient parser objects are implementation details, not a second persisted model.

Every model contains one Project Root. Each element has a stable `identity`, an authored `definition`, a `kind`, and at most one `parent`. Containment expresses abstraction and refinement at arbitrary depth. An Element Contract is the `## Requirements` body of its Element unit; whether a Contract is required comes from the `contract` field of its Element Kind, and each element has at most one Contract.

**Changes** remain separate until sync. A change-local Semantic Delta — four partitions under `.xirang/changes/<name>/` mirroring the model, each entry carrying `ADDED`, `MODIFIED`, or `REMOVED` — is validated against one Expected Semantic Model before atomic promotion.

## Element Contracts

Element Contracts describe your system's behavior using structured requirements and scenarios.

### Structure

```
.xirang/model/elements/
├── auth.md           # Authentication behavior
├── payments.md       # Payment processing
├── notifications.md  # Notification system
└── ui.md             # UI behavior and themes
```

Organize Element units by identity — stable, path-separator-free names that make sense for your system. Directory and file names carry no model semantics; loading locates entries by their declared `identity`.

Common patterns:

- **By feature area**: `auth`, `payments`, `search`
- **By component**: `api`, `frontend`, `workers`
- **By bounded context**: `ordering`, `fulfillment`, `inventory`

### Contract Format

An Element unit contains requirements, and each requirement has scenarios:

```markdown
---
entity: element-declaration
identity: auth.login
kind: operation
parent: auth
title: Login
---

## Requirements

### Requirement: User Authentication
The system SHALL issue a JWT token upon successful login.

#### Scenario: Valid credentials
- GIVEN a user with valid credentials
- WHEN the user submits login form
- THEN a JWT token is returned
- AND the user is redirected to dashboard

#### Scenario: Invalid credentials
- GIVEN invalid credentials
- WHEN the user submits login form
- THEN an error message is displayed
- AND no token is issued

### Requirement: Session Expiration
The system MUST expire sessions after 30 minutes of inactivity.

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated
- AND the user must re-authenticate
```

**Key elements:**

| Element | Purpose |
|---------|---------|
| `entity: element-declaration` | Frontmatter type marking this unit as an Element Declaration |
| `identity` | Stable identity of the element that owns this Contract |
| `kind` / `parent` | Element Kind and refinement parent of the Declaration |
| `## Requirements` | Element Contract body of the Element unit |
| `### Requirement:` | A specific behavior the system must have |
| `#### Scenario:` | A concrete example of the requirement in action |
| SHALL/MUST/SHOULD | RFC 2119 keywords indicating requirement strength |

### Why Structure Contracts This Way

**Requirements are the "what"** — they state what the system should do without specifying implementation.

**Scenarios are the "when"** — they provide concrete examples that can be verified. Good scenarios:
- Are testable (you could write an automated test for them)
- Cover both happy path and edge cases
- Use Given/When/Then or similar structured format

**RFC 2119 keywords** (SHALL, MUST, SHOULD, MAY) communicate intent:
- **MUST/SHALL** — absolute requirement
- **SHOULD** — recommended, but exceptions exist
- **MAY** — optional

### What a Spec Is (and Is Not)

A Spec is an **Element Contract**, not an implementation plan. It is the `## Requirements` body of its Element unit and may define observable behavior, parent guarantees, data shape, or another contract appropriate to the owning element kind.

Good spec content:
- Observable behavior users or downstream systems rely on
- Inputs, outputs, and error conditions
- External constraints (security, privacy, reliability, compatibility)
- Scenarios that can be tested or explicitly validated

Avoid in specs:
- Internal class/function names
- Library or framework choices
- Step-by-step implementation details
- Detailed execution plans (those belong in `design.md` or `tasks.md`)

Quick test:
- If implementation can change without changing externally visible behavior, it likely does not belong in the spec.

### Keep It Lightweight: Progressive Rigor

Xirang aims to avoid bureaucracy. Use the lightest level that still makes the change verifiable.

**Lite spec (default):**
- Short behavior-first requirements
- Clear scope and non-goals
- A few concrete acceptance checks

**Full spec (for higher risk):**
- Cross-team or cross-repo changes
- API/contract changes, migrations, security/privacy concerns
- Changes where ambiguity is likely to cause expensive rework

Most changes should stay in Lite mode.

### Human + Agent Collaboration

In many teams, humans explore and agents draft artifacts. The intended loop is:

1. Human provides intent, context, and constraints.
2. Agent converts this into behavior-first requirements and scenarios.
3. Agent keeps implementation detail in `design.md` and `tasks.md`, not in the Element unit.
4. Validation confirms structure and clarity before implementation.

This keeps Element Contracts readable for humans and consistent for agents.

## Changes

A change is a proposed modification to your system, packaged as a folder with everything needed to understand and implement it.

### Change Structure

```
.xirang/changes/add-dark-mode/
├── proposal.md           # Why and what
├── design.md             # How (technical approach)
├── tasks.md              # Implementation checklist
├── metamodel/            # Semantic Delta: Element/Relationship Kinds
├── elements/             # Semantic Delta: Element Declarations and Contracts
├── relationships/        # Semantic Delta: relationships
└── views/                # Semantic Delta: authored views
```

Each change is self-contained. It has:
- **Artifacts** — documents that capture intent, design, and tasks
- **Semantic Delta** — four partitions mirroring the model, each entry carrying `ADDED`, `MODIFIED`, or `REMOVED`
- **Metadata** — optional configuration for this specific change

### Why Changes Are Folders

Packaging a change as a folder has several benefits:

1. **Everything together.** Proposal, design, tasks, and the Semantic Delta live in one place. No hunting through different locations.

2. **Parallel work.** Multiple changes can exist simultaneously without conflicting. Work on `add-dark-mode` while `fix-auth-bug` is also in progress.

3. **Clean history.** When archived, changes move to `changes/archive/` with their full context preserved. You can look back and understand not just what changed, but why.

4. **Review-friendly.** A change folder is easy to review — open it, read the proposal, check the design, see the Semantic Delta.

## Artifacts

Artifacts are the documents within a change that guide the work.

### The Artifact Flow

```
proposal ──────► delta ──────► design ──────► tasks ──────► implement
    │               │             │              │
   why            what           how          steps
 + scope        changes       approach      to take
```

Artifacts build on each other. Each artifact provides context for the next.

### Artifact Types

#### Proposal (`proposal.md`)

The proposal captures **intent**, **scope**, and **approach** at a high level.

```markdown
# Proposal: Add Dark Mode

## Intent
Users have requested a dark mode option to reduce eye strain
during nighttime usage and match system preferences.

## Scope
In scope:
- Theme toggle in settings
- System preference detection
- Persist preference in localStorage

Out of scope:
- Custom color themes (future work)
- Per-page theme overrides

## Approach
Use CSS custom properties for theming with a React context
for state management. Detect system preference on first load,
allow manual override.
```

**When to update the proposal:**
- Scope changes (narrowing or expanding)
- Intent clarifies (better understanding of the problem)
- Approach fundamentally shifts

#### Semantic Delta (four partitions under `metamodel/`, `elements/`, `relationships/`, `views/`)

The Semantic Delta describes **what's changing** relative to the current Semantic Model. See [Semantic Delta](#semantic-delta) below.

#### Design (`design.md`)

The design captures **technical approach** and **architecture decisions**.

````markdown
# Design: Add Dark Mode

## Technical Approach
Theme state managed via React Context to avoid prop drilling.
CSS custom properties enable runtime switching without class toggling.

## Architecture Decisions

### Decision: Context over Redux
Using React Context for theme state because:
- Simple binary state (light/dark)
- No complex state transitions
- Avoids adding Redux dependency

### Decision: CSS Custom Properties
Using CSS variables instead of CSS-in-JS because:
- Works with existing stylesheet
- No runtime overhead
- Browser-native solution

## Data Flow
```
ThemeProvider (context)
       │
       ▼
ThemeToggle ◄──► localStorage
       │
       ▼
CSS Variables (applied to :root)
```

## File Changes
- `src/contexts/ThemeContext.tsx` (new)
- `src/components/ThemeToggle.tsx` (new)
- `src/styles/globals.css` (modified)
````

**When to update the design:**
- Implementation reveals the approach won't work
- Better solution discovered
- Dependencies or constraints change

#### Tasks (`tasks.md`)

Tasks are the **implementation checklist** — concrete steps with checkboxes.

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [ ] 1.2 Add CSS custom properties for colors
- [ ] 1.3 Implement localStorage persistence
- [ ] 1.4 Add system preference detection

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
- [ ] 2.2 Add toggle to settings page
- [ ] 2.3 Update Header to include quick toggle

## 3. Styling
- [ ] 3.1 Define dark theme color palette
- [ ] 3.2 Update components to use CSS variables
- [ ] 3.3 Test contrast ratios for accessibility
```

**Task best practices:**
- Group related tasks under headings
- Use hierarchical numbering (1.1, 1.2, etc.)
- Keep tasks small enough to complete in one session
- Check tasks off as you complete them

## Semantic Delta

Delta units are the key concept that makes Xirang work for brownfield development. They describe **what's changing** rather than restating the entire Element Contract.

### The Format

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST support TOTP-based two-factor authentication.

#### Scenario: 2FA enrollment
- GIVEN a user without 2FA enabled
- WHEN the user enables 2FA in settings
- THEN a QR code is displayed for authenticator app setup
- AND the user must verify with a code before activation

#### Scenario: 2FA login
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented
- AND login completes only after valid OTP

## MODIFIED Requirements

### Requirement: Session Expiration
The system MUST expire sessions after 15 minutes of inactivity.
(Previously: 30 minutes)

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 15 minutes pass without activity
- THEN the session is invalidated

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA. Users should re-authenticate each session.)
```

### Delta Sections

| Section | Meaning | What Happens on Archive |
|---------|---------|------------------------|
| `## ADDED Requirements` | New behavior | Appended to the Element Contract |
| `## MODIFIED Requirements` | Changed behavior | Replaces existing requirement |
| `## REMOVED Requirements` | Deprecated behavior | Deleted from the Element Contract |

### Why Deltas Instead of Full Contracts

**Clarity.** A delta shows exactly what's changing. Reading a full Contract, you'd have to diff it mentally against the current version.

**Conflict avoidance.** Two changes can touch the same Contract without conflicting, as long as they modify different requirements.

**Review efficiency.** Reviewers see the change, not the unchanged context. Focus on what matters.

**Brownfield fit.** Most work modifies existing behavior. Deltas make modifications first-class, not an afterthought.

## Schemas

Schemas define the artifact types and their dependencies for a workflow.

### How Schemas Work

```yaml
# package schemas/spec-driven/schema.yaml
name: spec-driven
artifacts:
  - id: proposal
    generates: proposal.md
    requires: []              # No dependencies, can create first

  - id: specs
    generates: "{elements,metamodel,relationships,views}/**/*"
    requires: [proposal]      # Needs proposal before creating

  - id: design
    generates: design.md
    requires: [proposal]      # Can create in parallel with specs

  - id: tasks
    generates: tasks.md
    requires: [specs, design] # Needs both specs and design first
```

**Artifacts form a dependency graph:**

```
                    proposal
                   (root node)
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
      specs (delta)              design
   (requires:                  (requires:
    proposal)                   proposal)
         │                           │
         └─────────────┬─────────────┘
                       │
                       ▼
                    tasks
                (requires:
                specs, design)
```

**Dependencies are enablers, not gates.** They show what's possible to create, not what you must create next. You can skip design if you don't need it. You can create delta units before or after design — both depend only on proposal.

### Built-in Schemas

**spec-driven** (default)

The standard workflow for spec-driven development:

```
proposal → delta → design → tasks → implement
```

Best for: Most feature work where you want to agree on requirements before implementation.

Xirang resolves only the package-owned `spec-driven` schema. Project-local and user override schemas are not supported. Project Build uses the Candidate contract directly rather than a separate artifact schema.

## Archive

Archiving completes a change by verifying and atomically syncing its Semantic Delta into the formal Xirang Semantic Model, then preserving the change for history.

### What Happens When You Archive

```
Before archive:

.xirang/
├── model/
│   └── elements/
│       └── auth.md ◄─────────────────┐
└── changes/                          │
    └── add-2fa/                      │
        ├── proposal.md               │ sync
        ├── design.md                 │
        ├── tasks.md                  │
        └── elements/                 │
            └── auth.md ──────────────┘


After archive:

.xirang/
├── model/
│   └── elements/
│       └── auth.md        # Now includes 2FA requirements
└── changes/
    └── archive/
        └── 2025-01-24-add-2fa/    # Preserved for history
            ├── proposal.md
            ├── design.md
            ├── tasks.md
            └── elements/
                └── auth.md
```

### The Archive Process

1. **Sync the Semantic Delta.** The four-partition Delta under `.xirang/changes/<name>/` is validated against one Expected Semantic Model, then `xirang sync` applies it to `.xirang/model/` atomically.

2. **Move to archive.** The change folder moves to `changes/archive/` with a date prefix for chronological ordering.

3. **Preserve context.** All artifacts remain intact in the archive. You can always look back to understand why a change was made.

### Why Archive Matters

**Clean state.** Active changes (`changes/`) shows only work in progress. Completed work moves out of the way.

**Audit trail.** The archive preserves the full context of every change — not just what changed, but the proposal explaining why, the design explaining how, and the tasks showing the work done.

**Model evolution.** All four partitions evolve together. Each archive preserves the approved Semantic Delta and the decisions that authorized it.

## How It All Fits Together

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Xirang FLOW                                   │
│                                                                              │
│   ┌────────────────┐                                                         │
│   │  1. START      │  /xirang:propose                                           │
│   │     CHANGE     │                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  2. CREATE     │  /xirang:propose                                           │
│   │     ARTIFACTS  │  Creates proposal → delta → design → tasks                 │
│   │                │  (based on schema dependencies)                            │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  3. IMPLEMENT  │  /xirang:apply                                            │
│   │     TASKS      │  Work through tasks, checking them off                  │
│   │                │◄──── Update artifacts as you learn                      │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  4. VERIFY     │  embedded in /xirang:archive                              │
│   │     WORK       │  Check implementation matches requirements                │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐     ┌──────────────────────────────────────────────┐    │
│   │  5. ARCHIVE    │────►│  The Semantic Delta syncs atomically       │    │
│   │     CHANGE     │     │  Change folder moves to archive/             │    │
│   └────────────────┘     │  The Semantic Model is now updated           │    │
│                          └──────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**The virtuous cycle:**

1. The Semantic Model describes current intent and contracts
2. Changes propose Element and relationship modifications as one Semantic Delta
3. Implementation makes the authorized changes real
4. Validation checks the Expected Semantic Model
5. Archive atomically syncs the approved delta
6. Next change builds on the updated model

## Glossary

| Term | Definition |
|------|------------|
| **Artifact** | A document within a change (proposal, design, tasks, or Semantic Delta units) |
| **Archive** | The process of completing a change and atomically syncing its Semantic Delta into the formal Semantic Model |
| **Change** | A proposed modification to the system, packaged as a folder with artifacts |
| **Delta unit** | A Semantic Delta entry carrying ADDED/MODIFIED/REMOVED relative to the current Semantic Model |
| **Element** | A stable Semantic Model node with an `identity`, `kind`, `definition`, and refinement `parent` |
| **Project Root** | The unique highest-level element expressing project intent |
| **Element Contract** | The `## Requirements` body of an Element unit; required per its Element Kind's `contract` field |
| **Domain** | A legacy grouping term; models may define any metamodel kinds |
| **Requirement** | A specific behavior the system must have |
| **Scenario** | A concrete example of a requirement, typically in Given/When/Then format |
| **Schema** | A definition of artifact types and their dependencies |
| **Semantic Delta** | Four partitions under `.xirang/changes/<name>/` expressing the change's ADDED/MODIFIED/REMOVED semantics |
| **Semantic Model** | The persisted Semantic Model under `.xirang/model/` (four partitions: metamodel, elements, relationships, views) |
| **Source of truth** | The formal Xirang Semantic Model under `.xirang/model/` |

## Next Steps

- [Getting Started](getting-started.md) - Practical first steps
- [Workflows](workflows.md) - Common patterns and when to use each
- [Commands](commands.md) - Full command reference
- [Customization](customization.md) - Configure projects and inspect built-in schemas
