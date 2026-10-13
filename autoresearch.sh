#!/usr/bin/env bash
# Builds the site, serves the Build Output in the local Workers runtime, then measures agent
# readiness (bench/agent-ready.ts), checks that no page moved a pixel (bench/visual.ts) and runs
# Lighthouse 13.5 on the homepage, mobile & desktop, as PageSpeed Insights does.
# Exits non-zero when the lint/type check fails, the server breaks, agent readiness drops below
# 16 checks, or any screenshot changed.
set -euo pipefail
cd "$(dirname "$0")"

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
echo "$agent"
passed=$(sed -n 's/^METRIC checks_passed=//p' <<<"$agent")
[ "$passed" -ge 16 ] || { echo "agent readiness dropped to $passed checks"; exit 1; }
visual=$(node bench/visual.ts "$base")
echo "$visual"
grep -q '^METRIC visual_changed=0$' <<<"$visual" || { echo "visible pages changed"; exit 1; }

# Lighthouse: the four categories, mobile (PageSpeed's default) & desktop. Mobile performance is
# the median of three runs, the noisiest score.
lighthouse() {
  npx --yes lighthouse@13.5.0 "$base/" "$@" --chrome-path="${CHROME_PATH:-chromium}" \
    --chrome-flags="--headless=new" --quiet --output=json --output-path=stdout \
    --only-categories=performance,accessibility,best-practices,seo
}
scores='([.categories[] | {key: .id, value: (.score * 100)}] | from_entries)'
for _ in 1 2 3; do lighthouse | jq -c "$scores + {lcp: .audits[\"largest-contentful-paint\"].numericValue}"; done >/tmp/introspectum-lh-mobile.jsonl
desktop=$(lighthouse --preset=desktop | jq -c "$scores")
mobile=$(jq -s -c 'sort_by(.performance)[1]' /tmp/introspectum-lh-mobile.jsonl)
jq -r -n --argjson m "$mobile" --argjson d "$desktop" '
  "METRIC pagespeed_total=\(([$m, $d] | map(.performance + .accessibility + .["best-practices"] + .seo) | add * 100 | round / 100))",
  "METRIC mobile_performance=\($m.performance)", "METRIC mobile_accessibility=\($m.accessibility)",
  "METRIC mobile_best_practices=\($m["best-practices"])", "METRIC mobile_seo=\($m.seo)",
  "METRIC desktop_performance=\($d.performance)", "METRIC desktop_accessibility=\($d.accessibility)",
  "METRIC desktop_best_practices=\($d["best-practices"])", "METRIC desktop_seo=\($d.seo)",
  "METRIC mobile_lcp_ms=\($m.lcp | round)"'
