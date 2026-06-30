# Pusula Website Deployment

Bu site için önerilen kurulum:

1. GitHub'da sadece website dosyalarını içeren ayrı repo hazır olmalı: `vilnaraa/pusula-website`.
2. Bu klasörün içeriğini repo köküne yükle.
3. `/admin/` paneli custom Pusula Admin arayüzüdür; Decap config kullanılmaz.
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

## Pusula Admin Auth

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
   - `ALLOWED_GITHUB_LOGIN` opsiyonel; varsayılan `vilnaraa`.
5. OAuth secret repo içine yazılmamalı.

Bu değerler eksikse `/admin/` açılır, fakat GitHub login eksik konfigürasyon mesajı gösterir.

Admin OAuth scope bilinçli olarak `public_repo user:email` ile sınırlıdır. Callback sonrası GitHub kullanıcısı kontrol edilir; `ALLOWED_GITHUB_LOGIN` dışındaki hesaplara token verilmez.

## Güvenlik notu

Bu repo yalnızca public website içeriği için kullanılmalı.

GitHub'a koyma:

- iOS API anahtarları
- OAuth client secret
- `.xcconfig` secret dosyaları
- Kullanıcı verisi
- App Store Connect bilgileri
- AWS/TMDB/Ticketmaster secret değerleri

## API güvenliği

Mobil uygulama içine provider/backend secret gömülmez. Public endpoint'ler dışarıdan çağrılabilir kabul edilir ve Cloudflare tarafında sınırlandırılır.

`/api/natal-chart` için önerilen minimum üretim ayarı:

- Cloudflare KV namespace oluştur: `PUSULA_RATE_LIMIT_KV`
- Worker binding adı: `PUSULA_RATE_LIMIT_KV`
- Env değerleri: `NATAL_CHART_RATE_LIMIT=12`, `NATAL_CHART_RATE_LIMIT_WINDOW_SECONDS=3600`, `PLUS_API_RATE_LIMIT=60`, `PLUS_API_RATE_LIMIT_WINDOW_SECONDS=3600`
- Cloudflare WAF/Rate Limiting Rule ile `/api/natal-chart` için ek IP ve bot koruması aç
- Provider secret gerekiyorsa sadece Worker env içinde tut; iOS app'e koyma
- Eski `ASTRO_CHART_API_KEY` client bearer koruması olarak kullanılmaz; mobil app static secret göndermemelidir
- Abuse log/alert için Cloudflare analytics ve provider dashboard kota uyarılarını aç

`/api/plus/*` için üretim notu:

- Plus endpoint'leri aynı `PUSULA_RATE_LIMIT_KV` binding'ini `plus:*` prefix'iyle kullanabilir. Daha temiz ayrım istenirse ayrıca `PUSULA_PLUS_KV` binding'i tanımlanabilir.
- Apple Server API doğrulaması için Cloudflare Worker secret olarak `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_KEY_ID`, `APPLE_IAP_PRIVATE_KEY` girilmeli.
- Opsiyonel bundle env: `PUSULA_IOS_BUNDLE_ID=com.canmacbook.pusula`.
- Bu secret'lar girilmeden Plus backend entitlement üretmez; iOS tarafı StoreKit restore ile güvenli fallback'te kalır.

GitHub'a koymak güvenli:

- Web sitesi HTML/CSS/JS
- Public changelog
- Public ürün açıklamaları
- Public görseller
- SEO metadata
