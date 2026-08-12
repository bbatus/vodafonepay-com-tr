#!/usr/bin/env bash
# Runs a SonarQube scan against the local SonarQube instance
# (tools/sonarqube/docker-compose.yml) and prints open issues.
#
# Usage:
#   scripts/sonar-scan.sh web     # scan the root Next.js site
#   scripts/sonar-scan.sh cms     # scan the Payload CMS
#   scripts/sonar-scan.sh all     # both (default)
#
# Requires SONAR_TOKEN in the environment. Generate one from the SonarQube UI
# (http://localhost:9002 -> My Account -> Security -> Generate Token) or via:
#   curl -s -u admin:<password> -X POST "http://localhost:9002/api/user_tokens/generate" -d "name=cli-scan-token"
#
# Exits non-zero if the scan finds any open issue — every large
# component/code change should run this and be clean before commit/push
# (see AGENTS.md).
set -euo pipefail

TARGET="${1:-all}"
SONAR_HOST_URL_LOCAL="http://localhost:9002"
SONAR_HOST_URL_DOCKER="http://sonarqube:9000"

if [ -z "${SONAR_TOKEN:-}" ]; then
  echo "SONAR_TOKEN is not set. Generate one at ${SONAR_HOST_URL_LOCAL} (My Account > Security) and export it." >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAN_TMP="/private/tmp/sonar-scan"

run_scan() {
  local project_key="$1"
  local src_dir="$2"
  local extra_sources="${3:-}"

  echo "== Scanning ${project_key} =="
  rm -rf "${SCAN_TMP:?}/${project_key}"
  mkdir -p "${SCAN_TMP}/${project_key}"
  rsync -a --exclude node_modules --exclude .next --exclude .git "${src_dir}/" "${SCAN_TMP}/${project_key}/src/"
  if [ -n "$extra_sources" ]; then
    cp "${REPO_ROOT}/${extra_sources}" "${SCAN_TMP}/${project_key}/"
  fi

  docker run --rm --network sonar-net \
    -v "${SCAN_TMP}/${project_key}:/usr/src" \
    -w /usr/src \
    sonarsource/sonar-scanner-cli \
    -Dsonar.host.url="${SONAR_HOST_URL_DOCKER}" \
    -Dsonar.token="${SONAR_TOKEN}" \
    -Dsonar.projectKey="${project_key}" \
    -Dsonar.sources="src$([ -n "$extra_sources" ] && echo ",$(basename "$extra_sources")")" \
    -Dsonar.sourceEncoding=UTF-8

  # Give the compute engine a moment to process the report before querying issues.
  sleep 6

  echo "-- Open issues for ${project_key} --"
  local issues
  issues=$(curl -s -u "${SONAR_TOKEN}:" "${SONAR_HOST_URL_LOCAL}/api/issues/search?componentKeys=${project_key}&resolved=false")
  echo "$issues" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"Open issues: {d['total']}\")
for i in d['issues']:
    print(f\"  [{i['severity']}] {i['rule']} - {i['component']} - {i['message']}\")
sys.exit(1 if d['total'] > 0 else 0)
"
}

FAILED=0
if [ "$TARGET" = "web" ] || [ "$TARGET" = "all" ]; then
  run_scan "vodafonepaycomtr" "${REPO_ROOT}/src" || FAILED=1
fi
if [ "$TARGET" = "cms" ] || [ "$TARGET" = "all" ]; then
  run_scan "vodafonepaycomtr-cms" "${REPO_ROOT}/cms/src" "cms/payload.config.ts" || FAILED=1
fi

rm -rf "$SCAN_TMP"

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "Open SonarQube issues found — fix before commit/push." >&2
  exit 1
fi

echo ""
echo "Clean — no open SonarQube issues."
