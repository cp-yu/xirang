## Why

The current Quality protocol duplicates Git-owned code recovery and compares persisted evidence with the current workspace, while its multi-file runtime store cannot express the desired compact, reviewable workflow. A new protocol is needed to make Review opinions, optional Opt opinions, and the Seal declaration the only authoritative Quality record.

## What Changes

**BREAKING**: Replace the legacy snapshot/log/evidence protocol with one Git-tracked JSON record containing Review opinions, Opt opinions or an explicit no-Opt disposition, and the current Seal declaration. Bind opinions and Seal to Git commits; leave code history and recovery to Git, and make Archive check only that the Seal commit still exists. Do not read, migrate, rewrite, or clean up legacy records.

Remove the `checkpoint` and `quality-freshness` Elements. Keep Reviewer read-only; the main Agent handles Review corrections and any `tasks.md` updates.

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `quality`: Define the Review → optional Opt → Seal protocol and the entry conditions for Change Closure.
- `review`: Bind each Review opinion to a committed code state; route findings and corrections to the main Agent.
- `reviewer`: Keep independent assessment read-only and return a commit-bound opinion.
- `reviewer-protocol`: Replace task writeback instructions with the new opinion payload and commit association.
- `optimization`: Keep Opt optional and risk-directed while associating delivered opinions with base and result commits.
- `optimizer`: Deliver Opt opinions against Git commit identities; rely on Git for code recovery.
- `optimizer-protocol`: Align Opt inputs and delivered results with the new commit-bound protocol.
- `optimization-execution`: Remove Quality checkpoint/progress persistence; retain opinion delivery and Git-based recovery.
- `optimizer-findings`: Persist the useful Opt opinion and delivery history without a separate evidence store.
- `quality-cli-gate`: Define the new JSON-backed Review, Opt disposition, status, Seal, and Archive checks.
- `quality-writeback`: Replace task mutation, snapshots, and event logs with atomic CAS updates to one JSON record.
- `quality-orchestration`: Coordinate Review, optional Opt, main-Agent decisions, and Seal without Quality checkpoints.
- `change-implementation`: Make Seal, rather than a successful checkpoint and recorded test ledger, the Quality completion declaration.
- `change-closure`: Enter closure after the Quality gate and retain independent Sync and Archive gates.
- `change-sync`: Consume the new Seal gate without code-manifest freshness checks.
- `apply`: Route Review corrections and task-state decisions through the main Agent.
- `apply-quality-integration`: Remove automatic task writeback and old checkpoint/recovery orchestration.
- `apply-workflow`: Route the existing `needs_review` / `needs_optimize` states through the new Quality flow.
- `quality-aware-instructions`: Derive apply state from Review, Opt disposition, Seal, and resolvable commit references rather than workspace freshness.
- `archive-quality-gate`: Require the new Seal record and resolve its commit; keep Sync, validation, and task gates separate.
- `change-archive`: Report the new Quality result without claiming current-worktree equivalence or a successful-checkpoint history.
- `agent-prompt-guidance`: Project the new commit-bound record and recovery protocol into Apply and Archive guidance.
- `workflow-templates`: Replace the checkpoint state-machine projection with the new Quality flow.
- `list-command`: Report Quality status from the new record and Seal without comparing code manifests.

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- `quality`: Redefine the Quality boundary around Review opinions, optional Opt opinions, and Seal.
- `review`: Make its assessed state an explicit Git commit association.
- `reviewer`: Define the read-only, commit-bound opinion responsibility.
- `optimizer`: Define commit-bound Opt delivery and Git-owned recovery.
- `optimization-execution`: Narrow persistence to delivered opinions rather than progress and checkpoint state.
- `quality-cli-gate`: Own deterministic association checks for the new protocol.
- `quality-writeback`: Own the single JSON record and atomic CAS writes, not task edits or duplicate stores.
- `quality-orchestration`: Coordinate decisions and Git-based recovery without Quality checkpoint ownership.
- `apply-quality-integration`: Remove Quality-owned task mutation from its boundary.
- `archive-quality-gate`: Limit Quality's Archive responsibility to resolving the Seal commit.
- `agent-prompt-guidance`: Project the changed Quality and recovery boundary.

#### Removed Elements

- `checkpoint`: Git owns code-state recovery and commit history.
- `quality-freshness`: Seal and Archive do not compare the bound commit with HEAD or the working tree.

#### Architecture Relations

- None. Existing Quality, Apply, Sync, and Archive collaboration remains; their contracts change to use the new Seal and commit associations.

## Impact

- Replace the Quality runtime store, CLI schemas/commands, status derivation, and Archive Quality gate.
- Update Apply, Reviewer, Optimizer, and Archive workflow templates and their generated references/agent artifacts.
- Track the new `.quality.json` per Change; leave `.gitignore` and all legacy local/archive records unchanged.
- Update Quality, instruction, Sync, Archive, workflow-generation, and cross-platform path tests.
