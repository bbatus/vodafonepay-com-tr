# Deployment Runbook — vodafonepaycomtr (site)

> Genel karar kaydı ve "neden böyle": `../docs/OCP-DEVOPS-RUNBOOK.md`.

## 0. Hızlı referans

| | Değer |
|---|---|
| Servis | `vodafonepaycomtr` |
| Namespace | `vepas-ai-am` |
| TEST cluster | `https://api.tst-vcloud.vpara.local:6443` |
| Registry | `containers.github.vpara.local` |
| Health | `https://<route-host>/api/health/{liveness,readiness}` |
| Bağımlılık | Clover'ın Service'i (`http://clover:3000/api`) — Postgres/MinIO yok, doğrudan bağlanmıyor |

## Faz 0 — İlk kurulum (namespace başına BİR KEZ, elle)

```bash
oc login https://api.tst-vcloud.vpara.local:6443 -u <user>
oc project vepas-ai-am
```

**1) Image pull secret**
```bash
oc create secret docker-registry vodafonepaycomtr-pull-secret \
  --docker-server=containers.github.vpara.local \
  --docker-username=<kullanici> --docker-password=<token> -n vepas-ai-am
```

**2) Uygulama Secret'ı** (Clover'daki AYNI REVALIDATE_SECRET/PREVIEW_SECRET)
```bash
cp k8s/.env.secret.example k8s/.env.secret
./k8s/create-secret.sh
```

**3) ConfigMap + sabit kaynaklar**
```bash
oc apply -f k8s/configmap.yaml
oc apply -f k8s/serviceaccount.yaml
oc apply -f k8s/service.yaml
oc apply -f k8s/route.yaml
oc apply -f k8s/hpa.yaml
oc get route vodafonepaycomtr -o jsonpath='{.spec.host}'; echo
```

**4) Deployment (ilk kurulumda elle, sonra pipeline yapar)**
```bash
IMAGE_REF=<imaj> envsubst < k8s/deployment.yaml | oc apply -f -
oc rollout status deployment/vodafonepaycomtr --timeout=300s
```

**5) Doğrulama**
```bash
curl -sf https://$(oc get route vodafonepaycomtr -o jsonpath='{.spec.host}')/api/health/liveness
curl -sf https://$(oc get route vodafonepaycomtr -o jsonpath='{.spec.host}')/api/health/readiness
# Gerçek CMS verisi geliyor mu (Clover önce ayakta olmalı):
curl -sf https://$(oc get route vodafonepaycomtr -o jsonpath='{.spec.host}')/kampanyalar | grep -o "widget_" | head -1
```

## Rollback

```bash
oc rollout undo deployment/vodafonepaycomtr
oc rollout status deployment/vodafonepaycomtr --timeout=300s
oc scale deployment/vodafonepaycomtr --replicas=0
```

## Sorun giderme

| Belirti | Sebep | Çözüm |
|---|---|---|
| `ImagePullBackOff` | Image pull secret yok/yanlış | Faz 0 adım 1 |
| Site açılıyor ama içerik boş/`ContentUnavailable` | Clover ayakta değil ya da `CMS_API_URL` yanlış | `oc get pods -l app=clover`; ConfigMap'teki `CMS_API_URL` değerini doğrula |
| Revalidate webhook çalışmıyor | `REVALIDATE_SECRET` iki serviste eşleşmiyor | İki Secret'ı karşılaştır (`docs/OCP-DEVOPS-RUNBOOK.md §3`'teki desen) |
