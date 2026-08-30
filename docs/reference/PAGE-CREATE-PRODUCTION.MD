# Butterfly CMS - Page (Sayfa) Oluşturma Akışı

## Executive Summary

Bu doküman, Butterfly CMS sisteminde **sıfırdan bir sayfa oluşturma** işleminin tüm adımlarını, kod akışını ve database yapısını detaylı olarak açıklar.

---

## 📋 İçindekiler

1. [Page Nedir?](#1-page-nedir)
2. [Database Yapısı](#2-database-yapısı)
3. [Kullanıcı Akışı (UI Perspective)](#3-kullanıcı-akışı-ui-perspective)
4. [Backend Kod Akışı](#4-backend-kod-akışı)
5. [Request Lifecycle](#5-request-lifecycle)
6. [Validation Kuralları](#6-validation-kuralları)
7. [File Upload Mekanizması](#7-file-upload-mekanizması)
8. [SEO ve Meta Bilgileri](#8-seo-ve-meta-bilgileri)
9. [Authorization (Kimler Sayfa Oluşturabilir?)](#9-authorization)
10. [Örnek Senaryo: "Hakkımızda" Sayfası Oluşturma](#10-örnek-senaryo)

---

## 1. Page Nedir?

### CMS'te Page vs Post Farkı

```
┌────────────────────────────────────────────────────────────┐
│  POST (Blog Yazısı)                                        │
│  ├── Dinamik içerik                                        │
│  ├── Tarih odaklı (Yayın tarihi önemli)                   │
│  ├── Kategoriler ve etiketler                              │
│  ├── Yorum yapılabilir                                     │
│  ├── Liste halinde gösterilir                              │
│  └── Örnek: "Laravel 10 Yenilikleri" blog yazısı          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  PAGE (Sayfa)                                              │
│  ├── Statik içerik                                         │
│  ├── Tarih önemsiz (Her zaman geçerli)                    │
│  ├── Hiyerarşik yapı (Ana sayfa > Alt sayfa)              │
│  ├── Navigasyon menülerinde görünür                        │
│  ├── Tekil gösterilir                                      │
│  └── Örnek: "Hakkımızda", "İletişim", "Gizlilik"          │
└────────────────────────────────────────────────────────────┘
```

### Page Kullanım Alanları

- **Kurumsal Sayfalar:** Hakkımızda, Vizyonumuz, Ekibimiz
- **Yasal Sayfalar:** Gizlilik Politikası, Kullanım Şartları, KVKK
- **Servis Sayfaları:** Hizmetlerimiz, Ürünlerimiz
- **İletişim:** İletişim Formu, Adres Bilgileri
- **Landing Pages:** Kampanya sayfaları

---

## 2. Database Yapısı

### Pages Tablosu

```sql
-- filepath: database/migrations/xxxx_create_pages_table.php

CREATE TABLE `pages` (
    -- Primary Key
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Temel Bilgiler
    `title` VARCHAR(255) NOT NULL,                  -- Sayfa başlığı
    `slug` VARCHAR(255) NOT NULL UNIQUE,            -- URL-friendly isim
    `content` LONGTEXT,                             -- HTML içerik
    `excerpt` TEXT,                                 -- Kısa özet

    -- Hiyerarşi
    `parent_id` INT UNSIGNED NULL,                  -- Üst sayfa ID (NULL = ana sayfa)
    `order` INT DEFAULT 0,                          -- Sıralama (menü için)

    -- SEO
    `meta_title` VARCHAR(255),                      -- SEO başlığı
    `meta_description` TEXT,                        -- SEO açıklaması
    `meta_keywords` VARCHAR(255),                   -- Anahtar kelimeler

    -- Görsel
    `featured_image` VARCHAR(255),                  -- Öne çıkan görsel URL

    -- Şablon
    `template` VARCHAR(50) DEFAULT 'default',       -- Sayfa şablonu

    -- Durum
    `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    `visibility` ENUM('public', 'private', 'password') DEFAULT 'public',
    `password` VARCHAR(255),                        -- Şifreli sayfa için

    -- Kullanıcı İlişkileri
    `author_id` INT UNSIGNED NOT NULL,              -- Oluşturan kullanıcı
    `updated_by` INT UNSIGNED,                      -- Son güncelleyen

    -- Tarihler
    `published_at` TIMESTAMP NULL,                  -- Yayınlanma tarihi
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,                    -- Soft delete

    -- Foreign Keys
    FOREIGN KEY (`parent_id`) REFERENCES `pages`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,

    -- Indexes
    INDEX `idx_slug` (`slug`),
    INDEX `idx_status` (`status`),
    INDEX `idx_parent` (`parent_id`),
    INDEX `idx_author` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### İlişkili Tablolar

```sql
-- Page Templates (Şablonlar)
CREATE TABLE `page_templates` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,                   -- 'default', 'landing', 'contact'
    `display_name` VARCHAR(100),                    -- 'Varsayılan', 'Landing Page'
    `description` TEXT,
    `blade_file` VARCHAR(255),                      -- 'pages.templates.default'
    `thumbnail` VARCHAR(255),                       -- Şablon önizleme görseli
    `is_active` BOOLEAN DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Page Meta (Ek Meta Bilgileri)
CREATE TABLE `page_meta` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `page_id` INT UNSIGNED NOT NULL,
    `meta_key` VARCHAR(255) NOT NULL,               -- 'og:image', 'twitter:card'
    `meta_value` TEXT,
    FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE,
    INDEX `idx_page_key` (`page_id`, `meta_key`)
);

-- Page Revisions (Sürüm Geçmişi)
CREATE TABLE `page_revisions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `page_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(255),
    `content` LONGTEXT,
    `revision_number` INT,
    `created_by` INT UNSIGNED,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE CASCADE,
    INDEX `idx_page_revision` (`page_id`, `revision_number`)
);
```

### Örnek Veri

```sql
-- Ana sayfalar
INSERT INTO `pages` (`id`, `title`, `slug`, `content`, `parent_id`, `status`, `author_id`) VALUES
(1, 'Hakkımızda', 'hakkimizda', '<p>Şirket bilgileri...</p>', NULL, 'published', 1),
(2, 'Hizmetlerimiz', 'hizmetlerimiz', '<p>Sunduğumuz hizmetler...</p>', NULL, 'published', 1),
(3, 'İletişim', 'iletisim', '<p>Bizimle iletişime geçin...</p>', NULL, 'published', 1);

-- Alt sayfalar (Hiyerarşik)
INSERT INTO `pages` (`id`, `title`, `slug`, `parent_id`, `status`, `author_id`) VALUES
(4, 'Ekibimiz', 'ekibimiz', 1, 'published', 1),           -- Hakkımızda > Ekibimiz
(5, 'Vizyonumuz', 'vizyonumuz', 1, 'published', 1),       -- Hakkımızda > Vizyonumuz
(6, 'Web Tasarım', 'web-tasarim', 2, 'published', 1),     -- Hizmetlerimiz > Web Tasarım
(7, 'SEO', 'seo', 2, 'published', 1);                      -- Hizmetlerimiz > SEO
```

---

## 3. Kullanıcı Akışı (UI Perspective)

### Adım Adım Kullanıcı Deneyimi

```
┌────────────────────────────────────────────────────────────┐
│  ADIM 1: Admin Panele Giriş                                │
│  URL: /admin/dashboard                                     │
│                                                             │
│  Admin kullanıcı LDAP ile login olmuş                      │
│  Sol menüde "Sayfalar" sekmesini görüyor                   │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  ADIM 2: Sayfalar Listesi                                  │
│  URL: /admin/pages                                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Sayfalar                         [+ Yeni Sayfa]    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Başlık      | Durum    | Yazar  | Tarih           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Hakkımızda  | Yayında  | Admin  | 01.01.2024      │  │
│  │  İletişim    | Yayında  | Admin  | 05.01.2024      │  │
│  │  Kariyer     | Taslak   | Editor | 10.01.2024      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  "Yeni Sayfa" butonuna tıklanıyor                          │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  ADIM 3: Sayfa Oluşturma Formu                             │
│  URL: /admin/pages/create                                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Yeni Sayfa Oluştur                                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  Başlık*                                             │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Hakkımızda                                      │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  Slug (URL)                                          │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ hakkimizda                (Otomatik oluşturuldu)│ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  İçerik*                                             │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ [B] [I] [U] [Link] [Resim]  (WYSIWYG Editor)   │ │  │
│  │  │                                                  │ │  │
│  │  │ <p>Vodafone Payments, dijital ödeme           │ │  │
│  │  │ çözümlerinde öncü...</p>                       │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  Özet                                                │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Kurumsal bilgilerimiz ve vizyonumuz...         │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  Üst Sayfa                                           │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ [▼] Ana Sayfa (yok)                             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  Öne Çıkan Görsel                                    │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ [📁 Dosya Seç] about-us-header.jpg              │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  Şablon                                              │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ (•) Varsayılan                                  │ │  │
│  │  │ ( ) Landing Page                                │ │  │
│  │  │ ( ) İletişim Formu                              │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ─── SEO Ayarları ───                                │  │
│  │                                                       │  │
│  │  Meta Başlık                                         │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Hakkımızda - Vodafone Payments                  │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  Meta Açıklama                                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Vodafone Payments hakkında detaylı bilgi...     │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  Durum                                               │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ [▼] Taslak                                      │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  [💾 Kaydet]  [👁 Önizle]  [🚀 Yayınla]            │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  "Kaydet" butonuna tıklanıyor                              │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  ADIM 4: Form Validation                                   │
│                                                             │
│  JavaScript (Frontend) Kontrolü:                           │
│  ✅ Başlık dolu mu?                                         │
│  ✅ İçerik dolu mu?                                         │
│  ✅ Slug unique mi? (AJAX kontrolü)                        │
│                                                             │
│  Tüm kontroller başarılı                                   │
│  POST request gönderiliyor                                 │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  ADIM 5: Backend İşleme                                    │
│  POST /admin/pages                                         │
│                                                             │
│  Laravel Controller:                                        │
│  - CSRF token doğrulanıyor                                 │
│  - Validation rules çalışıyor                              │
│  - Dosya upload işleniyor                                  │
│  - Slug otomatik generate ediliyor                         │
│  - Database'e INSERT                                       │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  ADIM 6: Başarı Mesajı                                     │
│  URL: /admin/pages (Redirect)                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✅ Sayfa başarıyla oluşturuldu!                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Liste sayfasında yeni sayfa görünüyor                     │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Backend Kod Akışı

### 4.1. Route Tanımlaması

```php
// filepath: routes/web.php

Route::middleware(['auth', 'role:Admin,Editor'])->prefix('admin')->group(function () {

    // Sayfa listesi
    Route::get('/pages', [PageController::class, 'index'])->name('pages.index');

    // Yeni sayfa formu
    Route::get('/pages/create', [PageController::class, 'create'])->name('pages.create');

    // Sayfa kaydetme
    Route::post('/pages', [PageController::class, 'store'])->name('pages.store');

    // Sayfa düzenleme formu
    Route::get('/pages/{page}/edit', [PageController::class, 'edit'])->name('pages.edit');

    // Sayfa güncelleme
    Route::put('/pages/{page}', [PageController::class, 'update'])->name('pages.update');

    // Sayfa silme
    Route::delete('/pages/{page}', [PageController::class, 'destroy'])->name('pages.destroy');

    // AJAX: Slug kontrolü
    Route::post('/pages/check-slug', [PageController::class, 'checkSlug'])->name('pages.checkSlug');

    // Önizleme
    Route::post('/pages/preview', [PageController::class, 'preview'])->name('pages.preview');
});
```

### 4.2. Controller (PageController)

```php
// filepath: app/Http/Controllers/Admin/PageController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\PageTemplate;
use App\Http\Requests\PageRequest;
use App\Services\SlugService;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PageController extends Controller
{
    protected $slugService;
    protected $fileUploadService;

    public function __construct(
        SlugService $slugService,
        FileUploadService $fileUploadService
    ) {
        $this->slugService = $slugService;
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Sayfa listesi
     */
    public function index(Request $request)
    {
        $query = Page::with(['author', 'parent'])
            ->withCount('children');

        // Filtreleme
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'LIKE', "%{$request->search}%")
                  ->orWhere('content', 'LIKE', "%{$request->search}%");
            });
        }

        // Sıralama
        $query->orderBy('order', 'asc')
              ->orderBy('created_at', 'desc');

        $pages = $query->paginate(20);

        return view('admin.pages.index', compact('pages'));
    }

    /**
     * Yeni sayfa formu
     */
    public function create()
    {
        // Üst sayfa olarak seçilebilecek sayfalar
        $parentPages = Page::where('status', 'published')
            ->whereNull('parent_id') // Sadece ana sayfalar
            ->orderBy('title')
            ->get();

        // Mevcut şablonlar
        $templates = PageTemplate::where('is_active', true)
            ->orderBy('name')
            ->get();

        return view('admin.pages.create', compact('parentPages', 'templates'));
    }

    /**
     * Sayfa kaydetme
     */
    public function store(PageRequest $request)
    {
        try {
            DB::beginTransaction();

            // 1. Slug oluştur (eğer boşsa)
            $slug = $request->slug ?: $this->slugService->generate($request->title);

            // 2. Slug unique mi kontrol et
            if (Page::where('slug', $slug)->exists()) {
                $slug = $this->slugService->makeUnique($slug, 'pages');
            }

            // 3. Dosya yükleme (featured image)
            $featuredImagePath = null;
            if ($request->hasFile('featured_image')) {
                $featuredImagePath = $this->fileUploadService->upload(
                    $request->file('featured_image'),
                    'pages/images'
                );
            }

            // 4. Page oluştur
            $page = Page::create([
                'title' => $request->title,
                'slug' => $slug,
                'content' => $request->content,
                'excerpt' => $request->excerpt,
                'parent_id' => $request->parent_id,
                'order' => $request->order ?? 0,
                'meta_title' => $request->meta_title ?? $request->title,
                'meta_description' => $request->meta_description,
                'meta_keywords' => $request->meta_keywords,
                'featured_image' => $featuredImagePath,
                'template' => $request->template ?? 'default',
                'status' => $request->status ?? 'draft',
                'visibility' => $request->visibility ?? 'public',
                'password' => $request->visibility === 'password' ? bcrypt($request->password) : null,
                'author_id' => Auth::id(),
                'published_at' => $request->status === 'published' ? now() : null,
            ]);

            // 5. Ek meta bilgileri kaydet
            if ($request->has('meta_data')) {
                foreach ($request->meta_data as $key => $value) {
                    $page->meta()->create([
                        'meta_key' => $key,
                        'meta_value' => $value
                    ]);
                }
            }

            // 6. İlk revision oluştur
            $page->revisions()->create([
                'title' => $page->title,
                'content' => $page->content,
                'revision_number' => 1,
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return redirect()
                ->route('pages.index')
                ->with('success', 'Sayfa başarıyla oluşturuldu.');

        } catch (\Exception $e) {
            DB::rollBack();

            // Hata durumunda yüklenen dosyayı sil
            if (isset($featuredImagePath)) {
                $this->fileUploadService->delete($featuredImagePath);
            }

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Sayfa oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * AJAX: Slug unique kontrolü
     */
    public function checkSlug(Request $request)
    {
        $slug = $request->slug;
        $pageId = $request->page_id; // Düzenleme sırasında kendi ID'sini hariç tut

        $exists = Page::where('slug', $slug)
            ->when($pageId, function($query) use ($pageId) {
                $query->where('id', '!=', $pageId);
            })
            ->exists();

        return response()->json([
            'available' => !$exists,
            'suggestion' => $exists ? $this->slugService->makeUnique($slug, 'pages') : null
        ]);
    }

    /**
     * Önizleme
     */
    public function preview(Request $request)
    {
        $page = new Page($request->all());
        $page->author = Auth::user();

        return view('pages.preview', compact('page'));
    }
}
```

### 4.3. Request Validation

```php
// filepath: app/Http/Requests/PageRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PageRequest extends FormRequest
{
    /**
     * Kullanıcı bu isteği yapabilir mi?
     */
    public function authorize()
    {
        // Admin veya Editor rolü var mı?
        return $this->user()->hasRole(['Admin', 'Editor']);
    }

    /**
     * Validation kuralları
     */
    public function rules()
    {
        $pageId = $this->route('page') ? $this->route('page')->id : null;

        return [
            // Temel alanlar
            'title' => 'required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/', // Sadece küçük harf, rakam ve tire
                'unique:pages,slug,' . $pageId
            ],
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',

            // Hiyerarşi
            'parent_id' => 'nullable|exists:pages,id',
            'order' => 'nullable|integer|min:0',

            // SEO
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',

            // Görsel
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB

            // Şablon
            'template' => 'nullable|string|exists:page_templates,name',

            // Durum
            'status' => 'required|in:draft,published,archived',
            'visibility' => 'required|in:public,private,password',
            'password' => 'required_if:visibility,password|nullable|string|min:6',

            // Tarih
            'published_at' => 'nullable|date',
        ];
    }

    /**
     * Özel hata mesajları
     */
    public function messages()
    {
        return [
            'title.required' => 'Sayfa başlığı zorunludur.',
            'title.max' => 'Sayfa başlığı en fazla 255 karakter olabilir.',
            'slug.regex' => 'Slug sadece küçük harf, rakam ve tire içerebilir.',
            'slug.unique' => 'Bu slug zaten kullanılıyor.',
            'content.required' => 'Sayfa içeriği zorunludur.',
            'featured_image.image' => 'Dosya bir resim olmalıdır.',
            'featured_image.max' => 'Resim boyutu en fazla 2MB olabilir.',
            'password.required_if' => 'Şifreli sayfa için şifre zorunludur.',
        ];
    }

    /**
     * Validation sonrası işlemler
     */
    protected function prepareForValidation()
    {
        // Slug boşsa title'dan oluştur
        if (empty($this->slug) && !empty($this->title)) {
            $this->merge([
                'slug' => \Str::slug($this->title)
            ]);
        }

        // Meta title boşsa title'ı kullan
        if (empty($this->meta_title) && !empty($this->title)) {
            $this->merge([
                'meta_title' => $this->title
            ]);
        }
    }
}
```

### 4.4. Model (Page)

```php
// filepath: app/Models/Page.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'parent_id',
        'order',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'featured_image',
        'template',
        'status',
        'visibility',
        'password',
        'author_id',
        'updated_by',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * İlişkiler
     */

    // Sayfa yazarı
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // Son güncelleyen
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Üst sayfa
    public function parent()
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    // Alt sayfalar
    public function children()
    {
        return $this->hasMany(Page::class, 'parent_id')
            ->orderBy('order', 'asc');
    }

    // Tüm alt sayfalar (recursive)
    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    // Meta bilgileri
    public function meta()
    {
        return $this->hasMany(PageMeta::class);
    }

    // Sürüm geçmişi
    public function revisions()
    {
        return $this->hasMany(PageRevision::class)
            ->orderBy('revision_number', 'desc');
    }

    /**
     * Scopes (Query yardımcıları)
     */

    // Sadece yayındaki sayfalar
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    // Public sayfalar
    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    // Ana sayfalar (parent_id NULL olanlar)
    public function scopeParent($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Accessors (Getter'lar)
     */

    // URL
    public function getUrlAttribute()
    {
        return url('/' . $this->slug);
    }

    // Tam URL (hiyerarşik)
    public function getFullSlugAttribute()
    {
        $slugs = collect([$this->slug]);
        $parent = $this->parent;

        while ($parent) {
            $slugs->prepend($parent->slug);
            $parent = $parent->parent;
        }

        return $slugs->implode('/');
    }

    // Yayında mı?
    public function getIsPublishedAttribute()
    {
        return $this->status === 'published'
            && $this->published_at
            && $this->published_at <= now();
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        // Sayfa silindiğinde alt sayfaları ve meta bilgilerini de sil
        static::deleting(function($page) {
            $page->children()->delete();
            $page->meta()->delete();
            $page->revisions()->delete();

            // Dosyayı sil
            if ($page->featured_image) {
                \Storage::delete($page->featured_image);
            }
        });
    }
}
```

---

## 5. Request Lifecycle (Detaylı Akış)

### POST /admin/pages (Page Kaydetme)

```
┌────────────────────────────────────────────────────────────┐
│  1. HTTP Request                                           │
│  POST /admin/pages                                         │
│  Content-Type: multipart/form-data                         │
│                                                             │
│  Headers:                                                   │
│  ├── X-CSRF-TOKEN: abc123...                               │
│  ├── Cookie: laravel_session=xyz789...                     │
│  └── Accept: text/html                                     │
│                                                             │
│  Body (Form Data):                                         │
│  ├── title: "Hakkımızda"                                   │
│  ├── slug: "hakkimizda"                                    │
│  ├── content: "<p>Vodafone Payments...</p>"                │
│  ├── excerpt: "Kurumsal bilgilerimiz..."                   │
│  ├── meta_title: "Hakkımızda - Vodafone"                   │
│  ├── meta_description: "..."                               │
│  ├── featured_image: (binary file data)                    │
│  ├── template: "default"                                   │
│  ├── status: "draft"                                       │
│  └── visibility: "public"                                  │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  2. Laravel Router                                         │
│                                                             │
│  Route::post('/admin/pages', [PageController, 'store'])    │
│                                                             │
│  ✅ Route match bulundu                                     │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  3. Middleware Stack                                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  StartSession                                        │  │
│  │  └─> Session'ı başlat                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  VerifyCsrfToken                                     │  │
│  │  └─> CSRF token doğrula ✅                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authenticate (auth)                                 │  │
│  │  └─> User login mi? ✅ (Session'da user var)         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CheckRole (role:Admin,Editor)                       │  │
│  │  └─> Rolü uygun mu? ✅ (User role: Editor)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  4. Controller Method Injection                            │
│                                                             │
│  public function store(PageRequest $request)               │
│                                                             │
│  Laravel Dependency Injection:                             │
│  - PageRequest instance oluştur                            │
│  - Validation'ı tetikle                                    │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  5. Form Request Validation                                │
│                                                             │
│  PageRequest::authorize()                                  │
│  └─> User yetkili mi? ✅                                    │
│                                                             │
│  PageRequest::prepareForValidation()                       │
│  └─> Slug boşsa title'dan oluştur                          │
│      "Hakkımızda" → "hakkimizda"                           │
│                                                             │
│  PageRequest::rules()                                      │
│  ├── title: required ✅                                     │
│  ├── slug: unique ✅                                        │
│  ├── content: required ✅                                   │
│  ├── featured_image: image, max:2048 ✅                    │
│  └── status: in:draft,published ✅                          │
│                                                             │
│  ✅ Tüm validation geçti                                    │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  6. Controller Logic Start                                 │
│                                                             │
│  DB::beginTransaction();                                   │
│  └─> Transaction başlat (ACID garantisi için)             │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  7. Slug Processing                                        │
│                                                             │
│  SlugService::generate("Hakkımızda")                       │
│  ├── Türkçe karakterleri dönüştür: ı→i, ş→s, ğ→g          │
│  ├── Küçük harfe çevir                                     │
│  ├── Boşlukları tire ile değiştir                          │
│  └─> "hakkimizda" ✅                                        │
│                                                             │
│  SlugService::makeUnique("hakkimizda", "pages")            │
│  ├── DB'de "hakkimizda" var mı?                            │
│  ├── Varsa: "hakkimizda-2", "hakkimizda-3" dene            │
│  └─> "hakkimizda" unique ✅                                 │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  8. File Upload Processing                                 │
│                                                             │
│  if ($request->hasFile('featured_image')) {                │
│      FileUploadService::upload(file, 'pages/images')       │
│                                                             │
│      ├── Dosya türü kontrolü (MIME type) ✅                 │
│      ├── Dosya boyutu kontrolü (Max 2MB) ✅                 │
│      ├── Unique filename oluştur:                           │
│      │   timestamp + random → "1705234567_abc123.jpg"      │
│      ├── Dosyayı storage'a kaydet:                          │
│      │   storage/app/public/pages/images/...               │
│      ├── Thumbnail oluştur (varsa):                         │
│      │   - 300x300 (küçük)                                  │
│      │   - 800x600 (orta)                                   │
│      └─> Path döndür: "pages/images/1705234567_abc123.jpg" │
│  }                                                          │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  9. Database INSERT                                        │
│                                                             │
│  Page::create([                                             │
│      'title' => 'Hakkımızda',                              │
│      'slug' => 'hakkimizda',                                │
│      'content' => '<p>Vodafone Payments...</p>',           │
│      'featured_image' => 'pages/images/1705234567.jpg',    │
│      'status' => 'draft',                                   │
│      'author_id' => 5,  // Auth::id()                      │
│      'created_at' => '2024-01-14 10:30:00',                │
│  ]);                                                        │
│                                                             │
│  SQL Query:                                                 │
│  INSERT INTO `pages` (                                      │
│      `title`, `slug`, `content`, `featured_image`,         │
│      `status`, `author_id`, `created_at`, `updated_at`     │
│  ) VALUES (                                                 │
│      'Hakkımızda', 'hakkimizda', '<p>...</p>',             │
│      'pages/images/1705234567.jpg', 'draft', 5,            │
│      NOW(), NOW()                                           │
│  );                                                         │
│                                                             │
│  ✅ Page ID: 42                                             │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  10. Meta Data Insert                                      │
│                                                             │
│  foreach ($request->meta_data as $key => $value) {         │
│      $page->meta()->create([                                │
│          'meta_key' => $key,                                │
│          'meta_value' => $value                             │
│      ]);                                                    │
│  }                                                          │
│                                                             │
│  INSERT INTO `page_meta` VALUES:                            │
│  (42, 'og:image', 'https://...'),                          │
│  (42, 'twitter:card', 'summary'),                          │
│  (42, 'custom_css', '.page { color: red; }')               │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  11. Revision (Versiyon) Kaydet                            │
│                                                             │
│  $page->revisions()->create([                               │
│      'title' => $page->title,                               │
│      'content' => $page->content,                           │
│      'revision_number' => 1,                                │
│      'created_by' => Auth::id()                             │
│  ]);                                                        │
│                                                             │
│  INSERT INTO `page_revisions` ...                           │
│  ✅ Revision ID: 1                                          │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  12. Transaction Commit                                    │
│                                                             │
│  DB::commit();                                              │
│  └─> Tüm değişiklikler kalıcı hale geldi ✅                 │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  13. Flash Message                                         │
│                                                             │
│  Session::flash('success', 'Sayfa başarıyla oluşturuldu.') │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  14. Redirect Response                                     │
│                                                             │
│  return redirect()->route('pages.index');                  │
│                                                             │
│  HTTP/1.1 302 Found                                        │
│  Location: /admin/pages                                    │
│  Set-Cookie: laravel_session=...                           │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  15. Browser Follow Redirect                               │
│                                                             │
│  GET /admin/pages                                          │
│  └─> Sayfa listesi gösterilir                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✅ Sayfa başarıyla oluşturuldu!                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ID | Başlık      | Durum | Yazar  | Tarih         │  │
│  │  42 | Hakkımızda  | Taslak| Editor | 14.01.2024    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Validation Kuralları (Detaylı)

### Field-by-Field Validation

```php
┌────────────────────────────────────────────────────────────┐
│  FIELD: title (Başlık)                                     │
├────────────────────────────────────────────────────────────┤
│  Rules:                                                     │
│  ├── required     → Boş olamaz                             │
│  ├── string       → Metin olmalı                            │
│  └── max:255      → En fazla 255 karakter                   │
│                                                             │
│  ✅ Valid:   "Hakkımızda"                                   │
│  ❌ Invalid: ""            → Boş olamaz                     │
│  ❌ Invalid: 123           → String olmalı                  │
│  ❌ Invalid: "X" * 300     → Max 255                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FIELD: slug (URL Slug)                                    │
├────────────────────────────────────────────────────────────┤
│  Rules:                                                     │
│  ├── nullable     → Boş olabilir (otomatik oluşur)         │
│  ├── string       → Metin olmalı                            │
│  ├── max:255      → En fazla 255 karakter                   │
│  ├── regex:/^[a-z0-9-]+$/  → Sadece küçük, rakam, tire     │
│  └── unique:pages,slug     → Unique olmalı                  │
│                                                             │
│  ✅ Valid:   "hakkimizda"                                   │
│  ✅ Valid:   "iletisim-formu"                               │
│  ✅ Valid:   "sayfa-2024"                                   │
│  ❌ Invalid: "Hakkımızda"    → Büyük harf yok              │
│  ❌ Invalid: "hakkımızda"    → Türkçe karakter yok          │
│  ❌ Invalid: "hakkimizda "   → Boşluk yok                   │
│  ❌ Invalid: "hakkimizda!"   → Özel karakter yok            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FIELD: content (İçerik)                                   │
├────────────────────────────────────────────────────────────┤
│  Rules:                                                     │
│  ├── required     → Boş olamaz                             │
│  └── string       → Metin olmalı (HTML içerebilir)         │
│                                                             │
│  ✅ Valid:   "<p>Vodafone Payments...</p>"                 │
│  ✅ Valid:   "Sadece metin"                                 │
│  ❌ Invalid: ""            → Boş olamaz                     │
│                                                             │
│  Not: HTML sanitization ayrıca yapılmalı (XSS koruması)    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FIELD: featured_image (Öne Çıkan Görsel)                  │
├────────────────────────────────────────────────────────────┤
│  Rules:                                                     │
│  ├── nullable     → Zorunlu değil                           │
│  ├── image        → Resim dosyası olmalı                    │
│  ├── mimes:jpeg,png,jpg,gif  → İzin verilen formatlar      │
│  └── max:2048     → Max 2MB (2048 KB)                       │
│                                                             │
│  ✅ Valid:   image.jpg (1.5 MB)                             │
│  ✅ Valid:   photo.png (500 KB)                             │
│  ❌ Invalid: document.pdf    → PDF değil, image olmalı     │
│  ❌ Invalid: image.bmp        → BMP izinli değil            │
│  ❌ Invalid: large.jpg (5 MB) → Max 2MB                     │
│                                                             │
│  Ek Kontroller (FileUploadService'de):                     │
│  ├── Dosya gerçekten resim mi? (getimagesize)              │
│  ├── MIME type doğru mu?                                    │
│  └── Boyutlar makul mu? (max 5000x5000)                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FIELD: parent_id (Üst Sayfa)                              │
├────────────────────────────────────────────────────────────┤
│  Rules:                                                     │
│  ├── nullable     → Boş olabilir (ana sayfa)               │
│  └── exists:pages,id  → Varolan bir sayfa ID'si olmalı     │
│                                                             │
│  ✅ Valid:   null          → Ana sayfa                      │
│  ✅ Valid:   5             → ID 5 olan sayfa var           │
│  ❌ Invalid: 999           → ID 999 olan sayfa yok         │
│                                                             │
│  Ek Kontrol:                                                │
│  └── Kendi ID'sini parent yapamaz (circular reference)     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FIELD: status (Durum)                                     │
├────────────────────────────────────────────────────────────┤
│  Rules:                                                     │
│  ├── required     → Boş olamaz                             │
│  └── in:draft,published,archived                           │
│                                                             │
│  ✅ Valid:   "draft"                                        │
│  ✅ Valid:   "published"                                    │
│  ✅ Valid:   "archived"                                     │
│  ❌ Invalid: "pending"     → İzinli değerler dışında       │
│  ❌ Invalid: ""            → Boş olamaz                     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FIELD: visibility (Görünürlük)                            │
├────────────────────────────────────────────────────────────┤
│  Rules:                                                     │
│  ├── required     → Boş olamaz                             │
│  └── in:public,private,password                            │
│                                                             │
│  ✅ Valid:   "public"      → Herkes görebilir               │
│  ✅ Valid:   "private"     → Sadece login olmuş             │
│  ✅ Valid:   "password"    → Şifre ile erişim               │
│  ❌ Invalid: "hidden"      → İzinli değil                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FIELD: password (Sayfa Şifresi)                           │
├────────────────────────────────────────────────────────────┤
│  Rules:                                                     │
│  ├── required_if:visibility,password                       │
│  │   → visibility="password" ise zorunlu                   │
│  ├── nullable     → Diğer durumlarda boş olabilir          │
│  ├── string       → Metin olmalı                            │
│  └── min:6        → En az 6 karakter                        │
│                                                             │
│  ✅ Valid:   "secret123"   (visibility=password)            │
│  ✅ Valid:   null          (visibility=public)              │
│  ❌ Invalid: "12345"       → Min 6 karakter                 │
│  ❌ Invalid: null          → visibility=password ise zorunlu│
└────────────────────────────────────────────────────────────┘
```

---

## 7. File Upload Mekanizması

### FileUploadService Detayları

```php
// filepath: app/Services/FileUploadService.php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;

class FileUploadService
{
    /**
     * Dosya yükleme
     *
     * @param UploadedFile $file
     * @param string $directory
     * @return string Dosya path'i
     */
    public function upload(UploadedFile $file, string $directory = 'uploads')
    {
        // 1. Dosya doğrulama
        $this->validateFile($file);

        // 2. Unique filename oluştur
        $filename = $this->generateUniqueFilename($file);

        // 3. Dizin yoksa oluştur
        $fullPath = $directory . '/' . $filename;
        Storage::disk('public')->makeDirectory($directory);

        // 4. Resim ise optimize et
        if ($this->isImage($file)) {
            $this->uploadImage($file, $fullPath);
        } else {
            // Normal dosya upload
            Storage::disk('public')->put($fullPath, file_get_contents($file));
        }

        // 5. Path döndür
        return $fullPath;
    }

    /**
     * Resim yükleme ve optimize etme
     */
    protected function uploadImage(UploadedFile $file, string $path)
    {
        // Resmi yükle ve optimize et
        $image = Image::make($file);

        // Maksimum boyut kontrolü (3000x3000)
        if ($image->width() > 3000 || $image->height() > 3000) {
            $image->resize(3000, 3000, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }

        // Kaliteyi düşür (dosya boyutunu küçült)
        $image->save(
            Storage::disk('public')->path($path),
            80 // %80 kalite
        );

        // Thumbnail oluştur
        $this->createThumbnails($image, $path);
    }

    /**
     * Thumbnail'ler oluştur
     */
    protected function createThumbnails($image, string $originalPath)
    {
        $sizes = [
            'small' => [300, 300],
            'medium' => [800, 600],
        ];

        foreach ($sizes as $size => [$width, $height]) {
            $thumbnailPath = str_replace(
                basename($originalPath),
                $size . '_' . basename($originalPath),
                $originalPath
            );

            $thumbnail = clone $image;
            $thumbnail->fit($width, $height);
            $thumbnail->save(
                Storage::disk('public')->path($thumbnailPath),
                75
            );
        }
    }

    /**
     * Unique filename oluştur
     */
    protected function generateUniqueFilename(UploadedFile $file): string
    {
        $timestamp = time();
        $random = \Str::random(10);
        $extension = $file->getClientOriginalExtension();

        return "{$timestamp}_{$random}.{$extension}";
    }

    /**
     * Dosya doğrulama
     */
    protected function validateFile(UploadedFile $file)
    {
        // Dosya gerçekten upload edilmiş mi?
        if (!$file->isValid()) {
            throw new \Exception('Invalid file upload');
        }

        // İzin verilen MIME type'lar
        $allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
        ];

        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            throw new \Exception('File type not allowed');
        }

        // Max boyut kontrolü (5MB)
        if ($file->getSize() > 5 * 1024 * 1024) {
            throw new \Exception('File size exceeds 5MB');
        }
    }

    /**
     * Dosya resim mi?
     */
    protected function isImage(UploadedFile $file): bool
    {
        return in_array($file->getMimeType(), [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ]);
    }

    /**
     * Dosya silme
     */
    public function delete(string $path)
    {
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);

            // Thumbnail'leri de sil
            $directory = dirname($path);
            $filename = basename($path);

            Storage::disk('public')->delete($directory . '/small_' . $filename);
            Storage::disk('public')->delete($directory . '/medium_' . $filename);
        }
    }
}
```

### Upload Akışı (Görsel)

```
[Browser] → FormData (featured_image)
    ↓
[Laravel] → UploadedFile object
    ↓
[Validation]
    ├─> MIME type kontrolü ✅
    ├─> Dosya boyutu kontrolü ✅
    └─> Extension kontrolü ✅
    ↓
[FileUploadService::upload()]
    ├─> Unique filename: "1705234567_abc123.jpg"
    ├─> Path: "pages/images/1705234567_abc123.jpg"
    ├─> Image optimize (max 3000x3000, 80% quality)
    └─> Thumbnails:
        ├─> "small_1705234567_abc123.jpg" (300x300)
        └─> "medium_1705234567_abc123.jpg" (800x600)
    ↓
[Storage]
    storage/app/public/pages/images/
    ├── 1705234567_abc123.jpg (original, optimized)
    ├── small_1705234567_abc123.jpg (thumbnail)
    └── medium_1705234567_abc123.jpg (thumbnail)
    ↓
[Database]
    featured_image = "pages/images/1705234567_abc123.jpg"
    ↓
[View]
    <img src="{{ asset('storage/' . $page->featured_image) }}">
    → https://example.com/storage/pages/images/1705234567_abc123.jpg
```

---

## 8. SEO ve Meta Bilgileri

### SEO Alanları

```php
┌────────────────────────────────────────────────────────────┐
│  SEO FIELD: meta_title                                     │
├────────────────────────────────────────────────────────────┤
│  Kullanım: <title> HTML tag'i                              │
│  Önerilen: 50-60 karakter                                   │
│                                                             │
│  Örnek:                                                     │
│  "Hakkımızda - Vodafone Payments | Dijital Ödeme Çözümleri"│
│                                                             │
│  HTML Output:                                               │
│  <title>Hakkımızda - Vodafone Payments...</title>         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  SEO FIELD: meta_description                               │
├────────────────────────────────────────────────────────────┤
│  Kullanım: <meta name="description"> tag'i                 │
│  Önerilen: 150-160 karakter                                 │
│                                                             │
│  Örnek:                                                     │
│  "Vodafone Payments, Türkiye'nin önde gelen dijital ödeme  │
│   platformudur. Güvenli ve hızlı ödeme çözümleriyle        │
│   müşterilerimize hizmet veriyoruz."                        │
│                                                             │
│  HTML Output:                                               │
│  <meta name="description" content="Vodafone Payments...">  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  SEO FIELD: meta_keywords                                  │
├────────────────────────────────────────────────────────────┤
│  Kullanım: Eski SEO (artık pek kullanılmıyor)              │
│                                                             │
│  Örnek:                                                     │
│  "vodafone, ödeme, dijital ödeme, finans, mobile banking"  │
│                                                             │
│  HTML Output:                                               │
│  <meta name="keywords" content="vodafone, ödeme...">       │
└────────────────────────────────────────────────────────────┘
```

### Open Graph ve Social Media Meta

```php
// filepath: app/Models/Page.php (ek metotlar)

class Page extends Model
{
    /**
     * Open Graph meta bilgilerini döndür
     */
    public function getOpenGraphMeta()
    {
        return [
            'og:title' => $this->meta_title ?? $this->title,
            'og:description' => $this->meta_description ?? $this->excerpt,
            'og:image' => $this->featured_image ? asset('storage/' . $this->featured_image) : null,
            'og:url' => $this->url,
            'og:type' => 'website',
            'og:site_name' => config('app.name'),
        ];
    }

    /**
     * Twitter Card meta bilgilerini döndür
     */
    public function getTwitterMeta()
    {
        return [
            'twitter:card' => 'summary_large_image',
            'twitter:title' => $this->meta_title ?? $this->title,
            'twitter:description' => $this->meta_description ?? $this->excerpt,
            'twitter:image' => $this->featured_image ? asset('storage/' . $this->featured_image) : null,
        ];
    }
}
```

### View'da Meta Render

```blade
{{-- filepath: resources/views/pages/show.blade.php --}}

@extends('layouts.app')

@section('title', $page->meta_title ?? $page->title)

@section('meta')
    {{-- Basic SEO --}}
    <meta name="description" content="{{ $page->meta_description ?? $page->excerpt }}">
    <meta name="keywords" content="{{ $page->meta_keywords }}">

    {{-- Open Graph --}}
    @foreach($page->getOpenGraphMeta() as $property => $content)
        @if($content)
            <meta property="{{ $property }}" content="{{ $content }}">
        @endif
    @endforeach

    {{-- Twitter Card --}}
    @foreach($page->getTwitterMeta() as $name => $content)
        @if($content)
            <meta name="{{ $name }}" content="{{ $content }}">
        @endif
    @endforeach

    {{-- Canonical URL --}}
    <link rel="canonical" href="{{ $page->url }}">
@endsection

@section('content')
    <article>
        <h1>{{ $page->title }}</h1>

        @if($page->featured_image)
            <img src="{{ asset('storage/' . $page->featured_image) }}"
                 alt="{{ $page->title }}">
        @endif

        <div class="content">
            {!! $page->content !!}
        </div>
    </article>
@endsection
```

---

## 9. Authorization (Kimler Sayfa Oluşturabilir?)

### Rol Bazlı Yetkilendirme

```php
┌────────────────────────────────────────────────────────────┐
│  ROLE: Admin                                               │
├────────────────────────────────────────────────────────────┤
│  ✅ Sayfa oluşturabilir                                     │
│  ✅ Tüm sayfaları görebilir                                 │
│  ✅ Tüm sayfaları düzenleyebilir                            │
│  ✅ Sayfa silebilir                                         │
│  ✅ Sayfa yayınlayabilir                                    │
│  ✅ Şablon seçebilir                                        │
│  ✅ Üst sayfa atayabilir                                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ROLE: Editor                                              │
├────────────────────────────────────────────────────────────┤
│  ✅ Sayfa oluşturabilir                                     │
│  ✅ Tüm sayfaları görebilir                                 │
│  ✅ Tüm sayfaları düzenleyebilir                            │
│  ✅ Sayfa yayınlayabilir                                    │
│  ❌ Sayfa silemez (sadece archived yapabilir)              │
│  ✅ Şablon seçebilir                                        │
│  ✅ Üst sayfa atayabilir                                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ROLE: Author                                              │
├────────────────────────────────────────────────────────────┤
│  ✅ Sayfa oluşturabilir                                     │
│  ✅ Sadece kendi sayfalarını görebilir                      │
│  ✅ Sadece kendi sayfalarını düzenleyebilir                 │
│  ❌ Sayfa yayınlayamaz (Editor onayı gerekir)              │
│  ❌ Sayfa silemez                                           │
│  ❌ Şablon seçemez (varsayılan)                             │
│  ❌ Üst sayfa atayamaz                                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  ROLE: Viewer                                              │
├────────────────────────────────────────────────────────────┤
│  ❌ Sayfa oluşturamaz                                       │
│  ✅ Yayındaki sayfaları görebilir                           │
│  ❌ Sayfa düzenleyemez                                      │
│  ❌ Sayfa silemez                                           │
└────────────────────────────────────────────────────────────┘
```

### Policy Class (Authorization Logic)

```php
// filepath: app/Policies/PagePolicy.php

namespace App\Policies;

use App\Models\User;
use App\Models\Page;

class PagePolicy
{
    /**
     * Kullanıcı sayfa oluşturabilir mi?
     */
    public function create(User $user)
    {
        return $user->hasRole(['Admin', 'Editor', 'Author']);
    }

    /**
     * Kullanıcı bu sayfayı görebilir mi?
     */
    public function view(User $user, Page $page)
    {
        // Admin ve Editor tümünü görebilir
        if ($user->hasRole(['Admin', 'Editor'])) {
            return true;
        }

        // Author sadece kendi sayfalarını görebilir
        if ($user->hasRole('Author')) {
            return $page->author_id === $user->id;
        }

        // Viewer sadece yayındaki sayfaları görebilir
        return $page->status === 'published';
    }

    /**
     * Kullanıcı bu sayfayı düzenleyebilir mi?
     */
    public function update(User $user, Page $page)
    {
        // Admin ve Editor tümünü düzenleyebilir
        if ($user->hasRole(['Admin', 'Editor'])) {
            return true;
        }

        // Author sadece kendi sayfalarını düzenleyebilir
        if ($user->hasRole('Author')) {
            return $page->author_id === $user->id;
        }

        return false;
    }

    /**
     * Kullanıcı bu sayfayı silebilir mi?
     */
    public function delete(User $user, Page $page)
    {
        // Sadece Admin silebilir
        return $user->hasRole('Admin');
    }

    /**
     * Kullanıcı sayfa yayınlayabilir mi?
     */
    public function publish(User $user, Page $page)
    {
        // Admin ve Editor yayınlayabilir
        return $user->hasRole(['Admin', 'Editor']);
    }
}
```

### Controller'da Policy Kullanımı

```php
// filepath: app/Http/Controllers/Admin/PageController.php

public function store(PageRequest $request)
{
    // Policy kontrolü
    $this->authorize('create', Page::class);

    // ...existing code...
}

public function edit(Page $page)
{
    // Bu sayfayı düzenleyebilir mi?
    $this->authorize('update', $page);

    // ...existing code...
}

public function destroy(Page $page)
{
    // Bu sayfayı silebilir mi?
    $this->authorize('delete', $page);

    $page->delete();

    return redirect()->route('pages.index')
        ->with('success', 'Sayfa silindi.');
}

public function publish(Page $page)
{
    // Yayınlayabilir mi?
    $this->authorize('publish', $page);

    $page->update([
        'status' => 'published',
        'published_at' => now()
    ]);

    return redirect()->back()
        ->with('success', 'Sayfa yayınlandı.');
}
```

---

## 10. Örnek Senaryo: "Hakkımızda" Sayfası Oluşturma

### Kullanıcı: Ayşe (Role: Editor)

```
┌────────────────────────────────────────────────────────────┐
│  T=0: LDAP ile Login                                       │
│                                                             │
│  Email: ayse.demir@vodafone.com                            │
│  Password: ********                                         │
│  LDAP Groups: CN=CMS_Editor,OU=Groups,DC=vodafone,DC=com   │
│  → Rol: Editor                                              │
│  → Session başlatıldı                                       │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  T=1: Dashboard                                            │
│                                                             │
│  URL: /admin/dashboard                                     │
│  Menüde "Sayfalar" sekmesi görünüyor (Editor yetkisi var)  │
└─────────────────────┬──────────────────────────────────────┘
                      │ Click: Sayfalar
                      ▼
┌────────────────────────────────────────────────────────────┐
│  T=2: Sayfa Listesi                                        │
│                                                             │
│  URL: /admin/pages                                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Sayfalar                         [+ Yeni Sayfa]    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Başlık      | Durum    | Yazar  | Tarih           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Ana Sayfa   | Yayında  | Admin  | 01.12.2023      │  │
│  │  İletişim    | Yayında  | Admin  | 05.12.2023      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────┘
                      │ Click: Yeni Sayfa
                      ▼
┌────────────────────────────────────────────────────────────┐
│  T=3: Sayfa Oluşturma Formu                                │
│                                                             │
│  URL: /admin/pages/create                                  │
│                                                             │
│  Ayşe formu dolduruyor:                                    │
│                                                             │
│  Başlık: "Hakkımızda"                                      │
│  └─> Slug otomatik oluşur: "hakkimizda"                    │
│                                                             │
│  İçerik: (WYSIWYG Editor)                                  │
│  <h2>Vodafone Payments Kimdir?</h2>                        │
│  <p>Vodafone Payments, Türkiye'nin en büyük dijital        │
│  ödeme platformlarından biridir...</p>                     │
│                                                             │
│  <h2>Vizyonumuz</h2>                                       │
│  <p>Dijital ödemelerde lider olmak...</p>                  │
│                                                             │
│  Özet:                                                      │
│  "Vodafone Payments hakkında kurumsal bilgilerimiz"        │
│                                                             │
│  Öne Çıkan Görsel:                                         │
│  [Dosya Seç] → about-us-header.jpg (1.2 MB)                │
│                                                             │
│  Şablon: "Varsayılan"                                      │
│                                                             │
│  Meta Başlık:                                              │
│  "Hakkımızda - Vodafone Payments | Dijital Ödeme"          │
│                                                             │
│  Meta Açıklama:                                            │
│  "Vodafone Payments'ın kurumsal bilgileri, vizyonu         │
│   ve misyonu hakkında detaylı bilgi edinin."               │
│                                                             │
│  Durum: "Yayında" (Editor yayınlayabilir)                  │
└─────────────────────┬──────────────────────────────────────┘
                      │ Click: Kaydet
                      ▼
┌────────────────────────────────────────────────────────────┐
│  T=4: Frontend Validation (JavaScript)                     │
│                                                             │
│  ✅ Başlık dolu                                             │
│  ✅ İçerik dolu                                             │
│  ✅ Dosya boyutu OK (1.2 MB < 2 MB)                         │
│  ✅ Dosya tipi OK (JPEG)                                    │
│                                                             │
│  AJAX Slug Kontrolü:                                       │
│  POST /admin/pages/check-slug                              │
│  {slug: "hakkimizda"}                                      │
│  Response: {available: true}                                │
│  ✅ Slug unique                                             │
│                                                             │
│  Form submit ediliyor...                                   │
└─────────────────────┬──────────────────────────────────────┘
                      │ POST /admin/pages
                      ▼
┌────────────────────────────────────────────────────────────┐
│  T=5: Backend İşleme                                       │
│                                                             │
│  Middleware:                                                │
│  ├─> CSRF Token ✅                                          │
│  ├─> Authenticated ✅ (Ayşe login)                          │
│  └─> Role Check ✅ (Editor yetkili)                         │
│                                                             │
│  PageRequest Validation:                                   │
│  ├─> title: required ✅                                     │
│  ├─> slug: unique ✅                                        │
│  ├─> content: required ✅                                   │
│  ├─> featured_image: image, max:2048 ✅                    │
│  └─> status: in:draft,published ✅                          │
│                                                             │
│  Controller Logic:                                          │
│  DB::beginTransaction()                                    │
│                                                             │
│  FileUploadService::upload():                              │
│  ├─> Original: pages/images/1705234567_abc123.jpg          │
│  ├─> Small: pages/images/small_1705234567_abc123.jpg       │
│  └─> Medium: pages/images/medium_1705234567_abc123.jpg     │
│                                                             │
│  Page::create([                                             │
│      'title' => 'Hakkımızda',                              │
│      'slug' => 'hakkimizda',                                │
│      'content' => '<h2>Vodafone Payments Kimdir?...</h2>',  │
│      'excerpt' => 'Vodafone Payments hakkında...',         │
│      'featured_image' => 'pages/images/1705234567.jpg',    │
│      'meta_title' => 'Hakkımızda - Vodafone Payments...',  │
│      'meta_description' => 'Vodafone Payments\'ın...',     │
│      'template' => 'default',                               │
│      'status' => 'published',                               │
│      'visibility' => 'public',                              │
│      'author_id' => 5, // Ayşe'nin ID'si                    │
│      'published_at' => '2024-01-14 11:45:00',              │
│  ]);                                                        │
│  → Page ID: 10                                              │
│                                                             │
│  Revision oluştur:                                         │
│  PageRevision::create([                                     │
│      'page_id' => 10,                                       │
│      'revision_number' => 1,                                │
│      'created_by' => 5                                      │
│  ]);                                                        │
│                                                             │
│  DB::commit()                                               │
│  ✅ Tüm işlemler başarılı                                   │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  T=6: Redirect ve Başarı Mesajı                            │
│                                                             │
│  return redirect()->route('pages.index')                   │
│      ->with('success', 'Sayfa başarıyla oluşturuldu.');    │
│                                                             │
│  URL: /admin/pages                                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✅ Sayfa başarıyla oluşturuldu!                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Sayfalar                         [+ Yeni Sayfa]    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Başlık      | Durum    | Yazar  | Tarih           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Hakkımızda  | Yayında  | Ayşe   | 14.01.2024      │  │ ← YENİ
│  │  Ana Sayfa   | Yayında  | Admin  | 01.12.2023      │  │
│  │  İletişim    | Yayında  | Admin  | 05.12.2023      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  T=7: Frontend Görünümü                                    │
│                                                             │
│  URL: https://vodafonepayments.com/hakkimizda              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Logo] Vodafone Payments                            │  │
│  │  [Ana Sayfa] [Hakkımızda] [Hizmetler] [İletişim]    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  [Öne çıkan görsel: about-us-header.jpg]       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  <h1>Hakkımızda</h1>                                 │  │
│  │                                                       │  │
│  │  <h2>Vodafone Payments Kimdir?</h2>                  │  │
│  │  <p>Vodafone Payments, Türkiye'nin en büyük...</p>  │  │
│  │                                                       │  │
│  │  <h2>Vizyonumuz</h2>                                 │  │
│  │  <p>Dijital ödemelerde lider olmak...</p>           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  SEO Meta Tags:                                             │
│  <title>Hakkımızda - Vodafone Payments | Dijital...</title>│
│  <meta name="description" content="Vodafone...">           │
│  <meta property="og:image" content="...jpg">               │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Özet: Page Oluşturma Akışı

### Tüm Adımlar (Bir Bakışta)

```
1. Login (LDAP) → Role belirleme
2. Admin Panel → Sayfalar menüsü
3. Yeni Sayfa butonu
4. Form doldurma
   ├─> Başlık, slug, içerik
   ├─> SEO bilgileri
   ├─> Görsel upload
   └─> Şablon seçimi
5. Frontend validation (JS)
6. Form submit (POST /admin/pages)
7. Backend validation (PageRequest)
8. Authorization check (Policy)
9. File upload (FileUploadService)
10. Slug generation (SlugService)
11. Database INSERT (Page model)
12. Meta data INSERT
13. Revision INSERT
14. Transaction commit
15. Redirect + flash message
16. Sayfa listesinde görünür
17. Frontend'de yayınlanır
```

### Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Blade templates, JavaScript, WYSIWYG Editor (TinyMCE/CKEditor) |
| Backend | Laravel 10, PHP 8.2 |
| Routing | Laravel Router |
| Validation | Form Request |
| Authorization | Laravel Policy |
| ORM | Eloquent |
| Database | MySQL |
| File Storage | Laravel Storage (local/S3) |
| Image Processing | Intervention Image |
| SEO | Meta tags, Open Graph, Twitter Cards |

---

## 🎓 Öğrenme Noktaları

### Yeni Başlayanlar İçin

1. **MVC Pattern'i anla:**
   - Model (Page.php) → Veri
   - View (create.blade.php) → UI
   - Controller (PageController.php) → Mantık

2. **Eloquent ORM:**
   - `Page::create([...])` → INSERT
   - `Page::find($id)` → SELECT
   - İlişkiler: `hasMany`, `belongsTo`

3. **Validation:**
   - Form Request kullanımı
   - Custom rules

4. **Authorization:**
   - Policy classes
   - `$this->authorize()`

5. **File Upload:**
   - `$request->hasFile()`
   - Storage facade
   - Image optimization

### İleri Seviye

1. **Transaction Management:**
   - `DB::beginTransaction()`
   - ACID prensipleri

2. **Slug Generation:**
   - URL-friendly strings
   - Unique constraints

3. **Revision System:**
   - Version control
   - History tracking

4. **SEO Optimization:**
   - Meta tags
   - Open Graph
   - Structured data

---

**Bu doküman, Butterfly CMS'te sıfırdan bir sayfa oluşturma işleminin tüm detaylarını kapsar.**