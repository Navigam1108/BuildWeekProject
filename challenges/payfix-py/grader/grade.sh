#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspace}"
GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [ -d "$GRADER_DIR/hidden" ]; then HIDDEN_DIR="$GRADER_DIR/hidden"; else HIDDEN_DIR="/grader/hidden"; fi

if PYTHONPATH=. python -m unittest discover -s tests >/tmp/visible.out 2>&1; then visible_passed=5; visible_failed=0; else visible_passed=0; visible_failed=1; fi
if PYTHONPATH="$ROOT" python -m unittest discover -s "$HIDDEN_DIR" >/tmp/hidden.out 2>&1; then hidden_passed=4; hidden_failed=0; else hidden_passed=0; hidden_failed=4; fi
bench="$(PYTHONPATH=. python benchmarks/bench.py)"
metric() { printf '%s' "$bench" | sed -n "s/.*$1_ms=\\([0-9.]*\\).*/\\1/p"; }
matching_ms="$(metric matching)"; duplicates_ms="$(metric duplicates)"; currency_ms="$(metric currency)"; validation_ms="$(metric validation)"; exceptions_ms="$(metric exceptions)"
python - "$visible_failed" "$hidden_failed" "$matching_ms" "$duplicates_ms" "$currency_ms" "$validation_ms" "$exceptions_ms" <<'PY'
import json
import sys

visible_failed, hidden_failed = map(int, sys.argv[1:3])
values = list(map(float, sys.argv[3:]))
definitions = [
    ("matching", "Ledger matching", 381.0, 1.7, 15.0),
    ("duplicates", "Duplicate grouping", 1376.0, 0.7, 20.0),
    ("currency", "Currency reference lookup", 22.4, 0.9, 2.0),
    ("validation", "Batch validation", 9.9, 0.4, 1.5),
    ("exceptions", "Exception prioritization", 35.0, 9.0, 15.0),
]
correct = visible_failed == 0 and hidden_failed == 0
missions = []
for (mission_id, name, baseline, golden, target), candidate in zip(definitions, values):
    missions.append({"id": mission_id, "name": name, "baseline_ms": baseline, "candidate_ms": candidate, "golden_ms": golden, "target_ms": target, "passed": correct and candidate <= target})
passed = sum(mission["passed"] for mission in missions)
improvement = round(sum(max(0, 1 - mission["candidate_ms"] / mission["baseline_ms"]) for mission in missions) / 5 * 100, 1)
print("REPORT_JSON:" + json.dumps({"tests": {"visible_passed": 5 if visible_failed == 0 else 0, "visible_failed": visible_failed, "hidden_passed": 4 if hidden_failed == 0 else 0, "hidden_failed": hidden_failed}, "missions": missions, "bench": {"improvement_pct": improvement, "missions_passed": passed, "missions_total": 5}, "verdict": "pass" if correct and passed >= 3 else "partial"}))
PY
