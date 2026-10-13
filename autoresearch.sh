#!/usr/bin/env bash
# Scores the codebase with React Doctor (pinned 0.9.18, the `npx react-doctor@latest` of
# 2026-10-13, default checks incl. supply chain). The score comes from the react.doctor score
# API, a pure function of the diagnostics; error/warning counts are local.
# Gates, so a fix can't break the site: the lint/type check, the build, agent readiness
# (>= 16 checks) and the visual check (no page moved a pixel).
set -euo pipefail
cd "$(dirname "$0")"

report=/tmp/introspectum-react-doctor.json
rm -f "$report"
# Exits 1 while any error-level diagnostic remains; the report decides.
npx --yes react-doctor@0.9.18 . --yes --no-cache --json --json-out "$report" || true
jq -e '.ok == true and .summary.score != null' "$report" >/dev/null || {
  jq -c '{ok, error, summary}' "$report" 2>/dev/null || echo "react-doctor wrote no report"
  exit 1
}
jq -r '.diagnostics[] | "\(.severity) \(.plugin)/\(.rule) \(.filePath):\(.line)"' "$report" |
  sort | uniq -c | sort -rn | sed 's/^/  /'
jq -r '.summary |
  "METRIC react_doctor_score=\(.score)",
  "METRIC errors=\(.errorCount)",
  "METRIC warnings=\(.warningCount)",
  "METRIC diagnostics=\(.totalDiagnosticCount)",
  "METRIC affected_files=\(.affectedFileCount)"' "$report"

npx vp check >/tmp/introspectum-check.log 2>&1 || { tail -n 30 /tmp/introspectum-check.log; exit 1; }
npx vp build >/tmp/introspectum-build.log 2>&1 || { tail -n 30 /tmp/introspectum-build.log; exit 1; }

port=4179
if curl -s -o /dev/null "http://127.0.0.1:$port/"; then echo "port $port is busy"; exit 1; fi
# Its own process group: npx, Vite and workerd all stop with it.
setsid npx vp preview --port "$port" --strictPort >/tmp/introspectum-preview.log 2>&1 &
server=$!
trap 'kill -- "-$server" 2>/dev/null || true; wait "$server" 2>/dev/null || true' EXIT
base="http://127.0.0.1:$port"
for _ in $(seq 1 60); do
  curl -sf -o /dev/null "$base/robots.txt" && break
  sleep 0.5
done
curl -sf -o /dev/null "$base/robots.txt" || { tail -n 30 /tmp/introspectum-preview.log; exit 1; }

agent=$(node bench/agent-ready.ts "$base")
passed=$(sed -n 's/^METRIC checks_passed=//p' <<<"$agent")
echo "METRIC agent_checks_passed=$passed"
[ "$passed" -ge 16 ] || { echo "agent readiness dropped to $passed checks"; exit 1; }
visual=$(node bench/visual.ts "$base")
echo "$visual"
grep -q '^METRIC visual_changed=0$' <<<"$visual" || { echo "visible pages changed"; exit 1; }
