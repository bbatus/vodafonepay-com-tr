#!/usr/bin/env bash
# Container image + dependency vulnerability scanning with Trivy
# (https://github.com/aquasecurity/trivy) — the most widely used open-source
# scanner for both, so one tool covers container security scan and
# dependency (SCA) scan.
#
# 02.09.2026: site (`vodafonepaycomtr/`) and CMS (`cms/`) are no longer
# subfolders of this repo — they're their own repos, cloned as siblings of
# this one (`../vodafonepaycomtr-site`, `../clover`). This script now reads
# from there. If you don't have both cloned next to this repo, `git clone`
# them first (see AGENTS.md's Project Structure).
#
# Usage:
#   scripts/trivy-scan.sh images   # scan the built site/clover Docker images
#   scripts/trivy-scan.sh deps     # scan both repos' package-lock.json as an
#                                   # independent second opinion alongside `npm audit`
#   scripts/trivy-scan.sh all      # both (default)
#
# Images must already be built (`docker compose up --build` in each repo)
# before running the `images` scan. Exits non-zero if any vulnerability is
# found — same policy as scripts/sonar-scan.sh: fix before commit/push,
# especially after changing a Dockerfile or a dependency.
set -euo pipefail

TARGET="${1:-all}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT="${SITE_ROOT:-${REPO_ROOT}/../vodafonepaycomtr-site}"
CLOVER_ROOT="${CLOVER_ROOT:-${REPO_ROOT}/../clover}"
FS_SCAN_TMP="/private/tmp/trivy-fs-scan"

FAILED=0

scan_image() {
  local image="$1"
  echo "== Scanning image: ${image} =="
  if ! docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image \
    --scanners vuln --exit-code 1 --severity CRITICAL,HIGH,MEDIUM "${image}"; then
    FAILED=1
  fi
}

scan_deps() {
  local label="$1"
  local lockfile="$2"
  echo "== Scanning dependencies: ${label} =="
  rm -rf "$FS_SCAN_TMP"
  mkdir -p "$FS_SCAN_TMP"
  cp "$lockfile" "$FS_SCAN_TMP/package-lock.json"
  if ! docker run --rm -v "${FS_SCAN_TMP}:/scan" aquasec/trivy fs --scanners vuln --exit-code 1 /scan/package-lock.json; then
    FAILED=1
  fi
  rm -rf "$FS_SCAN_TMP"
}

if [ "$TARGET" = "images" ] || [ "$TARGET" = "all" ]; then
  # Real image names — see each repo's own docker-compose.yml.
  scan_image "vodafonepaycomtr:latest"
  scan_image "clover:latest"
fi

if [ "$TARGET" = "deps" ] || [ "$TARGET" = "all" ]; then
  scan_deps "site (vodafonepaycomtr-site)" "${SITE_ROOT}/package-lock.json"
  scan_deps "clover" "${CLOVER_ROOT}/package-lock.json"
fi

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "Trivy found vulnerabilities — fix before commit/push." >&2
  exit 1
fi

echo ""
echo "Clean — no vulnerabilities found."
