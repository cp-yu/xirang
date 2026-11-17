# Apply verification evidence

## Review correction: transaction order

The independent full-change Review of `477a5c464b8e6632a56b3bb36009834fc88dd4c8` failed for insufficient isolated order-regression coverage and missing actual Agent observations. The original FAIL remains in Quality history.

`test/core/quality/engine.test.ts` now isolates the temporal condition from commit ancestry: PASS(A), premature incremental PASS(B), delivery A→B. Status must remain `needs_review`; Seal must reject with `POST_OPT_REVIEW_REQUIRED` without changing Quality bytes. A later incremental PASS(B) then permits Seal.

The 15-test engine suite passed. A one-time mutation removing only `review.recordedRevision <= changed.recordedRevision` from `postOptReviewGap()` caused the new test to fail: status incorrectly became `needs_optimize`. The exact implementation bytes were restored in `finally`. Logs: `/tmp/xirang-order-test.log`, `/tmp/xirang-order-mutation.log`. This supports detection of that specific regression, not arbitrary ordering bugs.

## Actual stage consumption observation

Run `09e98c89-3a04-4466-8877-82cb93457177` used the generated common/configuration guidance in one Agent context with an isolated configuration fixture (`/tmp/apply-opt-stage-scope-25i76gyl`). The Agent executed Explore → Apply → Explore queries and authored decisions using EXPLORE_ONLY → APPLY_ONLY → EXPLORE_ONLY. No unrelated stage was queried. The report records exact commands/outputs, generated surfaces inspected and limitations.

Authoritative session artifact: `subagent-artifacts/outputs/09e98c89-3a04-4466-8877-82cb93457177/experiments/apply-opt-stage-scope.md`, under the parent Pi session directory for AirwayManagementDevice. This is an actual consumption observation, not a complete stage lifecycle or evidence of stable effect.

## Actual Optimizer and Review observations

Workflow `c4af9a24-806e-4616-a1d8-7557a462a10a` ran nine separately delegated roles using copies of the final generated Reviewer, Optimizer, Experimenter and common/reference guidance. The fixture was `/tmp/xirang-opt-mode-observation-epi9wq4o`; no production code was modified.

The earlier attempt (`30527056-48fc-491a-b198-f4b617646b0f`) stopped correctly on an actual baseline FAIL: `[1e16, 1, -1e16]` did not distinguish forward/reverse summation. The coordinator recorded that FAIL, added `[1e16, -1e16, 1] → 1`, reran tests and committed the correction before a fresh baseline Review. The failure was not discarded or counted as a successful observation.

Observed sequence:

1. Independent full-change PASS at fixture `b37702ddc417848d66f53358b70585155a5da42f`; initial inspection found an unnecessary sum copy and a separate formatting opportunity. All 57 tracked hashes and HEAD matched the pre-inspection snapshot.
2. Implementation authorization covered `src/sum.js` only. The Optimizer removed the identity map, ran preservation checks, reported formatting outside scope and created no commit. Hashes outside sum remained identical. The coordinator independently checked scope/tests and committed only sum as `77e69ca3c8f6cac8c2c45bbb94e5fc8c8796f431`.
3. Recorded changed delivery produced `needs_review`. Seal before renewed Review rejected with `POST_OPT_REVIEW_REQUIRED`; exact Quality bytes were unchanged. A later no-change inspection did not erase that obligation.
4. An independent incremental Reviewer returned PASS on the actual new commit. Fresh read-only inspection recommended stopping sum work with concrete benefit/cost/risk reasons and preserved the declined formatting opportunity.
5. The exact PASS and actual no-change inspection were recorded; Seal on the reviewed commit succeeded, revision 7, `all_done`, no gaps.

Two fixture tests passed, including order-sensitive numeric evaluation and input immutability; ten frozen numeric arrays matched the baseline with `Object.is`. Formatting remained unchanged. Removal of one traversal and O(n) allocation is a source-level observation; no speedup was measured.

Authoritative artifacts, relative to the parent Pi session directory: `subagent-artifacts/outputs/c4af9a24-806e-4616-a1d8-7557a462a10a/observations/{baseline-review.json,prepare.md,inspection.md,inspection-check.md,implementation.md,delivery.md,post-review.json,stopping.md,final-report.md}`. Each child also retains its session JSONL under that session directory and its run ID. Fixture `observer-final/` contains hash snapshots, verification scripts, exact Quality inputs/results and command/exit/output transcripts; `final-report.md` links these files.

Available model metadata identifies parent provider `llmgw`, model `gpt-6.1-sol`, thinking `high`. No explicit worker model/thinking setting was exposed, so the parent metadata does not independently identify each worker. Reports disclose this limitation. These are bounded one-time observations with explicit task prompts; they establish neither stable Agent effects nor production performance gains, exhaustive correctness, or complete lifecycles. Windows CI coverage was expanded but Windows was not run locally. Temporary fixtures/logs are supplementary evidence, not reproducible benchmark infrastructure.

## Review correction: persisted history ordering

The second independent full-change Review (`bfede4bb18a139419981d4ca08fa613d5d49ab0e`) accepted the temporal regression and bounded Agent observations, but failed for missing regression protection of malformed persisted histories. That actual FAIL remains in Quality history.

Four named cases now persist decreasing Review revisions, duplicate Review revisions, decreasing Opt revisions and a shared Review/Opt revision. Each requires `INVALID_QUALITY_RECORD` and byte-for-byte preservation. Before corrupting the record, each case reads the valid API-created history successfully, including a same-transaction Opt batch with revisions `[3, 3, 4]` across three opinions.

The engine and CLI suites passed 23 tests. Three separate one-time mutations disabled Review ordering, Opt ordering and shared-revision exclusion respectively. The corresponding two Review cases, Opt case and shared case failed because malformed input was accepted. Logs: `/tmp/xirang-history-tests.log` and `/tmp/xirang-history-mutation-{review-order,opt-order,shared-revision}.log`. Implementation bytes were restored in `finally`; TypeScript checking, file diagnostics and diff checking passed. No production behavior changed in either Review correction.
