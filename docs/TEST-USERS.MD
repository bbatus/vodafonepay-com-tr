# Test kullanıcıları

Docker compose imajları (`app` :3000, `cms` :3010) `2026-08-17` itibarıyla en güncel
kodla yeniden build edilip ayağa kaldırıldı ve aşağıdaki 4 kullanıcının şifresi
sıfırlanıp doğrulandı (hepsi `POST /api/users/login` üzerinden canlı 200 döndü).

| Rol | E-posta | Şifre |
|---|---|---|
| NV Maker (`RL_VODAFONEPAY_CMS_EXEC_DEVELOPER_MAKER_RW`) | test-nv-maker@vodafonepay.local | `TestNvMaker!2026` |
| NV Checker (`RL_VODAFONEPAY_CMS_EXEC_CONTENT_PRW`) | test-nv-checker@vodafonepay.local | `TestNvChecker!2026` |
| Growth Maker (`ROLE_VODAFONEPAY_CMS_MAKER_RW`) | test-growth-maker@vodafonepay.local | `TestGrowthMaker!2026` |
| Growth Checker (`ROLE_VODAFONEPAY_CMS_CHECKER_RO`) | test-growth-checker@vodafonepay.local | `TestGrowthChecker!2026` |

Admin panel: http://localhost:3010/admin
Site: http://localhost:3000

Eski dosyadaki şifreler artık geçersizdi (401 dönüyordu) — pbkdf2 hash'leri
doğrudan DB'ye yazılarak resetlendi, `login_attempts`/`lock_until` de sıfırlandı.
