# Test kullanıcıları

Docker compose imajları (`app` :3000, `cms` :3010) `2026-08-17` itibarıyla en güncel
kodla yeniden build edilip ayağa kaldırıldı ve aşağıdaki 4 kullanıcının şifresi
sıfırlanıp doğrulandı (hepsi `POST /api/users/login` üzerinden canlı 200 döndü).

| Rol | E-posta | Şifre |
|---|---|---|
| NV Maker (`new_vertical_maker`) | test-nv-maker@vodafonepay.local | `TestNvMaker!2026` |
| NV Checker (`new_vertical_checker`) | test-nv-checker@vodafonepay.local | `TestNvChecker!2026` |
| Growth Maker (`growth_maker`) | test-growth-maker@vodafonepay.local | `TestGrowthMaker!2026` |
| Growth Checker (`growth_checker`) | test-growth-checker@vodafonepay.local | `TestGrowthChecker!2026` |

2026-08-19: `users.role` değerleri artık AccessPoint'in ham LDAP grup adları değil,
`cms/src/access/roles.ts`'in kendi iç rol slug'ları (yukarıdaki parantez içindekiler)
— bkz. `docs/RFP-OPEN-ITEMS.md` §7 ve `cms/src/access/roleMapping.ts`.

Admin panel: http://localhost:3010/admin
Site: http://localhost:3000

Eski dosyadaki şifreler artık geçersizdi (401 dönüyordu) — pbkdf2 hash'leri
doğrudan DB'ye yazılarak resetlendi, `login_attempts`/`lock_until` de sıfırlandı.
