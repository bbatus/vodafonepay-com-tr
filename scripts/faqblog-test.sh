#!/usr/bin/env bash
B=http://localhost:3011
login() { local j=$1 e=$2 p=$3; curl -s -o /dev/null -c "$j" -m 60 -X POST "$B/api/users/login" \
  -H 'Content-Type: application/json' -H "Origin: $B" -d "{\"email\":\"$e\",\"password\":\"$p\"}"; }
code() { curl -s -o /tmp/fb.json -w "%{http_code}" -b "$JAR" -H "Origin: $B" -H 'Content-Type: application/json' -m 60 "$@"; }

MID=$(curl -s "$B/api/media?limit=1&depth=0" | python3 -c "import sys,json;print(json.load(sys.stdin)['docs'][0]['id'])")

for role in "test-nv-maker@vodafonepay.local:TestNvMaker123!:NV MAKER" \
            "test-nv-checker@vodafonepay.local:TestNvChecker123!:NV CHECKER" \
            "test-growth-maker@vodafonepay.local:TestGrowthMaker123!:GROWTH MAKER" \
            "test-growth-checker@vodafonepay.local:test-growth-checker:GROWTH CHECKER"; do
  email="${role%%:*}"; rest="${role#*:}"; pw="${rest%:*}"; label="${rest##*:}"
  JAR=$(mktemp); login "$JAR" "$email" "$pw"
  echo "########## $label ##########"
  R=$RANDOM

  # ---- FAQ ITEMS ----
  printf "faq  read=%s " "$(code "$B/api/faq-items?limit=1&depth=0")"
  c=$(code -X POST "$B/api/faq-items" -d "{\"question\":\"ZZ SSS $label $R\",\"answer\":\"cevap\",\"category\":\"kampanyalar\"}")
  printf "create=%s " "$c"
  if [ "$c" = "201" ]; then
    fid=$(python3 -c "import json;print(json.load(open('/tmp/fb.json'))['doc']['id'])")
    ford=$(python3 -c "import json;print(json.load(open('/tmp/fb.json'))['doc'].get('order'))")
    printf "(id=%s order=%s) " "$fid" "$ford"
    printf "update=%s " "$(code -X PATCH "$B/api/faq-items/$fid" -d '{"answer":"guncellendi"}')"
    printf "publish=%s " "$(code -X PATCH "$B/api/faq-items/$fid" -d '{"_status":"published"}')"
    printf "delete=%s" "$(code -X DELETE "$B/api/faq-items/$fid")"
    echo " FAQIDS:$fid"
  else echo; fi

  # ---- BLOG POSTS ----
  printf "blog read=%s " "$(code "$B/api/blog-posts?limit=1&depth=0")"
  c=$(code -X POST "$B/api/blog-posts" -d "{\"title\":\"ZZ Blog $label $R\",\"slug\":\"zz-blog-$R\",\"excerpt\":\"ozet\",\"coverImage\":$MID}")
  printf "create=%s " "$c"
  if [ "$c" = "201" ]; then
    bid=$(python3 -c "import json;print(json.load(open('/tmp/fb.json'))['doc']['id'])")
    printf "(id=%s) " "$bid"
    printf "update=%s " "$(code -X PATCH "$B/api/blog-posts/$bid" -d '{"excerpt":"guncellendi"}')"
    printf "publish=%s " "$(code -X PATCH "$B/api/blog-posts/$bid" -d '{"_status":"published"}')"
    printf "media-del-blocked=%s " "$(code -X DELETE "$B/api/media/$MID")"
    printf "delete=%s" "$(code -X DELETE "$B/api/blog-posts/$bid")"
    echo
  else echo; fi
  echo
  rm -f "$JAR"
done
