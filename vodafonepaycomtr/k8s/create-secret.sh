#!/usr/bin/env bash
set -euo pipefail

APP_NAME="vodafonepaycomtr"
SECRET_NAME="${APP_NAME}-secret"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-${SCRIPT_DIR}/.env.secret}"

if [[ -f "${ENV_FILE}" ]]; then
  echo "→ Değerler okunuyor: ${ENV_FILE}"
  # shellcheck disable=SC1090
  set -a; source "${ENV_FILE}"; set +a
else
  echo "→ ${ENV_FILE} yok; değerler ortam değişkenlerinden alınacak."
fi

missing=()
for var in REVALIDATE_SECRET PREVIEW_SECRET; do
  [[ -z "${!var:-}" ]] && missing+=("$var")
done
if (( ${#missing[@]} > 0 )); then
  echo "HATA: şu değerler eksik: ${missing[*]}" >&2
  echo "      k8s/.env.secret dosyasını doldurun — Clover'daki AYNI değerler." >&2
  exit 1
fi

NAMESPACE_ARG=()
[[ -n "${OCP_NAMESPACE:-}" ]] && NAMESPACE_ARG=(-n "${OCP_NAMESPACE}")

echo "→ Secret uygulanıyor: ${SECRET_NAME} (namespace: ${OCP_NAMESPACE:-<aktif proje>})"

oc create secret generic "${SECRET_NAME}" \
  --from-literal=REVALIDATE_SECRET="${REVALIDATE_SECRET}" \
  --from-literal=PREVIEW_SECRET="${PREVIEW_SECRET}" \
  "${NAMESPACE_ARG[@]}" \
  --dry-run=client -o yaml \
  | oc label --local -f - app="${APP_NAME}" -o yaml \
  | oc apply "${NAMESPACE_ARG[@]}" -f -

echo "✓ Tamam."
