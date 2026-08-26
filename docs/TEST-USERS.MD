# Test kullanıcıları

`2026-08-26` itibarıyla: `vodafonepaycomtr_postgres-data` volume'ü bir noktada
sıfırlanmış (muhtemelen ortam yeniden ayağa kaldırılırken) — DB'de sadece
`payload.config.ts`'nin `onInit`'i tarafından otomatik oluşturulan admin
hesabı kalmıştı, aşağıdaki 4 test kullanıcısı yoktu. `cms/src/collections/Users.ts`'de
`ALLOW_USER_CREATION = false` olduğu için (RFP follow-up: "zaten user eklemicez")
`POST /api/users` artık kapalı — kullanıcılar API'den DEĞİL, pbkdf2
hash/salt hesaplanıp doğrudan Postgres'e `INSERT` edilerek yeniden oluşturuldu.
Beşi de (admin dahil) `POST /api/users/login` üzerinden canlı 200 döndü.

| Rol | E-posta | Şifre |
|---|---|---|
| NV Maker (`new_vertical_maker`) | test-nv-maker@vodafonepay.local | `TestNvMaker!2026` |
| NV Checker (`new_vertical_checker`) | test-nv-checker@vodafonepay.local | `TestNvChecker!2026` |
| Growth Maker (`growth_maker`) | test-growth-maker@vodafonepay.local | `TestGrowthMaker!2026` |
| Growth Checker (`growth_checker`) | test-growth-checker@vodafonepay.local | `TestGrowthChecker!2026` |
| Admin / seed (`new_vertical_maker`) | admin@vodafonepay.local | `dev-admin-please-change` (docker-compose.yml → `CMS_ADMIN_PASSWORD` default) |

2026-08-19: `users.role` değerleri artık AccessPoint'in ham LDAP grup adları değil,
`cms/src/access/roles.ts`'in kendi iç rol slug'ları (yukarıdaki parantez içindekiler)
— bkz. `docs/RFP-OPEN-ITEMS.md` §7 ve `cms/src/access/roleMapping.ts`.

2026-08-25: `cms/src/collections/Users.ts` artık email/kullanıcı adı/rolü
kimse için (New Vertical Maker dahil) düzenlenebilir tutmuyor — sadece
görüntüleme. Parola değişikliği de tamamen kapalı (`blockPasswordChange`
hook'u). Bir hesabın şifresini "sıfırlamanın" tek yolu — LDAP gerçekten
bağlanana kadar — yukarıdaki gibi DB'ye doğrudan pbkdf2 hash/salt yazmak;
API üzerinden artık mümkün değil (kasıtlı).

Admin panel: http://localhost:3010/admin
Site: http://localhost:3000
