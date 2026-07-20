#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspace}"
GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [ -d "$GRADER_DIR/hidden" ]; then HIDDEN_DIR="$GRADER_DIR/hidden"; else HIDDEN_DIR="/grader/hidden"; fi
if PYTHONPATH=. python -m unittest discover -s tests >/tmp/visible.out 2>&1; then visible_passed=3; visible_failed=0; else visible_passed=0; visible_failed=1; fi
candidate_ms="$(PYTHONPATH=. python benchmarks/bench.py | sed -n 's/.*candidate_ms=\([0-9.]*\).*/\1/p')"
target_ms=1000
baseline_ms=60000
if PYTHONPATH="$ROOT" python -m unittest discover -s "$HIDDEN_DIR" >/tmp/hidden.out 2>&1 && python - <<PY
import sys
sys.exit(0 if float("$candidate_ms") < $target_ms else 1)
PY
then hidden_passed=4; hidden_failed=0; sla_met=true; else hidden_passed=0; hidden_failed=4; sla_met=false; fi
if [ "$sla_met" = true ]; then sla_met_json=True; else sla_met_json=False; fi
improvement="$(python - <<PY
print(round(max(0, (60000-float("$candidate_ms"))/60000*100), 1))
PY
)"
if [ "$visible_failed" -eq 0 ] && [ "$hidden_failed" -eq 0 ]; then verdict=pass; else verdict=partial; fi
diff_stat="$(git diff --numstat 2>/dev/null || true)"
files_changed="$(printf '%s\n' "$diff_stat" | awk 'NF {count++} END {print count+0}')"
insertions="$(printf '%s\n' "$diff_stat" | awk 'NF {sum+=$1} END {print sum+0}')"
deletions="$(printf '%s\n' "$diff_stat" | awk 'NF {sum+=$2} END {print sum+0}')"
printf 'REPORT_JSON:%s\n' "$(python - <<PY
import json
print(json.dumps({"tests":{"visible_passed":$visible_passed,"visible_failed":$visible_failed,"hidden_passed":$hidden_passed,"hidden_failed":$hidden_failed},"bench":{"candidate_ms":float("$candidate_ms"),"baseline_ms":$baseline_ms,"target_ms":$target_ms,"improvement_pct":float("$improvement"),"sla_met":$sla_met_json},"diff":{"files_changed":$files_changed,"insertions":$insertions,"deletions":$deletions},"verdict":"$verdict"}))
PY
)"
