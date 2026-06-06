(function () {
  const repo = "vilnaraa/pusula-website";
  const branch = "main";
  const apiBase = `https://api.github.com/repos/${repo}/contents/`;
  const tokenKey = "pusula_admin_github_token";

  const files = {
    site: {
      title: "Site ayarları",
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
      path: "content/gallery.json",
      mode: "json",
      hint: "Slider görselleri ve açıklamaları"
    },
    changelog: {
      title: "Changelog",
      path: "data/changelog.json",
      mode: "json",
      hint: "Public changelog kayıtları"
    }
  };

  const state = {
    token: sessionStorage.getItem(tokenKey) || "",
    activeFile: "site",
    loaded: {}
  };

  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const userLabel = document.getElementById("user-label");
  const editorTitle = document.getElementById("editor-title");
  const saveState = document.getElementById("save-state");
  const saveButton = document.getElementById("save-button");
  const reloadButton = document.getElementById("reload-button");
  const siteForm = document.getElementById("site-form");
  const jsonEditor = document.getElementById("json-editor");
  const jsonTextarea = document.getElementById("json-textarea");
  const jsonHint = document.getElementById("json-hint");
  const fileTabs = Array.from(document.querySelectorAll(".file-tab"));

  const setStatus = (message, tone = "neutral") => {
    saveState.textContent = message;
    saveState.dataset.tone = tone;
  };

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

  const renderForm = (config, json) => {
    siteForm.innerHTML = config.fields
      .map(([path, label, type]) => {
        const value = String(getPath(json, path) || "");
        const escaped = value
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");

        if (type === "textarea") {
          return `
            <div class="field wide">
              <label for="${path}">${label}</label>
              <textarea id="${path}" data-path="${path}">${escaped}</textarea>
            </div>
          `;
        }

        return `
          <div class="field">
            <label for="${path}">${label}</label>
            <input id="${path}" data-path="${path}" value="${escaped}">
          </div>
        `;
      })
      .join("");
  };

  const renderEditor = async () => {
    const key = state.activeFile;
    const config = files[key];
    const loaded = await loadFile(key);

    editorTitle.textContent = config.title;
    fileTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.file === key));

    if (config.mode === "form") {
      jsonEditor.hidden = true;
      siteForm.hidden = false;
      renderForm(config, loaded.json);
      return;
    }

    siteForm.hidden = true;
    jsonEditor.hidden = false;
    jsonHint.textContent = config.hint || config.path;
    jsonTextarea.value = JSON.stringify(loaded.json, null, 2);
  };

  const readCurrentJson = () => {
    const key = state.activeFile;
    const config = files[key];

    if (config.mode === "json") {
      return JSON.parse(jsonTextarea.value);
    }

    const current = structuredClone(state.loaded[key].json);
    siteForm.querySelectorAll("[data-path]").forEach((field) => {
      setPath(current, field.dataset.path, field.value);
    });
    return current;
  };

  const saveCurrentFile = async () => {
    const key = state.activeFile;
    const config = files[key];
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

  const setAuthenticated = async (token) => {
    state.token = token;
    sessionStorage.setItem(tokenKey, token);
    loginPanel.hidden = true;
    dashboard.hidden = false;
    loginButton.hidden = true;
    logoutButton.hidden = false;
    await loadUser();
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
      `/api/auth?provider=github&scope=repo,user:email&state=${crypto.randomUUID()}`,
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

    if (!event.data.startsWith("authorization:github:success:")) return;

    try {
      const payload = JSON.parse(event.data.replace("authorization:github:success:", ""));
      if (payload.token) {
        await setAuthenticated(payload.token);
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
    });
  });

  if (state.token) {
    setAuthenticated(state.token).catch(logout);
  }
})();
