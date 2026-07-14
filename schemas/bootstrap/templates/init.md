# Bootstrap Init

Phase: init
Baseline: {{ baseline_type }}
Mode: {{ mode }}
Created: {{ date }}

Supported upgrade paths:
- specs-based -> full
- raw -> full
- raw -> opsx-first
- formal-opsx -> refresh

Mode contract:
- full => formal OPSX + complete valid specs
- opsx-first => formal OPSX + README-only starter
- refresh => complete candidate from current evidence; the old formal OPSX v2 model is review-only evidence

Granularity contract:
- initial init requires explicit `--granularity coarse|fine`
- completed workspace restart inherits retained `scope.yaml` granularity when omitted
- explicit restart granularity overrides the retained value

Next phase:
- run `openspec bootstrap advance scan`
- verify `openspec bootstrap status --json` reports `phase: scan`
- do not edit `.bootstrap.yaml` or call internal APIs
