#!/usr/bin/env bash
# Builds the site, serves the Build Output in the local Workers runtime, then measures agent
# readiness (bench/agent-ready.ts) and checks that no page moved a pixel (bench/visual.ts).
# Exits non-zero when the lint/type check fails, the server breaks, or any screenshot changed.
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

node bench/agent-ready.ts "$base"
visual=$(node bench/visual.ts "$base")
echo "$visual"
grep -q '^METRIC visual_changed=0$' <<<"$visual" || { echo "visible pages changed"; exit 1; }
