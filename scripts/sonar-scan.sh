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

# Token resolution, in order: an exported SONAR_TOKEN wins, otherwise read
# .sonar-token at the repo root. That file is gitignored and exists so the
# token is generated ONCE and every later scan just works — same reason
# warm-cache.sh reads .env rather than making you remember a secret.
REPO_ROOT_EARLY="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SONAR_TOKEN_FILE="${SONAR_TOKEN_FILE:-${REPO_ROOT_EARLY}/.sonar-token}"
if [ -z "${SONAR_TOKEN:-}" ] && [ -f "$SONAR_TOKEN_FILE" ]; then
  SONAR_TOKEN="$(tr -d ' \t\r\n' < "$SONAR_TOKEN_FILE")"
fi

if [ -z "${SONAR_TOKEN:-}" ]; then
  cat >&2 <<MSG
SONAR_TOKEN yok.

Bir kereye mahsus:
  1. ${SONAR_HOST_URL_LOCAL} adresine giris yapin
  2. Sag ustteki avatar > My Account > Security
  3. "Generate Tokens" altinda bir isim verip Generate'e basin (tur: User Token)
  4. Uretilen degeri su dosyaya yapistirin (tek satir, baska hicbir sey):
       ${SONAR_TOKEN_FILE}

Bu dosya .gitignore'da — repoya girmez. Sonraki her taramada script onu
kendisi okur, bir daha token sormaz.
MSG
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAN_TMP="/private/tmp/sonar-scan"

run_scan() {
  local project_key="$1"
  local src_dir="$2"
  local extra_sources="${3:-}"
  local project_root="$4"
  local cpd_exclusions="${5:-}"

  echo "== Scanning ${project_key} =="
  rm -rf "${SCAN_TMP:?}/${project_key}"
  mkdir -p "${SCAN_TMP}/${project_key}"
  rsync -a --exclude node_modules --exclude .next --exclude .git "${src_dir}/" "${SCAN_TMP}/${project_key}/src/"
  if [ -n "$extra_sources" ]; then
    cp "${REPO_ROOT}/${extra_sources}" "${SCAN_TMP}/${project_key}/"
  fi

  # Coverage: run vitest fresh so the report always reflects the current
  # tree (not a stale coverage/ dir from a previous, unrelated run), then
  # hand the lcov report to Sonar's JS/TS sensor — lcov.info's SF: lines are
  # already `src/...`-relative (vitest.config.ts's own coverage root),
  # which is exactly the layout rsync just recreated under /usr/src.
  echo "-- Running vitest coverage for ${project_key} --"
  (cd "${project_root}" && npx vitest run --coverage >/dev/null 2>&1) || true
  if [ -f "${project_root}/coverage/lcov.info" ]; then
    mkdir -p "${SCAN_TMP}/${project_key}/coverage"
    cp "${project_root}/coverage/lcov.info" "${SCAN_TMP}/${project_key}/coverage/lcov.info"
  else
    echo "WARNING: no coverage/lcov.info produced for ${project_key} — coverage will show as 0%." >&2
  fi

  docker run --rm --network sonar-net \
    -v "${SCAN_TMP}/${project_key}:/usr/src" \
    -w /usr/src \
    sonarsource/sonar-scanner-cli \
    -Dsonar.host.url="${SONAR_HOST_URL_DOCKER}" \
    -Dsonar.token="${SONAR_TOKEN}" \
    -Dsonar.projectKey="${project_key}" \
    -Dsonar.sources="src$([ -n "$extra_sources" ] && echo ",$(basename "$extra_sources")")" \
    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
    -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info \
    -Dsonar.sourceEncoding=UTF-8 \
    $([ -n "$cpd_exclusions" ] && echo "-Dsonar.cpd.exclusions=${cpd_exclusions}")

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
  run_scan "vodafonepaycomtr" "${REPO_ROOT}/vodafonepaycomtr/src" "" "${REPO_ROOT}/vodafonepaycomtr" || FAILED=1
fi
if [ "$TARGET" = "cms" ] || [ "$TARGET" = "all" ]; then
  # translationDefaults.ts/helpContent.ts are pure literal seed-data tables —
  # hundreds of `{ tr: "...", en: "..." }` / `{ title, steps: [...] }` entries
  # whose STRUCTURE repeats even though every entry's actual copy differs.
  # CPD normalizes string literals, so it flags this shape as ~80-97%
  # self-duplicated even though there's no real duplicated logic to extract —
  # confirmed by reading both files: no two entries share content, only
  # shape. Excluded rather than "fixed", the same judgment already applied
  # this session to Footer.tsx/site-haritasi's non-identical fallback lists
  # and to cerez-politikasi's cookieRows.ts.
  run_scan "vodafonepaycomtr-cms" "${REPO_ROOT}/cms/src" "cms/payload.config.ts" "${REPO_ROOT}/cms" \
    "src/lib/translationDefaults.ts,src/lib/helpContent.ts" || FAILED=1
fi

rm -rf "$SCAN_TMP"

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "Open SonarQube issues found — fix before commit/push." >&2
  exit 1
fi

echo ""
echo "Clean — no open SonarQube issues."
