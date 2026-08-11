#!/usr/bin/env bash
# Container image + dependency vulnerability scanning with Trivy
# (https://github.com/aquasecurity/trivy) — the most widely used open-source
# scanner for both, so one tool covers container security scan and
# dependency (SCA) scan.
#
# Usage:
#   scripts/trivy-scan.sh images   # scan the built app/cms Docker images
#   scripts/trivy-scan.sh deps     # scan package-lock.json (root + cms) as an
#                                   # independent second opinion alongside `npm audit`
#   scripts/trivy-scan.sh all      # both (default)
#
# Images must already be built (docker compose ... up --build) before
# running the `images` scan. Exits non-zero if any vulnerability is found —
# same policy as scripts/sonar-scan.sh: fix before commit/push, especially
# after changing a Dockerfile or a dependency.
set -euo pipefail

TARGET="${1:-all}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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
  scan_image "ai-website-cloner:latest"
  scan_image "vodafonepaycomtr-cms:latest"
fi

if [ "$TARGET" = "deps" ] || [ "$TARGET" = "all" ]; then
  scan_deps "root (site)" "${REPO_ROOT}/package-lock.json"
  scan_deps "cms" "${REPO_ROOT}/cms/package-lock.json"
fi

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "Trivy found vulnerabilities — fix before commit/push." >&2
  exit 1
fi

echo ""
echo "Clean — no vulnerabilities found."
