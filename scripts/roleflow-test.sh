#!/usr/bin/env bash
# Per-role smoke test of the four flows that matter: login, campaign, users,
# media — plus profile settings. Run against a CMS on $B (default: dev :3011).
# Uses cookie auth with an Origin header (what the browser actually does), so
# CSRF and access control are exercised the same way the panel exercises them.
B=http://localhost:3011
run_role () {
  local email="$1" pw="$2" label="$3"
  local jar; jar=$(mktemp)
  local code
  echo "########## $label ##########"

  # 1) LOGIN
  code=$(curl -s -o /tmp/rf.json -w "%{http_code}" -c "$jar" -m 60 -X POST "$B/api/users/login" \
    -H 'Content-Type: application/json' -H "Origin: $B" \
    -d "{\"email\":\"$email\",\"password\":\"$pw\"}")
  echo "login                       -> $code"
  [ "$code" = "200" ] || { rm -f "$jar"; return; }

  q() { curl -s -o /tmp/rf.json -w "%{http_code}" -b "$jar" -H "Origin: $B" -m 60 "$@"; }

  # 2) CAMPAIGN: read, then create (create is the role-sensitive part)
  echo "campaigns list              -> $(q "$B/api/campaigns?limit=1&depth=0")"
  local img cat
  img=$(curl -s -b "$jar" "$B/api/media?limit=1&depth=0" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['docs'][0]['id'] if d.get('docs') else '')" 2>/dev/null)
  cat=$(curl -s -b "$jar" "$B/api/categories?limit=1&depth=0" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['docs'][0]['id'] if d.get('docs') else '')" 2>/dev/null)
  code=$(curl -s -o /tmp/rf.json -w "%{http_code}" -b "$jar" -H "Origin: $B" -H 'Content-Type: application/json' -m 60 \
    -X POST "$B/api/campaigns" -d "{\"title\":\"ZZ Akis Testi $label\",\"slug\":\"zz-akis-testi-$RANDOM\",\"description\":\"akis testi\",\"image\":$img,\"category\":$cat}")
  echo "campaign create             -> $code"
  if [ "$code" = "201" ] || [ "$code" = "200" ]; then
    local id; id=$(python3 -c "import json;print(json.load(open('/tmp/rf.json'))['doc']['id'])" 2>/dev/null)
    echo "   created id=$id (cleaned up below)"
    echo "campaign publish            -> $(curl -s -o /dev/null -w '%{http_code}' -b "$jar" -H "Origin: $B" -H 'Content-Type: application/json' -X PATCH "$B/api/campaigns/$id" -d '{"_status":"published"}')"
    echo "campaign delete (own draft) -> $(curl -s -o /dev/null -w '%{http_code}' -b "$jar" -H "Origin: $B" -X DELETE "$B/api/campaigns/$id")"
  fi

  # 3) USERS
  echo "users list                  -> $(q "$B/api/users?limit=5&depth=0")"
  # 4) MEDIA
  echo "media list                  -> $(q "$B/api/media?limit=5&depth=0")"
  # 5) PROFILE
  echo "profile (me)                -> $(q "$B/api/users/me")"
  local uid; uid=$(curl -s -b "$jar" -H "Origin: $B" "$B/api/users/me" | python3 -c "import sys,json;print(json.load(sys.stdin)['user']['id'])" 2>/dev/null)
  echo "profile: set preferredLocale-> $(curl -s -o /dev/null -w '%{http_code}' -b "$jar" -H "Origin: $B" -H 'Content-Type: application/json' -X PATCH "$B/api/users/$uid" -d '{"preferredLocale":"tr"}')"
  # self role escalation must be silently refused (200 but value unchanged)
  curl -s -o /dev/null -b "$jar" -H "Origin: $B" -H 'Content-Type: application/json' -X PATCH "$B/api/users/$uid" -d '{"role":"RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW"}'
  echo "profile: role after escalation attempt -> $(curl -s -b "$jar" -H "Origin: $B" "$B/api/users/me" | python3 -c "import sys,json;print(json.load(sys.stdin)['user']['role'])" 2>/dev/null)"
  echo "locked-accounts unlock      -> $(curl -s -o /dev/null -w '%{http_code}' -b "$jar" -H "Origin: $B" -H 'Content-Type: application/json' -X POST "$B/api/users/unlock" -d '{"email":"test-growth-checker@vodafonepay.local"}')"
  echo
  rm -f "$jar"
}
run_role test-nv-maker@vodafonepay.local      'TestNvMaker123!'      "NV MAKER"
run_role test-nv-checker@vodafonepay.local    'TestNvChecker123!'    "NV CHECKER"
run_role test-growth-maker@vodafonepay.local  'TestGrowthMaker123!'  "GROWTH MAKER"
run_role test-growth-checker@vodafonepay.local 'test-growth-checker' "GROWTH CHECKER"
