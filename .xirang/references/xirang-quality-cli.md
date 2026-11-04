# Quality CLI

Quality stores commit-bound Review opinions, an explicit Opt disposition and a main-agent Seal in one .quality.json record.
The CLI validates structure, revision and Git commit existence. It does not run tests, compare HEAD/workspace freshness, edit tasks.md or choose whether Opt is needed.
Subcommands: xirang quality review, xirang quality opt, xirang quality seal, xirang quality status
--version <number>: expected record revision
--input <json>: JSON payload
--from <file>: JSON file
--json: Output JSON
Exit 0: the opinion was recorded or status was read successfully
Exit 1: a workflow prerequisite or referenced Git commit is missing
Exit 2: the payload, revision, path or stored format was rejected

xirang quality review <change-name> --version <number> --input <json>|--from <file>

Record one Reviewer opinion bound to an existing Git commit. Review findings and any task corrections remain with the main Agent. Revisions are compare-and-swap tokens.

**review**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"reviewId":{"type":"string","minLength":1},"scope":{"type":"string","minLength":1},"commit":{"type":"string","minLength":1},"result":{"type":"string","enum":["PASS","FAIL"]},"summary":{"type":"string","minLength":1},"findings":{"type":"array","items":{"type":"string","minLength":1}}},"required":["reviewId","scope","commit","result","summary","findings"],"additionalProperties":false}
```

xirang quality opt <change-name> --version <number> --input <json>|--from <file>

Record delivered Opt opinions bound to baseCommit/resultCommit, or an explicit not_performed reason. The CLI does not select the disposition or run tests.

**opt**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","anyOf":[{"type":"object","properties":{"disposition":{"type":"string","const":"not_performed"},"reason":{"type":"string","minLength":1}},"required":["disposition","reason"],"additionalProperties":false},{"type":"object","properties":{"disposition":{"type":"string","const":"delivered"},"opinions":{"minItems":1,"type":"array","items":{"type":"object","properties":{"opinionId":{"type":"string","minLength":1},"baseCommit":{"type":"string","minLength":1},"resultCommit":{"type":"string","minLength":1},"summary":{"type":"string","minLength":1},"findings":{"type":"array","items":{"type":"string","minLength":1}}},"required":["opinionId","baseCommit","resultCommit","summary","findings"],"additionalProperties":false}}},"required":["disposition","opinions"],"additionalProperties":false}]}
```

xirang quality seal <change-name> --version <number> --input <json>|--from <file>

The main Agent declares canRun, testsExpectedToPass, testScope and assessment for an existing commit. Seal does not compare that commit to HEAD or the workspace.

**seal**

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"commit":{"type":"string","minLength":1},"canRun":{"type":"boolean"},"testsExpectedToPass":{"type":"boolean"},"testScope":{"type":"string","minLength":1},"assessment":{"type":"string","minLength":1}},"required":["commit","canRun","testsExpectedToPass","testScope","assessment"],"additionalProperties":false}
```

Read the reported revision and diagnostic. Reconcile concurrent changes before retrying. Preserve unsupported legacy files unchanged; the new protocol never imports their contents.