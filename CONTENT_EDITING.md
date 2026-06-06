# Pusula Website İçerik Yönetimi

Bu site WordPress kullanmaz. İçerikler Pusula Admin panelinden form olarak yönetilir; panel değişiklikleri arkada JSON dosyalarına doğru formatta yazar ve GitHub'a commit olarak gönderir.

## Hızlı Özet

Değiştirmek istediğin şeye göre dosya:

- SEO, hero, ürün başlığı, ilkeler, footer: `content/site.json`
- Ürün slider yazıları ve görselleri: `content/gallery.json`
- Kart sayfaları ve ürün anlatıları: `content/cards.json`
- Changelog kayıtları: `data/changelog.json`
- Görseller: `assets/` veya admin yüklemeleri için `assets/uploads/`

Canlı panel:

```text
https://pusulamobil.com.tr/admin/
```

Paneldeki tablar:

- `Site ayarları`: SEO, hero, ürün metinleri, footer.
- `Ürün galerisi`: slider ekranları, açıklamalar, görsel yolları.
- `Changelog`: public sürüm kayıtları.
- `Kart sayfaları`: `/kartlar/...` altındaki ürün sayfaları.
- `Medya kütüphanesi`: görsel upload, yol kopyalama ve ilgili alana yapıştırma.

Değişiklikten sonra çalıştır:

```bash
node scripts/build-site.js
```

Sonra GitHub'a gönder:

```bash
git add .
git commit -m "Update website content"
git push
```

Cloudflare Pages GitHub'a bağlıysa push sonrası site otomatik güncellenir.

## SEO Nasıl Güncellenir?

`content/site.json` içinde şu alanları düzenle:

```json
{
  "seo": {
    "title": "Pusula | Günün tonuna göre kişisel yön",
    "description": "Pusula, günün tonuna göre kişisel yön veren local-first mobil uygulama.",
    "canonicalUrl": "https://pusulamobil.com.tr/",
    "ogTitle": "Pusula",
    "ogDescription": "Günün tonuna göre küçük, kişisel bir yön.",
    "ogImage": "https://pusulamobil.com.tr/assets/hero-pusula.png",
    "themeColor": "#101622"
  }
}
```

Önemli:

- `title`: Google arama sonucunda görünen ana başlık.
- `description`: Google açıklaması için temel metin.
- `ogTitle`, `ogDescription`, `ogImage`: WhatsApp, X, LinkedIn gibi yerlerde link paylaşılınca görünen bilgiler.
- `canonicalUrl`: ana domain; genelde değişmez.

## Ürün Slider Nasıl Güncellenir?

Admin panelde `Ürün galerisi` tabını aç. Yeni slide ekleyebilir, mevcut slide'ların başlık, açıklama, görsel yolu ve madde listesini düzenleyebilirsin.

Elle düzenleme gerekiyorsa `content/gallery.json` içindeki `slides` listesini düzenle.

Her slayt:

```json
{
  "title": "Pusula kartı: her gün için kişisel bir yön",
  "description": "Kısa açıklama.",
  "image": "assets/screens/pusula-current-01.png",
  "alt": "Ekran görseli açıklaması",
  "points": [
    "Madde 1",
    "Madde 2",
    "Madde 3"
  ]
}
```

Yeni görsel ekleyeceksen:

1. Görseli `assets/screens/` veya `assets/uploads/` içine koy.
2. `image` alanına dosya yolunu yaz.
3. `alt` alanını boş bırakma; SEO ve erişilebilirlik için gerekli.

## Kart Sayfaları Nasıl Güncellenir?

Admin panelde `Kart sayfaları` tabını aç. Her kart için şu alanları formdan düzenleyebilirsin:

- URL slug: ör. `kariyer`; sayfa `/kartlar/kariyer/` olur.
- Başlık, alt başlık ve ürün açıklaması.
- `Nedir?`, `Neden önemli?`, `Ne sağlar?`, kullanım durumları ve ürün notları.
- Görsel yolu ve SEO açıklaması.

Önemli: İngilizce `/cards/...` adresleri artık canonical değildir. Eski adresler Worker üzerinden `/kartlar/...` adreslerine yönlenir.

## Changelog Nasıl Güncellenir?

Admin panelde `Changelog` tabını aç. Yeni kayıt ekleyebilir; eklenen, değişen ve kaldırılan maddeleri ayrı satırlar olarak yazabilirsin.

Elle düzenleme gerekiyorsa `data/changelog.json` içinde:

- `updatedAt` tarihini güncelle.
- Yeni kaydı `entries` listesinin en üstüne ekle.

Desteklenen türler:

- `Yeni`
- `Geliştirme`
- `Tasarım`
- `Güvenlik`
- `Mimari`

Örnek:

```json
{
  "version": "1.1",
  "date": "2026-06-05",
  "title": "Website CMS altyapısı eklendi",
  "type": "Mimari",
  "summary": "Site içerikleri WordPress olmadan yönetilebilir JSON/CMS yapısına taşındı.",
  "added": ["Decap CMS paneli", "SEO içerik dosyası"],
  "changed": ["Ürün slider metinleri yönetilebilir hale geldi"],
  "removed": []
}
```

## Medya Kütüphanesi

Admin panelde `Medya kütüphanesi` tabından görsel yükleyebilirsin.

Akış:

1. Görseli yükle.
2. Panel sana `/assets/uploads/...` yolunu gösterir.
3. `Yolu kopyala` ile kopyala.
4. Bu yolu ürün galerisi veya kart sayfasındaki görsel alanına yapıştır.

Bu yöntem formatı bozmaz; panel dosya yolunu JSON içinde doğru alana yazar.

## Güvenlik

Bu website reposuna koyma:

- API key
- OAuth secret
- iOS `.xcconfig` dosyaları
- App Store Connect bilgileri
- Kullanıcı datası
- Kişisel token

Bu website reposuna koymak normal:

- Public site metinleri
- Public changelog
- Public görseller
- SEO metadata
- HTML/CSS/JS
