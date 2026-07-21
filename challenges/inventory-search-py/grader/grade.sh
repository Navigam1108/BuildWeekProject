#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspace}"; GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"; HIDDEN_DIR="${GRADER_DIR}/hidden"; [ -d "$HIDDEN_DIR" ] || HIDDEN_DIR=/grader/hidden
if PYTHONPATH=. python -m unittest discover -s tests >/tmp/visible.out 2>&1; then visible_passed=2; visible_failed=0; else visible_passed=0; visible_failed=1; fi
measurement="$(PYTHONPATH="$ROOT" python "$GRADER_DIR/measure.py")"
candidate_ms="$(python -c 'import json,sys; print(round(sum(item["candidate_ms"] for item in json.load(sys.stdin)["missions"]), 3))' <<< "$measurement")"
baseline_ms="$(python -c 'import json,sys; print(round(sum(item["baseline_ms"] for item in json.load(sys.stdin)["missions"]), 3))' <<< "$measurement")"
target_ms="$(python -c 'import json,sys; print(round(sum(item["golden_ms"] for item in json.load(sys.stdin)["missions"]), 3))' <<< "$measurement")"
if PYTHONPATH="$ROOT" python -m unittest discover -s "$HIDDEN_DIR" >/tmp/hidden.out 2>&1; then hidden_passed=5; hidden_failed=0; else hidden_passed=0; hidden_failed=5; fi
if python -c 'import json,sys; sys.exit(0 if sum(bool(item["passed"]) for item in json.load(sys.stdin)["missions"]) >= 2 else 1)' <<< "$measurement" && [ "$hidden_failed" -eq 0 ]; then verdict=strong; else verdict=developing; fi
printf 'REPORT_JSON:%s\n' "$(python - <<PY
import json
v=float("$candidate_ms"); measurement=json.loads('''$measurement''' ); print(json.dumps({"tests":{"visible_passed":$visible_passed,"visible_failed":$visible_failed,"hidden_passed":$hidden_passed,"hidden_failed":$hidden_failed},"bench":{"candidate_ms":v,"baseline_ms":float("$baseline_ms"),"target_ms":float("$target_ms"),"improvement_pct":round(max(0,(float("$baseline_ms")-v)/float("$baseline_ms")*100),1)},"missions":measurement["missions"],"verdict":"$verdict"}))
PY
)"
