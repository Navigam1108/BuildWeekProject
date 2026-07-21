#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspace}"; GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"; HIDDEN_DIR="$GRADER_DIR/hidden"; [ -d "$HIDDEN_DIR" ] || HIDDEN_DIR=/grader/hidden
if make test >/tmp/visible.out 2>&1; then visible_passed=1; visible_failed=0; else visible_passed=0; visible_failed=1; fi
candidate_ms="$(make bench | sed -n 's/.*candidate_ms=\([0-9.]*\).*/\1/p')"
if g++ -std=c++20 -O2 -Iinclude src/router.cpp "$HIDDEN_DIR/router_invariant.cpp" -o /tmp/router_hidden && /tmp/router_hidden
then hidden_passed=5; hidden_failed=0; else hidden_passed=0; hidden_failed=5; fi
bench_output="$(make bench)"
printf 'REPORT_JSON:%s\n' "$(BENCH_OUTPUT="$bench_output" BASELINES="$GRADER_DIR/mission-baselines.json" python - <<PY
import json, os, re
output=os.environ["BENCH_OUTPUT"]
values={key: float(value) for key, value in re.findall(r"([a-z_]+_ms)=([0-9.]+)", output)}
with open(os.environ["BASELINES"], encoding="utf8") as source: baselines=json.load(source)
missions=[]
for mission_id, metric in baselines.items():
    candidate=values[metric["metric"]]
    threshold=metric["baseline_ms"] * 0.6 + metric["golden_ms"] * 0.4
    missions.append({"id": mission_id, "baseline_ms": metric["baseline_ms"], "candidate_ms": candidate, "golden_ms": metric["golden_ms"], "passed": $visible_passed > 0 and candidate <= threshold})
value=values["candidate_ms"]
valid = $visible_passed > 0 and $hidden_passed > 0
verdict = "strong" if valid and sum(mission["passed"] for mission in missions) >= 2 else "developing"
print(json.dumps({"tests":{"visible_passed":$visible_passed,"visible_failed":$visible_failed,"hidden_passed":$hidden_passed,"hidden_failed":$hidden_failed},"bench":{"candidate_ms":value,"baseline_ms":6500,"target_ms":300,"improvement_pct":round(max(0,(6500-value)/6500*100),1)},"missions":missions,"verdict":verdict}))
PY
)"
