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
range_ms="$(metric time_range)"; filter_ms="$(metric field_filter)"; retention_ms="$(metric retention)"; top_ms="$(metric top_sources)"; dedupe_ms="$(metric dedupe)"
python - "$visible_failed" "$hidden_failed" "$range_ms" "$filter_ms" "$retention_ms" "$top_ms" "$dedupe_ms" <<'PY'
import json
import sys

visible_failed, hidden_failed = map(int, sys.argv[1:3])
values = list(map(float, sys.argv[3:]))
definitions = [
    ("time-range", "Time-range lookup", 19.0, 0.10, 1.0),
    ("field-filter", "Field filter lookup", 67.0, 0.30, 2.0),
    ("retention", "Retention maintenance", 0.60, 0.32, 0.45),
    ("top-sources", "Top source aggregation", 1495.0, 0.02, 1.0),
    ("dedupe", "Duplicate suppression", 612.0, 1.10, 8.0),
]
correct = visible_failed == 0 and hidden_failed == 0
missions = []
for (mission_id, name, baseline, golden, target), candidate in zip(definitions, values):
    missions.append({"id": mission_id, "name": name, "baseline_ms": baseline, "candidate_ms": candidate, "golden_ms": golden, "target_ms": target, "passed": correct and candidate <= target})
passed = sum(mission["passed"] for mission in missions)
improvement = round(sum(max(0, 1 - mission["candidate_ms"] / mission["baseline_ms"]) for mission in missions) / 5 * 100, 1)
print("REPORT_JSON:" + json.dumps({"tests": {"visible_passed": 5 if visible_failed == 0 else 0, "visible_failed": visible_failed, "hidden_passed": 4 if hidden_failed == 0 else 0, "hidden_failed": hidden_failed}, "missions": missions, "bench": {"improvement_pct": improvement, "missions_passed": passed, "missions_total": 5}, "verdict": "pass" if correct and passed >= 3 else "partial"}))
PY
