# Geliştirme Geçmişi — Arşiv İndeksi

`docs/` klasörü 30.08.2026'da temizlendi: 20 tane tarihli/tek-oturumluk rapor,
prompt kaydı ve artık geçerli olmayan plan dosyası `docs/archive/`'e taşındı —
**silinmedi**, içerikleri aynen duruyor, sadece kök dizinden kaldırıldı ki
projeye yeni bakan biri (ya da yeni bir Claude oturumu) 27+ dosya arasında
hangisinin güncel olduğunu tahmin etmek zorunda kalmasın.

Bu dosya o arşivin **indeksi** — hangi dosyanın ne anlattığını, hangi tarihte
yazıldığını ve (varsa) `tasks.md`'deki hangi maddeyle örtüştüğünü listeler.
Güncel mimari/ürün özeti için `docs/PROJECT-OVERVIEW.md`'ye, satır satır iş
takibi için `tasks.md`'ye (repo kökü) bakın — bu iki dosya artık projenin tek
"güncel durum" kaynağı, aşağıdakiler tarihsel referans.

---

## Kronolojik sıra

### 1. İlk planlama (proje başlangıcı)
- **`archive/CMS_INTEGRATION_PLAN.md`** — CMS entegrasyonunun ilk planlama
  dokümanı. **Strapi öneriyordu; proje sonunda Payload CMS ile inşa edildi.**
  Sapmanın gerekçesi hiçbir yerde ayrıca yazılı değil — muhtemelen Payload'ın
  TypeScript-native, self-hosted, Postgres-adapter'lı olması (bkz.
  `PROJECT-OVERVIEW.md` §3) ama bu bir varsayım, kayıtlı bir karar değil.

### 2. Faz 0/A-H — ilk düzeltme turu
- **`archive/CLAUDE-CODE-PROMPT.md`** → **`archive/DUZELTME-TURU-RAPORU.md`**
  — kategori/kampanya/medya/dashboard/i18n odaklı ilk yapılandırılmış geri
  bildirim turu ve kök-neden analizleri (`/kampanyalar` bug'ı, profil
  fotoğrafı, audit-logs matrisi).

### 3. 3. tur — referential integrity, publish akışı, sıralama
- **`archive/CLAUDE-CODE-PROMPT-2.md`** → **`archive/DUZELTME-TURU-3-RAPORU.md`**
  (`CMS-USER-TESTS.md` Bölüm 5, madde 5.1-5.12).
- **`archive/GUVENLIK-TARAMA-VE-ROL-TESTI.md`** — bu turdan sonraki güvenlik
  taraması + 4 rol × 4 akış uçtan uca test. En kritik bulgu: `afterLogin`
  hook'unun kendi oturumunu silmesi.

### 4. Kategori/SSS/Blog scope ayrımı
- **`archive/CLAUDE-CODE-PROMPT-3.md`** → **`archive/KATEGORI-SSS-TURU-RAPORU.md`**
  (`CMS-USER-TESTS.md` Bölüm 6) — `aninda-bakiye-2` slug çakışmasının kök
  neden kanıtı, karar/alternatif listesi.

### 5. Sıra UX + rich text editörü
- **`archive/CLAUDE-CODE-PROMPT-4.md`** → **`archive/RICHTEXT-SIRA-TURU-RAPORU.md`**
  (`CMS-USER-TESTS.md` Bölüm 7) — renderer/renk kararları, canlı site
  karşılaştırması.
- **`archive/CLAUDE-CODE-PROMPT-5.md`** — bu serinin son promptu (video
  render, kategori filtreleri, CSV export, sıra doğrulama) — ayrı bir rapor
  üretmedi, doğrudan `CMS-USER-TESTS.md`'ye işlendi.

### 6. İçerik parity + CMS yeterlilik denetimi
- **`archive/CONTENT-CMS-AUDIT-PROMPT.md`** → **`archive/AUDIT-CONTENT-CMS.md`**
  — 5 paralel ajanla (canlı site envanteri, repo envanteri, CMS şema
  denetimi, hardcoded içerik taraması, teknik/SEO denetimi) yapılan bulgu
  sentezi.
