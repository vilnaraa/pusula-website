# Pusula Website Deployment

Bu site için önerilen kurulum:

1. GitHub'da sadece website dosyalarını içeren ayrı repo hazır olmalı: `vilnaraa/pusula-website`.
2. Bu klasörün içeriğini repo köküne yükle.
3. `admin/config.yml` içinde repo değeri `vilnaraa/pusula-website` olmalı.
4. Cloudflare Pages içinde bu repo'yu bağla.
5. Build command olarak `npm run build` gir.
6. Build output directory için `dist` kullan.
7. Domain olarak `pusulamobil.com.tr` ve `www.pusulamobil.com.tr` bağlı kalmalı.
8. `www` -> apex domain yönlendirmesi `_redirects` dosyasıyla değil, Cloudflare Redirect Rule ile yapılmalı.

## Workers Builds ile bağlandıysa

Cloudflare ekranında `Deploy command` alanı görünüyorsa proje Pages değil, Workers Builds olarak bağlanmıştır.
Bu durumda ayarlar:

```text
Build command: npm run build
Deploy command: npx wrangler deploy
Non-production branch deploy command: boş bırak
Path: /
```

Asset klasörü komutta değil, `wrangler.toml` içinde tanımlıdır:

```toml
main = "worker.js"

[assets]
directory = "./dist"
binding = "ASSETS"
not_found_handling = "404-page"
```

## Decap CMS Auth

`/admin` panelinin GitHub'a kayıt yazabilmesi için GitHub OAuth kurulumu gerekir.

Bu repo artık Cloudflare Worker içinde küçük bir OAuth proxy içerir:

- Auth endpoint: `https://pusulamobil.com.tr/api/auth`
- Callback URL: `https://pusulamobil.com.tr/api/callback`

Minimum pratik akış:

1. GitHub hesabında bir OAuth App oluştur.
2. Homepage URL: `https://pusulamobil.com.tr`
3. Authorization callback URL: `https://pusulamobil.com.tr/api/callback`
4. Cloudflare Worker variables/secrets içine şunları gir:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
5. OAuth secret repo içine yazılmamalı.

Bu değerler eksikse `/admin/` açılır, fakat GitHub login eksik konfigürasyon mesajı gösterir.

## Güvenlik notu

Bu repo yalnızca public website içeriği için kullanılmalı.

GitHub'a koyma:

- iOS API anahtarları
- OAuth client secret
- `.xcconfig` secret dosyaları
- Kullanıcı verisi
- App Store Connect bilgileri
- AWS/TMDB/Ticketmaster secret değerleri

GitHub'a koymak güvenli:

- Web sitesi HTML/CSS/JS
- Public changelog
- Public ürün açıklamaları
- Public görseller
- SEO metadata
