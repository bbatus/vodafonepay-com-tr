# Kullanıcı hesapları (local geliştirme)

`2026-08-28` itibarıyla hesaplar, iş birimi tarafından verilen **gerçek
AccessPoint rol matrisine** göre yeniden oluşturuldu. Eski
`test-*@vodafonepay.local` fixture'ları silindi.

> **Bunlar gerçek kimlik bilgileri DEĞİL.** İsimlendirme gerçek rol matrisiyle
> birebir eşleşsin diye böyle; paylaşılan şifre bu docker-compose yığınının
> dışında hiçbir anlam taşımıyor. Gerçek ortama çıkmadan önce her hesap kendi
> LDAP kimliğiyle değişecek (e-posta/kullanıcı adı/rol/şifre LDAP'ın).

| Rol (CMS slug) | AccessPoint rol adı | E-posta | Şifre |
|---|---|---|---|
| `growth_maker` | `ROLE_VODAFONEPAY_CMS_MAKER_RW` | ece.boran@vodafone.com | `VodafonePay!2026` |
| `growth_maker` | `ROLE_VODAFONEPAY_CMS_MAKER_RW` | yunusemre.karazeybek@vodafone.com | `VodafonePay!2026` |
| `growth_maker` | `ROLE_VODAFONEPAY_CMS_MAKER_RW` | hande.tanis@vodafone.com | `VodafonePay!2026` |
| `growth_maker` | `ROLE_VODAFONEPAY_CMS_MAKER_RW` | sibel.saribas@vodafone.com | `VodafonePay!2026` |
| `growth_checker` | `ROLE_VODAFONEPAY_CMS_CHECKER_RO` | mert.sarihan@vodafone.com | `VodafonePay!2026` |
| `new_vertical_checker` | `RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW` | talha.ozgulcu@vodafone.com | `VodafonePay!2026` |
| `new_vertical_maker` | `RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW` | admin@vodafonepay.local | `dev-admin-please-change` (docker-compose.yml → `CMS_ADMIN_PASSWORD`) |

**`admin@vodafonepay.local` bilinçli olarak korundu.** 4. rolü
(`new_vertical_maker` — "biz"/geliştirici rolü) taşıyor ve CMS'in kullanıcı
yönetimi, denetim kayıtlarının tamamını görme, silme ve çeviri düzenleme
yetkilerine sahip TEK rol o. Silinseydi panel yönetilemez hale gelirdi.

## Hesapları yeniden oluşturma

```bash
node scripts/seed-real-users.mjs | docker exec -i vodafonepaycms-postgres psql -U payload -d vodafonepaycms
```

Script idempotent — tekrar çalıştırmak şifreleri yeniler, hata vermez.

### Neden API değil, doğrudan INSERT?

`cms/src/collections/Users.ts`'te `ALLOW_USER_CREATION = false` (RFP
follow-up: "zaten user eklemicez"), yani `POST /api/users` kapalı — hesaplar
LDAP/AccessPoint tarafından açılır. Gerçek LDAP bind'ı gelene kadar
(`docs/RFP-OPEN-ITEMS.md` §6) local DB'ye hesap koymanın tek yolu, Payload'ın
kendi pbkdf2 parametreleriyle (sha256, 25000 iterasyon, 512 bayt) üretilmiş
salt/hash çiftini doğrudan yazmak.

**Dikkat:** e-postalar küçük harfle saklanmalı. Payload girişte adresi küçük
harfe çeviriyor ama `users_email_idx` benzersiz indeksi büyük/küçük harf
duyarlı — `Ece.Boran@…` diye yazılan bir satıra hiçbir zaman giriş
yapılamıyor (canlıda bu şekilde bulundu ve düzeltildi). Script `norm()` ile
bunu kendisi hallediyor.

## Diğer notlar

2026-08-19: `users.role` değerleri artık AccessPoint'in ham LDAP grup adları
değil, `cms/src/access/roles.ts`'in kendi iç rol slug'ları — bkz.
`docs/RFP-OPEN-ITEMS.md` §7 ve `cms/src/access/roleMapping.ts`. Grup adı ↔ rol
eşlemesi ve her rolün departman/sorumlu/kritiklik bilgisi
`roleMapping.ts`'teki `LDAP_GROUP_TO_ROLE` ve `ROLE_DIRECTORY`'de.

2026-08-25: `cms/src/collections/Users.ts` e-posta/kullanıcı adı/rolü kimse
için (New Vertical Maker dahil) düzenlenebilir tutmuyor — sadece görüntüleme.
Parola değişikliği de tamamen kapalı (`blockPasswordChange` hook'u). Bir
hesabın şifresini "sıfırlamanın" tek yolu yukarıdaki script.

Admin panel: http://localhost:3010/admin
Site: http://localhost:3000
