(function () {
  const siteData = window.PUSULA_SITE || {};
  const cardData = window.PUSULA_CARDS || { cards: [] };
  const fallbackGallerySlides = [
    {
      title: "İlk temas: güven veren bir başlangıç",
      description:
        "Pusula, kullanıcıyı ilk ekranda net bir güven çerçevesiyle karşılar. Uygulamanın temel kullanımının ücretsiz olduğunu, Apple veya Google ile giriş gerektiğini ve kişisel cevapların varsayılan olarak cihazda kaldığını açık bir dille anlatır.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Pusula onboarding ekranı",
      points: [
        "Apple veya Google girişi zorunludur; sunucu tarafında yalnız e-posta kaydı tutulur.",
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
        "Planım ekranı, uygulamanın önerilerini gerçek dünyaya bağlar. Kullanıcı kahve, yemek, etkinlik veya şehir destekli küçük rota seçenekleriyle o gün kendisine iyi gelebilecek bir yön seçebilir.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Planım ekranı",
      points: [
        "Yakındaki kahve ve restoran önerileri konum izniyle doğrudan uygulama içinde listelenir.",
        "Astro ve şehir bilgisi bir kez ayarlandığında tekrar tekrar sorulmadan günlük plan dilini besler.",
        "Etkinlik alanı canlı veri geldiğinde zenginleşir; veri sınırlıysa kullanıcıya net yönlendirme sunulur."
      ]
    },
    {
      title: "Ayarlar: hesap, sürüm ve güvenli sınırlar",
      description:
        "Ayarlar alanı, hesap bağlantısını, bildirimleri, sürüm bilgisini, changelog ve website geçişlerini tek yerde toplar. Pusula terapi veya klinik destek iddiası taşımaz; bu sınır ekranda açık ve sorumlu bir şekilde korunur.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Ayarlar ekranı",
      points: [
        "3 dakikalık sakinleşme seansı düşük volümlü esinti sesiyle daha yumuşak bir deneyim sunar.",
        "112 araması gibi kritik aksiyonlarda yanlış dokunmaları önlemek için açık onay alınır.",
        "Kriz destek kaynakları günlük ürün akışından ayrı bir ciddiyet ve görünürlükle sunulur."
      ]
    },
    {
      title: "Hesap: zorunlu ama dar kapsamlı",
      description:
        "Pusula’yı kullanmak için Apple veya Google ile giriş gerekir. Supabase tarafında kullanıcıyı tanımak için yalnız e-posta kaydı tutulur; günlük, rüya, fal ve tarot içerikleri local-first kalır.",
      image: "assets/screens/pusula-current-01.png",
      alt: "Hesap ve senkronizasyon ekranı",
      points: [
        "Ayarlar ekranında Hesabım alanı ve hesap bağlantısını kaldırma akışı bulunur.",
        "Sunucu kapsamı e-posta ile sınırlıdır; kişisel içerikler cihazda kalır.",
        "Giriş kapısı, ileride abonelik ve cihazlar arası süreklilik için güvenli temel oluşturur."
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
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const initScrollMotion = () => {
    const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
    const releaseSteps = Array.from(document.querySelectorAll("[data-release-step]"));
    const progressBar = document.querySelector("[data-scroll-progress] span");

    if (revealItems.length > 0) {
      document.body.classList.add("motion-ready");
    }

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      releaseSteps[0]?.classList.add("is-active");
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px 12% 0px",
        threshold: 0.16
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    if (releaseSteps.length > 0) {
      const stepObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!visible) return;

          releaseSteps.forEach((step) => step.classList.toggle("is-active", step === visible.target));
        },
        {
          rootMargin: "-22% 0px -38% 0px",
          threshold: [0.24, 0.42, 0.6]
        }
      );

      releaseSteps.forEach((step) => stepObserver.observe(step));
    }

    if (progressBar instanceof HTMLElement) {
      let ticking = false;

      const updateProgress = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
        progressBar.style.transform = `scaleX(${progress})`;
        ticking = false;
      };

      const queueProgress = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      };

      window.addEventListener("scroll", queueProgress, { passive: true });
      window.addEventListener("resize", queueProgress);
      updateProgress();
    }
  };

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
  const changelogPreviewLimit = 3;
  let currentChangelogFilter = "Tumu";
  let changelogDialog = null;
  let lastFocusedBeforeDialog = null;

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

  const cardUrl = (slug) => `/kartlar/${slug}/`;

  const listHtml = (items) => (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const getOrderedCards = (activeSlug) => {
    const cards = Array.isArray(cardData.cards) ? cardData.cards : [];
    const activeCard = cards.find((card) => card.slug === activeSlug) || cards[0];
    if (!activeCard) return [];
    return [activeCard, ...cards.filter((card) => card.slug !== activeCard.slug)].slice(0, 4);
  };

  const getFeatureTiles = (card, orderedCards) => {
    const supportingText = [...(card.useCases || []), ...(card.signals || []), ...(card.productNotes || [])];
    return (card.benefits || []).slice(0, 4).map((benefit, index) => {
      const visual = orderedCards[index % orderedCards.length] || card;
      return {
        title: String(benefit || "").replace(/\.$/, ""),
        text: supportingText[index] || card.subtitle || card.description || "",
        image: visual.image || "/assets/card-calm.png",
        alt: visual.alt || `${visual.title || "Pusula"} kart görseli`
      };
    });
  };

  const renderMosaicTile = (card, isPrimary = false) => `
    <a
      class="mosaic-tile${isPrimary ? " primary active" : ""}"
      href="${cardUrl(card.slug)}"
      data-card-switch="${escapeHtml(card.slug)}"
      ${isPrimary ? 'aria-current="page"' : ""}
    >
      <img src="${escapeHtml(card.image || "/assets/card-calm.png")}" width="1024" height="1024" alt="${escapeHtml(card.alt || `${card.title} kart görseli`)}">
      <div>
        <span>${escapeHtml(card.tag || card.navLabel || card.title)}</span>
        <strong>${escapeHtml(isPrimary ? card.headline || card.title : card.title)}</strong>
      </div>
    </a>
  `;

  const renderCardMosaic = (orderedCards) => {
    const [activeCard, ...otherCards] = orderedCards;
    if (!activeCard) return "";
    return `
      ${renderMosaicTile(activeCard, true)}
      <div class="mosaic-options">
        ${otherCards.map((card) => renderMosaicTile(card)).join("")}
      </div>
    `;
  };

  const renderCardFacts = (card) =>
    (card.benefits || [])
      .slice(0, 3)
      .map((benefit, index) => `<span><strong>${String(index + 1).padStart(2, "0")}</strong>${escapeHtml(benefit)}</span>`)
      .join("");

  const renderCardFeatures = (card, orderedCards) =>
    getFeatureTiles(card, orderedCards)
      .map(
        (tile, index) => `
          <article class="card-feature-tile">
            <img src="${escapeHtml(tile.image)}" width="1024" height="1024" alt="${escapeHtml(tile.alt)}">
            <div>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(tile.title)}</h3>
              <p>${escapeHtml(tile.text)}</p>
            </div>
          </article>
        `
      )
      .join("");

  const renderCardDetail = (slug, options = {}) => {
    const detail = document.querySelector("[data-card-detail]");
    if (!detail) return;

    const orderedCards = getOrderedCards(slug);
    const card = orderedCards[0];
    if (!card) return;

    detail.dataset.activeCard = card.slug;
    detail.querySelector("[data-card-tag]").textContent = card.tag || "Pusula kartı";
    detail.querySelector("[data-card-title]").textContent = card.title || "";
    detail.querySelector("[data-card-subtitle]").textContent = card.subtitle || "";
    detail.querySelector("[data-card-description]").textContent = card.description || "";
    detail.querySelector("[data-card-facts]").innerHTML = renderCardFacts(card);
    detail.querySelector("[data-card-mosaic]").innerHTML = renderCardMosaic(orderedCards);

    document.querySelector("[data-card-what-title]").textContent = card.whatTitle || `${card.title} nedir?`;
    document.querySelector("[data-card-what-text]").textContent = card.whatText || "";
    document.querySelector("[data-card-why-title]").textContent = card.whyTitle || "Neden önemli?";
    document.querySelector("[data-card-why-text]").textContent = card.whyText || "";
    document.querySelector("[data-card-feature-title]").textContent = card.headline || card.title || "";
    document.querySelector("[data-card-features]").innerHTML = renderCardFeatures(card, orderedCards);
    document.querySelector("[data-card-usecases]").innerHTML = listHtml(card.useCases);
    document.querySelector("[data-card-signals]").innerHTML = listHtml(card.signals);
    document.querySelector("[data-card-notes]").innerHTML = listHtml(card.productNotes);

    document.title = `${card.title} Kartı | Pusula`;

    if (options.pushState !== false && window.location.pathname !== cardUrl(card.slug)) {
      window.history.pushState({ cardSlug: card.slug }, "", cardUrl(card.slug));
    }

    if (options.scroll !== false) {
      detail.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

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

  const renderList = (label, values) => {
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

  const getFilteredEntries = (filter) =>
    filter === "Tumu" ? entries : entries.filter((entry) => entry.type === filter);

  const renderTimelineEntry = (entry, options = {}) => {
    const isCompact = options.compact === true;
    return `
      <article class="timeline-entry${isCompact ? " timeline-entry-compact" : ""}">
        <aside class="timeline-meta" aria-label="${escapeHtml(entry.title)} metası">
          <span class="version-badge">v${escapeHtml(entry.version)}</span>
          <span class="type-badge">${escapeHtml(entry.type)}</span>
          <span class="timeline-date">${escapeHtml(formatDate(entry.date))}</span>
        </aside>
        <div>
          <h3>${escapeHtml(entry.title)}</h3>
          <p>${escapeHtml(entry.summary)}</p>
          ${
            isCompact
              ? ""
              : `<div class="change-columns">
                  ${renderList("Eklendi", entry.added)}
                  ${renderList("Değişti", entry.changed)}
                  ${renderList("Kaldırıldı", entry.removed)}
                </div>`
          }
        </div>
      </article>
    `;
  };

  const getChangelogDialog = () => {
    if (changelogDialog) return changelogDialog;

    const dialog = document.createElement("dialog");
    dialog.className = "changelog-dialog";
    dialog.setAttribute("aria-labelledby", "changelog-dialog-title");
    dialog.innerHTML = `
      <div class="changelog-dialog-shell" role="document">
        <header class="changelog-dialog-header">
          <div>
            <p class="eyebrow dark">Public changelog</p>
            <h2 id="changelog-dialog-title">Ürün günlüğü</h2>
            <p data-changelog-dialog-count></p>
          </div>
          <button class="changelog-dialog-close" type="button" data-changelog-close aria-label="Changelog penceresini kapat">×</button>
        </header>
        <div class="changelog-dialog-body">
          <div class="timeline changelog-dialog-timeline" data-changelog-dialog-list></div>
        </div>
      </div>
    `;

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeChangelogDialog();
      }
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (lastFocusedBeforeDialog instanceof HTMLElement) {
        lastFocusedBeforeDialog.focus();
      }
    });

    document.body.append(dialog);
    changelogDialog = dialog;
    return dialog;
  };

  const openChangelogDialog = () => {
    const filtered = getFilteredEntries(currentChangelogFilter);
    const dialog = getChangelogDialog();
    const title = dialog.querySelector("#changelog-dialog-title");
    const count = dialog.querySelector("[data-changelog-dialog-count]");
    const modalList = dialog.querySelector("[data-changelog-dialog-list]");

    if (title) {
      title.textContent =
        currentChangelogFilter === "Tumu"
          ? "Tüm ürün günlüğü"
          : `${currentChangelogFilter} kayıtları`;
    }

    if (count) {
      count.textContent = `${filtered.length} kayıt, tarih sırasına göre listeleniyor.`;
    }

    if (modalList) {
      modalList.innerHTML = filtered.map((entry) => renderTimelineEntry(entry)).join("");
    }

    lastFocusedBeforeDialog = document.activeElement;
    document.body.classList.add("dialog-open");

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    dialog.setAttribute("open", "");
  };

  function closeChangelogDialog() {
    if (!changelogDialog) return;

    if (typeof changelogDialog.close === "function" && changelogDialog.open) {
      changelogDialog.close();
      return;
    }

    changelogDialog.removeAttribute("open");
    document.body.classList.remove("dialog-open");
  }

  const renderEntries = (filter) => {
    currentChangelogFilter = filter;
    const filtered = getFilteredEntries(filter);

    if (!list) return;

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">Bu filtrede henüz changelog kaydı yok.</div>`;
      return;
    }

    const previewEntries = filtered.slice(0, changelogPreviewLimit);
    const remainingCount = Math.max(filtered.length - previewEntries.length, 0);

    list.innerHTML = `
      ${previewEntries.map((entry) => renderTimelineEntry(entry, { compact: true })).join("")}
      <div class="changelog-more-row">
        <button class="button dark-button changelog-more-button" type="button" data-changelog-open>
          ${remainingCount > 0 ? `${remainingCount} kayıt daha göster` : "Changelog detaylarını aç"}
        </button>
      </div>
    `;
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

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-changelog-open]")) {
      openChangelogDialog();
      return;
    }

    if (target.closest("[data-changelog-close]")) {
      closeChangelogDialog();
      return;
    }

    const switcher = target.closest("[data-card-switch]");
    if (!switcher || !document.querySelector("[data-card-detail]")) return;

    event.preventDefault();
    renderCardDetail(switcher.dataset.cardSwitch, { pushState: true, scroll: true });
  });

  window.addEventListener("popstate", () => {
    const match = window.location.pathname.match(/^\/kartlar\/([^/]+)\/?$/);
    if (match) {
      renderCardDetail(match[1], { pushState: false, scroll: false });
    }
  });

  renderSiteContent();
  renderGallery();
  if (document.querySelector("[data-card-detail]")) {
    const activeSlug = document.querySelector("[data-card-detail]")?.dataset.activeCard;
    renderCardDetail(activeSlug, { pushState: false, scroll: false });
  }
  renderEntries("Tumu");
  initScrollMotion();
})();
