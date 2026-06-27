# Pusula Website

Bu klasör Pusula için statik tanıtım ve public changelog sitesidir.

## Dosyalar

- `index.html`: Sayfa yapısı.
- `styles.css`: Responsive tasarım ve motion ayarları.
- `main.js`: Site içeriği, ürün galerisi ve changelog render logic.
- `content/site.json`: Yönetilebilir SEO, hero, ürün, ilke ve footer metinleri.
- `content/gallery.json`: Yönetilebilir ürün galerisi slaytları.
- `data/changelog.json`: Yönetilebilir changelog kayıtları.
- `data/site.js`, `data/gallery.js`, `data/changelog.js`: Build script tarafından üretilen tarayıcı data dosyaları.
- `admin/`: Pusula'ya özel GitHub OAuth ile çalışan içerik yönetim paneli.
- `assets/`: Uygulama için üretilen bize ait görseller.
- `assets/uploads/`: CMS üzerinden yüklenen görseller.
- `scripts/build-site.js`: JSON içerikten JS data dosyaları ve SEO meta etiketleri üretir.
- `robots.txt`: Arama motoru tarama yönergesi.
- `sitemap.xml`: `pusulamobil.com.tr` için temel sitemap.
- `_headers`: Cloudflare Pages güvenlik ve cache header'ları.
- `wrangler.toml`: Workers Builds kullanıldığında sadece `dist/` assetlerini deploy eder.

## Yönetim paneli

WordPress kullanılmıyor. Site, Pusula'ya özel hafif bir admin paneliyle yönetilecek şekilde hazırlandı.

Canlı ortamda yönetim paneli:

```text
https://pusulamobil.com.tr/admin/
```

Panelden düzenlenebilecek alanlar:

- SEO title, description, canonical URL ve Open Graph bilgileri
- Hero metinleri ve CTA butonları
- Ürün galerisi başlıkları, açıklamaları, maddeleri ve görselleri
- Ürün adımları, ilkeler ve footer metinleri
- Changelog kayıtları

Admin login için GitHub OAuth kullanılır. Worker environment içinde `GITHUB_CLIENT_ID` ve
`GITHUB_CLIENT_SECRET` tanımlı olmalı. Varsayılan yetkili GitHub kullanıcısı `vilnaraa`; gerekirse
Cloudflare environment alanında `ALLOWED_GITHUB_LOGIN` ile değiştirilebilir.

OAuth scope değeri bilinçli olarak `public_repo user:email` ile sınırlıdır. Repo private yapılırsa bu scope
tekrar değerlendirilmelidir.

## Astro Chart API

Worker `/api/natal-chart` endpoint'ini sunar. iOS uygulama doğum tarihi, saat ve çözülmüş doğum
konumunu bu endpoint'e `POST` eder. Endpoint şu şekilde çalışır:

- iOS uygulama static bearer/API key göndermez; mobil binary içindeki secret değerler gizli kabul edilmez.
- `PUSULA_RATE_LIMIT_KV` binding'i tanımlıysa endpoint IP bazlı rate limit uygular.
- Varsayılan kota `NATAL_CHART_RATE_LIMIT=12` ve `NATAL_CHART_RATE_LIMIT_WINDOW_SECONDS=3600`; Cloudflare env üzerinden değiştirilebilir.
- Varsayılan hesaplama `Pusula Astro Engine` ile yapılır; dış lisanslı efemeris kullanılmaz.
- Motor Güneş, Ay, gezegenler, Plüton, Kuzey Ay Düğümü, Yükselen, MC, eşit evler, major açı odakları, element/nitelik dağılımı ve rapor insight'larını döndürür.
- `ASTRO_PROVIDER_URL` ve `ASTRO_PROVIDER_KEY` alanları ileride isteğe bağlı lisanslı provider için korunur; mevcut strateji lisanssız Pusula motorudur.

Bu motor ürün/refleksiyon seviyesi için tasarlanmıştır; profesyonel efemeris veya danışmanlık iddiası taşımaz.

## Changelog nasıl güncellenir?

Tercih edilen yöntem: `/admin` panelinden `Changelog` bölümünü düzenlemek.

Manuel yöntem: `data/changelog.json` içindeki `entries` listesine yeni kayıt ekle.
En yeni kaydı listenin en üstüne koy ve `updatedAt` tarihini güncelle.

Desteklenen `type` değerleri:

- `Yeni`
- `Geliştirme`
- `Tasarım`
- `Güvenlik`
- `Mimari`

## Build

İçerik JSON dosyaları değiştikten sonra:

```bash
node scripts/build-site.js
```

Bu komut:

- `data/site.js` üretir
- `data/gallery.js` üretir
- `data/changelog.js` üretir
- `index.html` içindeki SEO meta etiketlerini günceller
- `sitemap.xml` tarihini günceller

Cloudflare Pages için build command:

```bash
npm run build
```

Build output directory:

```text
dist
```

Cloudflare Workers Builds kullanılıyorsa deploy command sade kalmalı:

```bash
npx wrangler deploy
```

`wrangler.toml` içindeki `[assets]` ayarı Cloudflare'a sadece `dist/` klasörünü deploy etmesini söyler.

`www.pusulamobil.com.tr` -> `pusulamobil.com.tr` yönlendirmesi `_redirects` dosyasına yazılmamalı.
Workers static assets yalnızca relative redirect kabul eder. Host bazlı yönlendirme Cloudflare Dashboard'da
Redirect Rule olarak kurulmalıdır.

## GitHub güvenliği

Bu klasör ayrı bir website reposu olarak GitHub'a yüklenmeli. Mobil uygulama kodu, API key, token,
`.xcconfig` dosyaları veya kullanıcı verisi bu repoya eklenmemeli.

Public repo kullanılırsa site içeriği herkes tarafından görülebilir. Bu normaldir; web sitesinde zaten public
olması gereken metinler ve görseller tutulur. Hassas veri gerekiyorsa repo private kalmalı veya secret olarak
Cloudflare/GitHub environment alanlarına girilmelidir.
