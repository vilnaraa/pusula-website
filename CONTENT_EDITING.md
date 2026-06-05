# Pusula Website İçerik Yönetimi

Bu site WordPress kullanmaz. İçerikler JSON dosyalarından yönetilir ve build script bu dosyalardan site datası üretir.

## Hızlı Özet

Değiştirmek istediğin şeye göre dosya:

- SEO, hero, ürün başlığı, ilkeler, footer: `content/site.json`
- Ürün slider yazıları ve görselleri: `content/gallery.json`
- Changelog kayıtları: `data/changelog.json`
- Görseller: `assets/` veya CMS yüklemeleri için `assets/uploads/`

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

`content/gallery.json` içindeki `slides` listesini düzenle.

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

## Changelog Nasıl Güncellenir?

`data/changelog.json` içinde:

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

## CMS Paneli

Canlı panel:

```text
https://pusulamobil.com.tr/admin/
```

Panel şu an dosya yapısı olarak hazır. Canlıda kaydetme yapabilmesi için GitHub OAuth bağlantısı gerekir.
OAuth bağlanana kadar içerikleri lokal dosyalardan düzenleyip GitHub'a push etmek en güvenli yoldur.

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