- **`archive/BACKLOG-CONTENT-CMS.md`** — o denetimin P0/P1/P2 görev listesi,
  büyük ölçüde tamamlandı.

### 7. Production-readiness / risk kaydı
- **`archive/PRODUCTION_READINESS_PROMPT.md`** → **`archive/T0-PRODUCTION-READINESS.md`**
  — R-01..R-26 risk kaydı, olgunluk skoru, fazlı yol haritası. Çoğu risk
  kapandı (bkz. `PROJECT-OVERVIEW.md` §10-11); genel açık madde durumu artık
  `tasks.md`'nin en güncel maddelerinde.

### 8. RFP uyum analizi (ilk tur)
- **`archive/RFP-GAP-ANALYSIS.md`** (11.08.2026) — ilk RFP satır-satır uyum
  analizi, ~%20 uyumdan başlıyor. **Yerini `docs/RFP-GAP-ANALYSIS-2026-08-24.md`
  aldı** (kök dizinde duruyor, güncel).

### 9. 25-29.08.2026 — `tasks.md`'nin kendi dönemi
Bu tarihten sonraki her madde zaten `tasks.md`'de (repo kökü) madde madde,
kök-neden + çözüm + canlı doğrulama formatında tutuluyor — burada tekrar
edilmiyor. `docs/archive/STATUS.md`, bu dönemin 26.08'e kadarki bir kısmını
ayrıca özetliyordu; `tasks.md` artık ondan daha güncel ve daha ayrıntılı
olduğu için **`STATUS.md`'nin kronoloji görevi `tasks.md`'ye devretti**, dosya
sadece tarihsel referans olarak arşivde duruyor.
- **`archive/UI-WALKTHROUGH-MAKER.md`**, **`archive/UI-WALKTHROUGH-CHECKER.md`**
  (29.08.2026) — Growth Maker/Checker'ın sidebar'ını uçtan uca gezen manuel
  test kayıtları, üzerine eklenen bulgu/düzeltme günlüğü.

---

## Hâlâ kök dizinde duran, güncel dosyalar

Bu dosyalar arşive taşınmadı çünkü hâlâ aktif olarak güncelleniyor veya kendi
başına özgün bir bakış açısı taşıyor:

| Dosya | Neden hâlâ kökte |
|---|---|
| `RFP-GAP-ANALYSIS-2026-08-24.md` | En güncel RFP uyum analizi. |
| `RFP-OPEN-ITEMS.md` | RFP'nin her maddesinin CMS'teki karşılığı, ✅/🟡/❌/⬜ notasyonu — RFP'ye özgü bir açı, genel kronolojiden ayrı tutulmaya değer. |
| `CMS-USER-TESTS.md` | En ayrıntılı ham kayıt — kullanıcının CMS'i test ederken verdiği geri bildirimin birebir dökümü, 9 bölüm/60+ madde. |
| `RUNBOOK.md` | Uçtan uca RBAC/collection manuel test senaryoları — yeni rol/collection eklenince kullanılır. |
| `SSS-BLOG-REHBER.md` | Editörler için SSS/Blog kategori rehberi. |
| `TEST-USERS.MD` | 4 test kullanıcısının e-posta/şifresi. |
| `LAYOUT-PARITY.md` | Canlı site ↔ blok kütüphanesi paritesi, aktif güncelleniyor. |
| `reference/` | Referans vendor CMS'in ("Butterfly") kendi iç akışları/cache mimarisi — bizim geçmişimiz değil, tasarım ilhamı/parity kaynağı. |
| `research/` | `/clone-website` skill'inin kendi standart çıktı konumu (`.claude/skills/clone-website/SKILL.md`) — proje geçmişi değil, aktif bir araç konvansiyonu, dokunulmadı. |
