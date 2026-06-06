(function () {
  const siteData = window.PUSULA_SITE || {};
  const cardData = window.PUSULA_CARDS || { cards: [] };
  const fallbackGallerySlides = [
    {
      title: "İlk temas: güven veren bir başlangıç",
      description:
        "Pusula, kullanıcıyı ilk ekranda kayıt baskısıyla karşılamaz. Uygulamanın ücretsiz olduğunu, hesap açmanın zorunlu olmadığını ve kişisel cevapların varsayılan olarak cihazda kaldığını açık bir dille anlatır.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Pusula onboarding ekranı",
      points: [
        "Apple ve Google girişi, sadece kullanıcı isterse devreye giren isteğe bağlı bir seçenektir.",
        "Kişisel cevaplar güven hissi veren bir ilke olarak değil, ürünün çalışma biçimi olarak cihazda kalır.",
        "Onboarding akışı hesap açtırmaya değil, kullanıcının gününü ve ihtiyaç tonunu anlamaya odaklanır."
      ]
    },
    {
      title: "Pusula kartı: her gün için kişisel bir yön",
      description:
        "Ana deneyim, uzun içerikler yerine o güne uygun tek bir net düşünce ve uygulanabilir küçük bir adım verir. Kullanıcı kendini nasıl hissettiğini seçer; Pusula kartı da buna göre tonu, görseli ve mesajı yeniler.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Pusula kartı ekranı",
      points: [
        "Stoik lens, astro ton, kariyer ve sosyalleşme gibi farklı yönler tek kart sistemi içinde birleşir.",
        "Yakın zamanda gösterilen kartlar hatırlanır; aynı mesajların sık tekrar etmesi bilinçli şekilde azaltılır.",
        "135 kartlık içerik havuzu, özgün Türkçe yorumlar ve telif riski düşük bir anlatı diliyle hazırlanır."
      ]
    },
    {
      title: "Bugünüm: yazmadan da kendini ifade et",
      description:
        "Bugünüm, klasik bir journal ekranı gibi uzun yazı istemez. Kullanıcı sadece gününün tonunu seçer; uygulama günlük ritmi tamamlar, kartı günceller ve küçük bir devam hissi oluşturur.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Bugünüm check-in ekranı",
      points: [
        "İlk onboarding tamamlandığında Gün 1 otomatik başlar ve kullanıcı boş bir başlangıçla karşılaşmaz.",
        "Aynı gün tekrar seçim yapılırsa deneyim güncellenir, günlük seri yapay şekilde artırılmaz.",
        "Ruh hali seçimi hem kart görselini hem de kullanıcıya verilen mesajın tonunu etkiler."
      ]
    },
    {
      title: "Planım: iyi gelen şeyi somut bir plana çevir",
      description:
        "Planım ekranı, uygulamanın önerilerini gerçek dünyaya bağlar. Kullanıcı kahve, yemek, etkinlik, ev modu veya spor seçenekleriyle o gün kendisine iyi gelebilecek küçük bir plan seçebilir.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Planım ekranı",
      points: [
        "Yakındaki kahve ve restoran önerileri konum izniyle doğrudan uygulama içinde listelenir.",
        "Ev modu; dizi, film ve spor seçeneklerini görsel, puan ve platform bilgisiyle daha seçilebilir hale getirir.",
        "Etkinlik ve spor alanları canlı veri geldiğinde zenginleşir; veri sınırlıysa kullanıcıya net kısayollar sunulur."
      ]
    },
    {
      title: "Destek: sakinleşme araçları ve net sınırlar",
      description:
        "Destek alanı, kullanıcının ihtiyaç anında hızlıca erişebileceği sakinleşme ve güven kaynaklarını toplar. Pusula terapi veya klinik destek iddiası taşımaz; bu sınır ekranda açık ve sorumlu bir şekilde korunur.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Destek ekranı",
      points: [
        "3 dakikalık sakinleşme seansı düşük volümlü esinti sesiyle daha yumuşak bir deneyim sunar.",
        "112 araması gibi kritik aksiyonlarda yanlış dokunmaları önlemek için açık onay alınır.",
        "Kriz destek kaynakları günlük ürün akışından ayrı bir ciddiyet ve görünürlükle sunulur."
      ]
    },
    {
      title: "Hesap: isteğe bağlı süreklilik",
      description:
        "Pusula’nın temel deneyimi hesapsız çalışır. Apple ve Google ile giriş, yalnızca verilerini ileride cihazlar arasında taşımak isteyen kullanıcılar için isteğe bağlı bir süreklilik katmanı olarak tasarlanır.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Hesap ve senkronizasyon ekranı",
      points: [
        "Destek ekranında Hesabım alanı ve hesap bağlantısını kaldırma akışı bulunur.",
        "Senkronizasyon kapsamı; günlük ritim, tercihler ve kart hafızası gibi anlaşılır başlıklarla açıklanır.",
        "Kullanıcı hesap bağlamadan da Pusula’nın ana deneyimine eksiksiz şekilde erişebilir."
      ]
    }
  ];

  const gallerySlides =
    Array.isArray(window.PUSULA_GALLERY?.slides) && window.PUSULA_GALLERY.slides.length > 0
      ? window.PUSULA_GALLERY.slides
      : fallbackGallerySlides;

  const galleryImage = document.getElementById("gallery-image");
  const galleryTitle = document.getElementById("gallery-title");
  const galleryDescription = document.getElementById("gallery-description");
  const galleryPoints = document.getElementById("gallery-points");
  const galleryCount = document.getElementById("gallery-count");
  const galleryDots = document.getElementById("gallery-dots");
  const galleryPrev = document.querySelector("[data-slider-prev]");
  const galleryNext = document.querySelector("[data-slider-next]");
  let galleryIndex = 0;

  const navDropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));
  navDropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".nav-dropdown-trigger");
    if (!(trigger instanceof HTMLButtonElement)) return;

    trigger.addEventListener("click", () => {
      const isOpen = dropdown.classList.toggle("open");
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;

    navDropdowns.forEach((dropdown) => {
      if (dropdown.contains(target)) return;
      dropdown.classList.remove("open");
      dropdown.querySelector(".nav-dropdown-trigger")?.setAttribute("aria-expanded", "false");
    });
  });

  const accordions = Array.from(document.querySelectorAll(".faq-accordion, .policy-accordion"));
  accordions.forEach((accordion) => {
    accordion.querySelectorAll("details").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;

        accordion.querySelectorAll("details[open]").forEach((candidate) => {
          if (candidate !== details) {
            candidate.removeAttribute("open");
          }
        });
      });
    });
  });

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value) {
      element.textContent = value;
    }
  };

  const setLink = (selector, cta) => {
    const element = document.querySelector(selector);
    if (element && cta?.label && cta?.href) {
      element.textContent = cta.label;
      element.setAttribute("href", cta.href);
    }
  };

  const renderSiteContent = () => {
    const hero = siteData.hero || {};
    const product = siteData.product || {};
    const cards = siteData.cards || {};
    const changelog = siteData.changelog || {};
    const footer = siteData.footer || {};

    setText("[data-site='hero-eyebrow']", hero.eyebrow);
    setText("[data-site='hero-title']", hero.title);
    setText("[data-site='hero-tagline']", hero.tagline);
    setText("[data-site='hero-lead']", hero.lead);
    setLink("[data-site='hero-primary-cta']", hero.primaryCta);
    setLink("[data-site='hero-secondary-cta']", hero.secondaryCta);

    if (Array.isArray(siteData.trust) && siteData.trust.length > 0) {
      const trustBar = document.querySelector(".trust-bar");
      if (trustBar) {
        trustBar.innerHTML = siteData.trust
          .map(
            (item) => `
              <div>
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </div>
            `
          )
          .join("");
      }
    }

    setText("[data-site='product-eyebrow']", product.eyebrow);
    setText("[data-site='product-title']", product.title);
    setText("[data-site='product-description']", product.description);
    setText("[data-site='product-badge']", product.badge);

    if (Array.isArray(product.highlights) && product.highlights.length > 0) {
      const highlights = document.querySelector(".product-highlights");
      if (highlights) {
        highlights.innerHTML = product.highlights
          .map(
            (item) => `
              <article>
                <span>${escapeHtml(item.number)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description)}</p>
              </article>
            `
          )
          .join("");
      }
    }

    setText("[data-site='cards-eyebrow']", cards.eyebrow);
    setText("[data-site='cards-title']", cards.title);

    if (Array.isArray(cardData.cards) && cardData.cards.length > 0) {
      const cardGallery = document.querySelector(".card-gallery");
      const cardMenu = document.querySelectorAll(".nav-dropdown-menu");
      const cardLinks = cardData.cards
        .map(
          (card) => `
            <a role="menuitem" href="/kartlar/${escapeHtml(card.slug)}/">${escapeHtml(card.navLabel || card.title)}</a>
          `
        )
        .join("");

      cardMenu.forEach((menu) => {
        menu.innerHTML = cardLinks;
      });

      if (cardGallery) {
        cardGallery.innerHTML = cardData.cards
          .map(
            (card) => `
              <a class="visual-card" href="/kartlar/${escapeHtml(card.slug)}/" aria-label="${escapeHtml(card.title)} kart sayfası">
                <img src="${escapeHtml(card.image || "/assets/card-calm.png")}" width="640" height="640" alt="${escapeHtml(card.alt || `${card.title} Pusula kart görseli`)}">
                <div>
                  <span>${escapeHtml(card.tag || card.navLabel || card.title)}</span>
                  <h3>${escapeHtml(card.headline || card.title)}</h3>
                </div>
              </a>
            `
          )
          .join("");
      }
    }

    if (Array.isArray(siteData.principles) && siteData.principles.length > 0) {
      const principlesGrid = document.querySelector(".principles-grid");
      if (principlesGrid) {
        principlesGrid.innerHTML = siteData.principles
          .map(
            (item) => `
              <article>
                <span>${escapeHtml(item.number)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description)}</p>
              </article>
            `
          )
          .join("");
      }
    }

    setText("[data-site='changelog-eyebrow']", changelog.eyebrow);
    setText("[data-site='changelog-title']", changelog.title);
    setText("[data-site='changelog-description']", changelog.description);
    setText("[data-site='footer-title']", footer.title);
    setText("[data-site='footer-description']", footer.description);
    setText("[data-site='footer-back-to-top']", footer.backToTopLabel);
  };

  const renderGallery = () => {
    const slide = gallerySlides[galleryIndex];
    if (!slide || !galleryImage || !galleryTitle || !galleryDescription || !galleryPoints || !galleryCount || !galleryDots) {
      return;
    }

    galleryImage.src = slide.image;
    galleryImage.alt = slide.alt;
    galleryTitle.textContent = slide.title;
    galleryDescription.textContent = slide.description;
    galleryPoints.innerHTML = slide.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
    galleryCount.textContent = `${String(galleryIndex + 1).padStart(2, "0")} / ${String(gallerySlides.length).padStart(2, "0")}`;

    galleryDots.innerHTML = gallerySlides
      .map(
        (_, index) => `
          <button
            class="slider-dot${index === galleryIndex ? " active" : ""}"
            type="button"
            data-gallery-index="${index}"
            aria-label="${index + 1}. ekranı göster"
            aria-pressed="${index === galleryIndex ? "true" : "false"}"
          ></button>
        `
      )
      .join("");
  };

  const setGalleryIndex = (nextIndex) => {
    galleryIndex = (nextIndex + gallerySlides.length) % gallerySlides.length;
    renderGallery();
  };

  const data = window.PUSULA_CHANGELOG || { updatedAt: "-", entries: [] };
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const list = document.getElementById("changelog-list");
  const lastUpdated = document.getElementById("last-updated");
  const filterButtons = Array.from(document.querySelectorAll(".filter-button"));

  const formatDate = (dateValue) => {
    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  galleryPrev?.addEventListener("click", () => setGalleryIndex(galleryIndex - 1));
  galleryNext?.addEventListener("click", () => setGalleryIndex(galleryIndex + 1));
  galleryDots?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const index = Number(target.dataset.galleryIndex);
    if (Number.isInteger(index)) {
      setGalleryIndex(index);
    }
  });

  const renderList = (items, label, values) => {
    if (!values || values.length === 0) return "";
    const renderedItems = values
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    return `
      <div class="change-block">
        <h4>${escapeHtml(label)}</h4>
        <ul>${renderedItems}</ul>
      </div>
    `;
  };

  const renderEntries = (filter) => {
    const filtered =
      filter === "Tumu" ? entries : entries.filter((entry) => entry.type === filter);

    if (!list) return;

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">Bu filtrede henüz changelog kaydı yok.</div>`;
      return;
    }

    list.innerHTML = filtered
      .map(
        (entry) => `
          <article class="timeline-entry">
            <aside class="timeline-meta" aria-label="${escapeHtml(entry.title)} metası">
              <span class="version-badge">v${escapeHtml(entry.version)}</span>
              <span class="type-badge">${escapeHtml(entry.type)}</span>
              <span class="timeline-date">${escapeHtml(formatDate(entry.date))}</span>
            </aside>
            <div>
              <h3>${escapeHtml(entry.title)}</h3>
              <p>${escapeHtml(entry.summary)}</p>
              <div class="change-columns">
                ${renderList(entry, "Eklendi", entry.added)}
                ${renderList(entry, "Değişti", entry.changed)}
                ${renderList(entry, "Kaldırıldı", entry.removed)}
              </div>
            </div>
          </article>
        `
      )
      .join("");
  };

  if (lastUpdated) {
    lastUpdated.textContent = formatDate(data.updatedAt);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((candidate) => {
        candidate.classList.remove("active");
        candidate.setAttribute("aria-pressed", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
      renderEntries(button.dataset.filter || "Tumu");
    });
  });

  filterButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      button.classList.contains("active") ? "true" : "false"
    );
  });

  renderSiteContent();
  renderGallery();
  renderEntries("Tumu");
})();
