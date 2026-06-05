# Pusula Website Deployment

Bu site için önerilen kurulum:

1. GitHub'da sadece website dosyalarını içeren ayrı bir repo aç.
2. Bu klasörün içeriğini repo köküne yükle.
3. `admin/config.yml` içindeki `repo: CHANGE_ME/pusula-website` değerini gerçek repo adıyla değiştir.
4. Cloudflare Pages içinde bu repo'yu bağla.
5. Build command olarak `npm run build` gir.
6. Build output directory için `/` kullan.
7. Domain olarak `pusulamobil.com.tr` ve `www.pusulamobil.com.tr` bağlı kalmalı.

## Decap CMS Auth

`/admin` panelinin GitHub'a kayıt yazabilmesi için GitHub OAuth kurulumu gerekir.

Minimum pratik akış:

1. GitHub hesabında bir OAuth App oluştur.
2. Homepage URL: `https://pusulamobil.com.tr`
3. Authorization callback URL: Decap/GitHub OAuth sağlayıcısı olarak kullanılacak endpoint.
4. OAuth secret repo içine yazılmamalı.

Cloudflare Pages tek başına Decap için hazır OAuth endpoint sağlamaz. Bu yüzden canlı admin için iki seçenek var:

- Harici Decap OAuth provider kullanmak.
- GitHub repo değişikliklerini şimdilik lokal edit + commit ile yapmak.

İlk canlı sürüm için güvenli ve basit öneri: repo ve Cloudflare deploy kurulsun, içerikler önce lokalden
güncellensin. Admin auth kısmı ayrı küçük bir pass olarak Cloudflare Worker veya uygun OAuth provider ile bağlansın.

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
