#!/bin/bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
: "${VERCEL_ORG_ID:?请设置 VERCEL_ORG_ID}"
: "${VERCEL_PROJECT_ID_BOOTSTRAP:?请设置 VERCEL_PROJECT_ID_BOOTSTRAP}"
: "${VERCEL_PROJECT_ID_FIXIT:?请设置 VERCEL_PROJECT_ID_FIXIT}"

VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID_BOOTSTRAP}" \
  vercel deploy --local-config vercel.json --prod --yes
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID_FIXIT}" \
  vercel deploy --local-config vercel.fixit.json --prod --yes
