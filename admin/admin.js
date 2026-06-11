(function () {
  const repo = "vilnaraa/pusula-website";
  const branch = "main";
  const apiBase = `https://api.github.com/repos/${repo}/contents/`;
  const tokenKey = "pusula_admin_github_token";
  const uploadsPath = "assets/uploads";

  const files = {
    site: {
      title: "Site ayarları",
      kicker: "Genel site",
      description: "Hero, SEO ve ürün metinleri burada düzenlenir. Yayına giden ana sayfa metinleri bu dosyadan beslenir.",
      stats: ["SEO", "Hero", "Ürün metinleri"],
      path: "content/site.json",
      mode: "form",
      fields: [
        ["seo.title", "SEO başlığı", "input"],
        ["seo.description", "SEO açıklaması", "textarea"],
        ["hero.eyebrow", "Hero üst etiketi", "input"],
        ["hero.title", "Hero başlığı", "input"],
        ["hero.tagline", "Hero alt başlığı", "input"],
        ["hero.lead", "Hero açıklaması", "textarea"],
        ["product.title", "Ürün başlığı", "textarea"],
        ["product.description", "Ürün açıklaması", "textarea"],
        ["cards.title", "Kartlar başlığı", "textarea"],
        ["changelog.title", "Changelog başlığı", "input"],
        ["footer.description", "Footer açıklaması", "textarea"]
      ]
    },
    gallery: {
      title: "Ürün galerisi",
      kicker: "Galeri",
      description: "Ana sayfadaki ürün akışı slider'ını yönetir. Görsel yolu için Medya bölümünde upload yapıp yolu kopyalayabilirsin.",
      stats: ["Slider", "Ekran görseli", "Açıklama"],
      path: "content/gallery.json",
      mode: "gallery"
    },
    changelog: {
      title: "Changelog",
      kicker: "Public kayıtlar",
      description: "Kullanıcıların gördüğü ürün değişikliklerini form alanlarıyla ekle. Format JSON'a otomatik yazılır.",
      stats: ["Versiyon", "Eklenenler", "Değişenler"],
      path: "data/changelog.json",
      mode: "changelog"
    },
    cards: {
      title: "Kart sayfaları",
      kicker: "Kart ürün sayfaları",
      description: "Her Pusula kartının /kartlar/... sayfasındaki başlık, görsel, fayda ve kullanım metinlerini yönetir.",
      stats: ["Kart sayfası", "Fayda listesi", "SEO"],
      path: "content/cards.json",
      mode: "cards"
    },
    media: {
      title: "Medya kütüphanesi",
      kicker: "Görsel arşivi",
      description: "Yeni görsel yükle, public yolu kopyala ve galeri/kart/site alanlarında kullan. Bu bölüm doğrudan medya yönetimine açılır.",
      stats: ["Upload", "Kopyala", "Kullan"],
      mode: "media"
    }
  };

  const state = {
    token: sessionStorage.getItem(tokenKey) || "",
    activeFile: "site",
    loaded: {},
    media: []
  };

  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const userLabel = document.getElementById("user-label");
  const editorTitle = document.getElementById("editor-title");
  const editorSummary = document.getElementById("editor-summary");
  const saveState = document.getElementById("save-state");
  const saveButton = document.getElementById("save-button");
  const reloadButton = document.getElementById("reload-button");
  const siteForm = document.getElementById("site-form");
  const jsonEditor = document.getElementById("json-editor");
  const jsonTextarea = document.getElementById("json-textarea");
  const jsonHint = document.getElementById("json-hint");
  const repeaterEditor = document.getElementById("repeater-editor");
  const mediaLibrary = document.getElementById("media-library");
  const mediaGrid = document.getElementById("media-grid");
  const mediaState = document.getElementById("media-state");
  const mediaFileInput = document.getElementById("media-file-input");
  const refreshMediaButton = document.getElementById("refresh-media-button");
  const fileTabs = Array.from(document.querySelectorAll(".file-tab"));

  const setStatus = (message, tone = "neutral") => {
    saveState.textContent = message;
    saveState.dataset.tone = tone;
  };

  const setMediaStatus = (message, tone = "neutral") => {
    mediaState.textContent = message;
    mediaState.dataset.tone = tone;
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const fromBase64 = (value) => {
    const binary = atob(value.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  const toBase64 = (value) => {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  };

  const getPath = (object, path) =>
    path.split(".").reduce((value, key) => (value && value[key] !== undefined ? value[key] : ""), object);

  const setPath = (object, path, value) => {
    const parts = path.split(".");
    let cursor = object;
    parts.slice(0, -1).forEach((part) => {
      if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
      cursor = cursor[part];
    });
    cursor[parts.at(-1)] = value;
  };

  const splitLines = (value) =>
    String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const joinLines = (value) => (Array.isArray(value) ? value.join("\n") : "");

  const apiFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${state.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `GitHub API hatası: ${response.status}`);
    }

    return response.json();
  };

  const loadUser = async () => {
    try {
      const user = await apiFetch("https://api.github.com/user");
      userLabel.textContent = user.login ? `@${user.login}` : "GitHub bağlı";
    } catch {
      userLabel.textContent = "GitHub bağlı";
    }
  };

  const loadFile = async (key, force = false) => {
    if (files[key].mode === "media") return null;
    if (state.loaded[key] && !force) return state.loaded[key];

    setStatus("Dosya yükleniyor...");
    const file = files[key];
    const response = await apiFetch(`${apiBase}${file.path}?ref=${branch}`);
    const json = JSON.parse(fromBase64(response.content));
    state.loaded[key] = {
      json,
      sha: response.sha
    };
    setStatus("Hazır");
    return state.loaded[key];
  };

  const textField = ({ label, value = "", field, type = "input", wide = false }) => {
    const safeValue = escapeHtml(value);
    if (type === "textarea") {
      return `
        <div class="field ${wide ? "wide" : ""}">
          <label>${escapeHtml(label)}</label>
          <textarea data-field="${escapeHtml(field)}">${safeValue}</textarea>
        </div>
      `;
    }

    return `
      <div class="field ${wide ? "wide" : ""}">
        <label>${escapeHtml(label)}</label>
        <input data-field="${escapeHtml(field)}" value="${safeValue}">
      </div>
    `;
  };

  const renderForm = (config, json) => {
    siteForm.innerHTML = config.fields
      .map(([path, label, type]) => {
        const value = String(getPath(json, path) || "");
        return textField({ label, value, field: path, type, wide: type === "textarea" });
      })
      .join("");
  };

  const renderSummary = (config) => {
    editorSummary.innerHTML = `
      <div>
        <p class="eyebrow">${escapeHtml(config.kicker || "İçerik")}</p>
        <strong>${escapeHtml(config.description || "")}</strong>
      </div>
      <div class="summary-pills">
        ${(config.stats || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    `;
  };

  const renderGalleryEditor = (json) => {
    const slides = json.slides || [];
    repeaterEditor.innerHTML = `
      <div class="editor-intro">
        <div>
          <p class="eyebrow">Ürün galerisi</p>
          <h3>Slider ekranlarını yönet</h3>
          <p>Görsel yolu için medya kütüphanesinden dosya yükleyip çıkan yolu buraya yapıştırabilirsin.</p>
        </div>
        <button class="admin-button primary" type="button" data-action="add-gallery">Yeni slide ekle</button>
      </div>
      ${slides
        .map(
          (slide, index) => `
            <article class="repeat-card" data-index="${index}">
              <div class="repeat-head">
                <strong>${String(index + 1).padStart(2, "0")} · ${escapeHtml(slide.title || "Yeni slide")}</strong>
                <button class="icon-button danger" type="button" data-action="remove-item" aria-label="Slide sil">Sil</button>
              </div>
              <div class="repeat-grid">
                ${textField({ label: "Başlık", value: slide.title, field: "title" })}
                ${textField({ label: "Görsel yolu", value: slide.image, field: "image" })}
                ${textField({ label: "Alt metin", value: slide.alt, field: "alt", wide: true })}
                ${textField({ label: "Açıklama", value: slide.description, field: "description", type: "textarea", wide: true })}
                ${textField({ label: "Madde listesi (her satır bir madde)", value: joinLines(slide.points), field: "points", type: "textarea", wide: true })}
              </div>
            </article>
          `
        )
        .join("")}
    `;
  };

  const renderChangelogEditor = (json) => {
    const entries = json.entries || [];
    repeaterEditor.innerHTML = `
      <div class="editor-intro">
        <div>
          <p class="eyebrow">Changelog</p>
          <h3>Sürüm kayıtlarını formdan düzenle</h3>
          <p>Eklenen, değişen ve kaldırılan alanlarında her satır ayrı madde olarak kaydedilir.</p>
        </div>
        <button class="admin-button primary" type="button" data-action="add-changelog">Yeni kayıt ekle</button>
      </div>
      <div class="repeat-grid single">
        ${textField({ label: "Son güncelleme tarihi", value: json.updatedAt, field: "updatedAt" })}
      </div>
      ${entries
        .map(
          (entry, index) => `
            <article class="repeat-card" data-index="${index}">
              <div class="repeat-head">
                <strong>${escapeHtml(entry.version || "Yeni")} · ${escapeHtml(entry.title || "Changelog kaydı")}</strong>
                <button class="icon-button danger" type="button" data-action="remove-item" aria-label="Kayıt sil">Sil</button>
              </div>
              <div class="repeat-grid">
                ${textField({ label: "Versiyon", value: entry.version, field: "version" })}
                ${textField({ label: "Tarih", value: entry.date, field: "date" })}
                ${textField({ label: "Tip", value: entry.type, field: "type" })}
                ${textField({ label: "Başlık", value: entry.title, field: "title" })}
                ${textField({ label: "Özet", value: entry.summary, field: "summary", type: "textarea", wide: true })}
                ${textField({ label: "Eklenenler", value: joinLines(entry.added), field: "added", type: "textarea" })}
                ${textField({ label: "Değişenler", value: joinLines(entry.changed), field: "changed", type: "textarea" })}
                ${textField({ label: "Kaldırılanlar", value: joinLines(entry.removed), field: "removed", type: "textarea" })}
              </div>
            </article>
          `
        )
        .join("")}
    `;
  };

  const renderCardsEditor = (json) => {
    const cards = json.cards || [];
    repeaterEditor.innerHTML = `
      <div class="editor-intro">
        <div>
          <p class="eyebrow">Kart sayfaları</p>
          <h3>Kart ürün anlatılarını yönet</h3>
          <p>Bu alan /kartlar/... sayfalarını üretir. URL slug değerini değiştirmek yeni sayfa adresi oluşturur.</p>
        </div>
        <button class="admin-button primary" type="button" data-action="add-card">Yeni kart ekle</button>
      </div>
      ${cards
        .map(
          (card, index) => `
            <article class="repeat-card card-editor" data-index="${index}">
              <div class="repeat-head">
                <strong>${escapeHtml(card.title || "Yeni kart")} · /kartlar/${escapeHtml(card.slug || "")}/</strong>
                <button class="icon-button danger" type="button" data-action="remove-item" aria-label="Kart sil">Sil</button>
              </div>
              <div class="repeat-grid">
                ${textField({ label: "URL slug", value: card.slug, field: "slug" })}
                ${textField({ label: "Menü etiketi", value: card.navLabel, field: "navLabel" })}
                ${textField({ label: "Kategori etiketi", value: card.tag, field: "tag" })}
                ${textField({ label: "Kart adı", value: card.title, field: "title" })}
                ${textField({ label: "Ana başlık", value: card.headline, field: "headline", wide: true })}
                ${textField({ label: "Alt başlık", value: card.subtitle, field: "subtitle", type: "textarea", wide: true })}
                ${textField({ label: "Ürün açıklaması", value: card.description, field: "description", type: "textarea", wide: true })}
                ${textField({ label: "Görsel yolu", value: card.image, field: "image" })}
                ${textField({ label: "Görsel alt metni", value: card.alt, field: "alt" })}
                ${textField({ label: "SEO açıklaması", value: card.metaDescription, field: "metaDescription", type: "textarea", wide: true })}
                ${textField({ label: "Nedir başlığı", value: card.whatTitle, field: "whatTitle" })}
                ${textField({ label: "Nedir metni", value: card.whatText, field: "whatText", type: "textarea", wide: true })}
                ${textField({ label: "Neden başlığı", value: card.whyTitle, field: "whyTitle" })}
                ${textField({ label: "Neden metni", value: card.whyText, field: "whyText", type: "textarea", wide: true })}
                ${textField({ label: "Ne sağlar? (her satır bir madde)", value: joinLines(card.benefits), field: "benefits", type: "textarea" })}
                ${textField({ label: "Ne zaman kullanılır? (her satır bir madde)", value: joinLines(card.useCases), field: "useCases", type: "textarea" })}
                ${textField({ label: "Sinyaller (her satır bir madde)", value: joinLines(card.signals), field: "signals", type: "textarea" })}
                ${textField({ label: "Ürün notları (her satır bir madde)", value: joinLines(card.productNotes), field: "productNotes", type: "textarea" })}
              </div>
            </article>
          `
        )
        .join("")}
    `;
  };

  const readRepeatCards = (listName, fields, arrayFields = []) =>
    Array.from(repeaterEditor.querySelectorAll(".repeat-card")).map((card) => {
      const item = {};
      fields.forEach((field) => {
        const input = card.querySelector(`[data-field="${field}"]`);
        item[field] = arrayFields.includes(field) ? splitLines(input?.value) : input?.value || "";
      });
      return item;
    });

  const readGalleryJson = () => ({
    slides: readRepeatCards("slides", ["title", "description", "image", "alt", "points"], ["points"])
  });

  const readChangelogJson = () => ({
    updatedAt: repeaterEditor.querySelector('[data-field="updatedAt"]')?.value || "",
    entries: readRepeatCards(
      "entries",
      ["version", "date", "title", "type", "summary", "added", "changed", "removed"],
      ["added", "changed", "removed"]
    )
  });

  const readCardsJson = () => ({
    cards: readRepeatCards(
      "cards",
      [
        "slug",
        "navLabel",
        "tag",
        "title",
        "headline",
        "subtitle",
        "description",
        "image",
        "alt",
        "metaDescription",
        "whatTitle",
        "whatText",
        "whyTitle",
        "whyText",
        "benefits",
        "useCases",
        "signals",
        "productNotes"
      ],
      ["benefits", "useCases", "signals", "productNotes"]
    )
  });

  const renderMedia = () => {
    if (!state.media.length) {
      mediaGrid.innerHTML = `<div class="empty-media">Henüz medya dosyası yok. İlk görseli yükleyebilirsin.</div>`;
      return;
    }

    mediaGrid.innerHTML = state.media
      .map((item) => {
        const publicPath = `/${uploadsPath}/${item.name}`;
        return `
          <article class="media-card">
            <img src="${escapeHtml(item.download_url || publicPath)}" alt="">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <code>${escapeHtml(publicPath)}</code>
              <button class="admin-button ghost" type="button" data-copy="${escapeHtml(publicPath)}">Yolu kopyala</button>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const loadMedia = async () => {
    setMediaStatus("Medya yükleniyor...");
    try {
      const response = await apiFetch(`${apiBase}${uploadsPath}?ref=${branch}`);
      state.media = Array.isArray(response)
        ? response.filter((item) => item.type === "file" && !item.name.startsWith("."))
        : [];
      setMediaStatus("Hazır");
    } catch (error) {
      if (String(error.message).includes("Not Found")) {
        state.media = [];
        setMediaStatus("Medya klasörü boş");
      } else {
        setMediaStatus(error.message, "error");
      }
    }
    renderMedia();
  };

  const renderEditor = async () => {
    const key = state.activeFile;
    const config = files[key];

    editorTitle.textContent = config.title;
    renderSummary(config);
    fileTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.file === key));
    siteForm.hidden = true;
    jsonEditor.hidden = true;
    repeaterEditor.hidden = true;
    mediaLibrary.hidden = true;
    saveButton.hidden = config.mode === "media";
    reloadButton.hidden = config.mode === "media";

    if (config.mode === "media") {
      mediaLibrary.hidden = false;
      setStatus("Medya modunda kaydet butonu gerekmez.");
      await loadMedia();
      return;
    }

    const loaded = await loadFile(key);

    if (config.mode === "form") {
      siteForm.hidden = false;
      renderForm(config, loaded.json);
      return;
    }

    repeaterEditor.hidden = false;
    if (config.mode === "gallery") renderGalleryEditor(loaded.json);
    if (config.mode === "changelog") renderChangelogEditor(loaded.json);
    if (config.mode === "cards") renderCardsEditor(loaded.json);
  };

  const readCurrentJson = () => {
    const key = state.activeFile;
    const config = files[key];

    if (config.mode === "json") {
      return JSON.parse(jsonTextarea.value);
    }

    if (config.mode === "gallery") return readGalleryJson();
    if (config.mode === "changelog") return readChangelogJson();
    if (config.mode === "cards") return readCardsJson();

    const current = structuredClone(state.loaded[key].json);
    siteForm.querySelectorAll("[data-path]").forEach((field) => {
      setPath(current, field.dataset.path, field.value);
    });
    siteForm.querySelectorAll("[data-field]").forEach((field) => {
      setPath(current, field.dataset.field, field.value);
    });
    return current;
  };

  const saveCurrentFile = async () => {
    const key = state.activeFile;
    const config = files[key];
    if (config.mode === "media") return;

    const loaded = await loadFile(key);
    const nextJson = readCurrentJson();
    const content = JSON.stringify(nextJson, null, 2) + "\n";

    setStatus("Kaydediliyor...");
    const response = await apiFetch(`${apiBase}${config.path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Update ${config.path} from Pusula Admin`,
        content: toBase64(content),
        sha: loaded.sha,
        branch
      })
    });

    state.loaded[key] = {
      json: nextJson,
      sha: response.content.sha
    };
    setStatus("Kaydedildi. Cloudflare build tetiklenecek.", "success");
  };

  const updateRepeaterStateFromDom = () => {
    const key = state.activeFile;
    if (!state.loaded[key]) return;
    state.loaded[key].json = readCurrentJson();
  };

  const blankGallerySlide = () => ({
    title: "Yeni ürün ekranı",
    description: "Bu ekranın ürün değerini kısa ve net anlat.",
    image: "assets/screens/pusula-current-01.png",
    alt: "Pusula ekran görüntüsü",
    points: ["İlk madde", "İkinci madde", "Üçüncü madde"]
  });

  const blankChangelogEntry = () => ({
    version: "1.2",
    date: new Date().toISOString().slice(0, 10),
    title: "Yeni güncelleme",
    type: "Geliştirme",
    summary: "Bu güncellemenin kısa özeti.",
    added: [],
    changed: [],
    removed: []
  });

  const blankCard = () => ({
    slug: "yeni-kart",
    navLabel: "Yeni kart",
    tag: "Pusula kartı",
    title: "Yeni kart",
    headline: "Yeni kart başlığı.",
    subtitle: "Kartın kullanıcının gününe nasıl yardım ettiğini anlat.",
    description: "Bu kartın ürün içindeki rolünü net şekilde açıkla.",
    image: "/assets/card-calm.png",
    alt: "Yeni kart görseli",
    metaDescription: "Pusula yeni kart sayfası.",
    whatTitle: "Bu kart nedir?",
    whatText: "Kartın ne olduğunu açıkla.",
    whyTitle: "Neden önemli?",
    whyText: "Kartın neden değerli olduğunu açıkla.",
    benefits: [],
    useCases: [],
    signals: [],
    productNotes: []
  });

  const rerenderRepeater = () => {
    const key = state.activeFile;
    const json = state.loaded[key].json;
    if (files[key].mode === "gallery") renderGalleryEditor(json);
    if (files[key].mode === "changelog") renderChangelogEditor(json);
    if (files[key].mode === "cards") renderCardsEditor(json);
  };

  const handleRepeaterAction = (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const key = state.activeFile;
    updateRepeaterStateFromDom();
    const json = state.loaded[key].json;
    const index = Number(button.closest(".repeat-card")?.dataset.index);

    if (button.dataset.action === "remove-item" && Number.isInteger(index)) {
      if (files[key].mode === "gallery") json.slides.splice(index, 1);
      if (files[key].mode === "changelog") json.entries.splice(index, 1);
      if (files[key].mode === "cards") json.cards.splice(index, 1);
    }

    if (button.dataset.action === "add-gallery") json.slides.push(blankGallerySlide());
    if (button.dataset.action === "add-changelog") json.entries.unshift(blankChangelogEntry());
    if (button.dataset.action === "add-card") json.cards.push(blankCard());

    rerenderRepeater();
  };

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const safeFileName = (fileName) => {
    const parts = fileName.split(".");
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : "png";
    const base = parts
      .join(".")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${Date.now()}-${base || "pusula-media"}.${ext}`;
  };

  const uploadMedia = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMediaStatus("Sadece görsel dosyası yüklenebilir.", "error");
      return;
    }

    setMediaStatus("Yükleniyor...");
    const name = safeFileName(file.name);
    const content = await readFileAsBase64(file);
    await apiFetch(`${apiBase}${uploadsPath}/${name}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Upload ${name} from Pusula Admin`,
        content,
        branch
      })
    });

    setMediaStatus(`Yüklendi: /${uploadsPath}/${name}`, "success");
    mediaFileInput.value = "";
    await loadMedia();
  };

  const setAuthenticated = async (token, login = "") => {
    state.token = token;
    sessionStorage.setItem(tokenKey, token);
    loginPanel.hidden = true;
    dashboard.hidden = false;
    loginButton.hidden = true;
    logoutButton.hidden = false;
    if (login) {
      userLabel.textContent = `@${login}`;
    } else {
      await loadUser();
    }
    await renderEditor();
  };

  const logout = () => {
    state.token = "";
    state.loaded = {};
    sessionStorage.removeItem(tokenKey);
    loginPanel.hidden = false;
    dashboard.hidden = true;
    loginButton.hidden = false;
    logoutButton.hidden = true;
    userLabel.textContent = "Bağlı değil";
    setStatus("Hazır");
  };

  const startLogin = () => {
    const popup = window.open(
      `/api/auth?provider=github&scope=public_repo%20user:email&state=${crypto.randomUUID()}`,
      "pusula-github-auth",
      "width=720,height=760"
    );

    if (!popup) {
      setStatus("Popup engellendi. Tarayıcı izinlerini kontrol et.", "error");
    }
  };

  window.addEventListener("message", async (event) => {
    if (typeof event.data !== "string") return;
    if (event.data === "authorizing:github") {
      event.source?.postMessage("authorization:github:ready", event.origin);
      return;
    }

    if (event.data.startsWith("authorization:github:error:")) {
      try {
        const payload = JSON.parse(event.data.replace("authorization:github:error:", ""));
        setStatus(payload.message || "GitHub girişi tamamlanamadı.", "error");
      } catch {
        setStatus("GitHub girişi tamamlanamadı.", "error");
      }
      return;
    }

    if (!event.data.startsWith("authorization:github:success:")) return;

    try {
      const payload = JSON.parse(event.data.replace("authorization:github:success:", ""));
      if (payload.token) {
        await setAuthenticated(payload.token, payload.login || "");
      }
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  loginButton.addEventListener("click", startLogin);
  logoutButton.addEventListener("click", logout);
  reloadButton.addEventListener("click", async () => {
    delete state.loaded[state.activeFile];
    await renderEditor();
  });
  saveButton.addEventListener("click", async () => {
    try {
      await saveCurrentFile();
    } catch (error) {
      setStatus(error.message, "error");
    }
  });
  fileTabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      state.activeFile = tab.dataset.file;
      await renderEditor();
      dashboard.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  });
  repeaterEditor.addEventListener("click", handleRepeaterAction);
  mediaFileInput.addEventListener("change", () => uploadMedia(mediaFileInput.files?.[0]).catch((error) => setMediaStatus(error.message, "error")));
  refreshMediaButton.addEventListener("click", () => loadMedia().catch((error) => setMediaStatus(error.message, "error")));
  mediaGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      setMediaStatus("Görsel yolu kopyalandı.", "success");
    } catch {
      setMediaStatus(button.dataset.copy, "success");
    }
  });

  if (state.token) {
    setAuthenticated(state.token).catch(logout);
  }
})();
