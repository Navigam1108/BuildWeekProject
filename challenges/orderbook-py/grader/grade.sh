#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspace}"
GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [ -d "$GRADER_DIR/hidden" ]; then HIDDEN_DIR="$GRADER_DIR/hidden"; else HIDDEN_DIR="/grader/hidden"; fi
if PYTHONPATH=. python -m unittest discover -s tests >/tmp/visible.out 2>&1; then visible_passed=3; visible_failed=0; else visible_passed=0; visible_failed=1; fi
candidate_ms="$(PYTHONPATH=. python benchmarks/bench.py | sed -n 's/.*candidate_ms=\([0-9.]*\).*/\1/p')"
if PYTHONPATH="$ROOT" python -m unittest discover -s "$HIDDEN_DIR" >/tmp/hidden.out 2>&1 && python - <<PY
import sys
sys.exit(0 if float("$candidate_ms") < 450 else 1)
PY
then hidden_passed=5; hidden_failed=0; verdict=strong; else hidden_passed=0; hidden_failed=5; verdict=developing; fi
improvement="$(python - <<PY
print(round(max(0, (4500-float("$candidate_ms"))/4500*100), 1))
PY
)"
printf 'REPORT_JSON:%s\n' "$(python - <<PY
import json
print(json.dumps({"tests":{"visible_passed":$visible_passed,"visible_failed":$visible_failed,"hidden_passed":$hidden_passed,"hidden_failed":$hidden_failed},"bench":{"candidate_ms":float("$candidate_ms"),"baseline_ms":4500,"target_ms":450,"improvement_pct":float("$improvement")},"missions":{"total":5,"strong_threshold":2},"verdict":"$verdict"}))
PY
)"
