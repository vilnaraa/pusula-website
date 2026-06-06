const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8"
};

const htmlHeaders = {
  "Content-Type": "text/html; charset=utf-8"
};

const html = (body, status = 200) =>
  new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pusula Admin</title></head><body>${body}</body></html>`, {
    status,
    headers: htmlHeaders
  });

const getOrigin = (request) => new URL(request.url).origin;

const getCallbackUrl = (request) => `${getOrigin(request)}/api/callback`;

const missingEnv = () =>
  html(
    "<main style=\"font:16px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:680px;margin:64px auto;padding:24px;line-height:1.6\"><h1>GitHub login ayarı eksik</h1><p>Admin panelinin çalışması için Cloudflare Worker environment içinde <strong>GITHUB_CLIENT_ID</strong> ve <strong>GITHUB_CLIENT_SECRET</strong> tanımlanmalı.</p><p>GitHub OAuth App callback URL değeri: <code>https://pusulamobil.com.tr/api/callback</code></p></main>",
    500
  );

const authError = (provider, message) =>
  html(
    `<script>
      if (window.opener) {
        window.opener.postMessage("authorizing:${provider}", "*");
        window.opener.postMessage("authorization:${provider}:error:${JSON.stringify({ message })}", "*");
        window.close();
      }
    </script>
    <p>${message}</p>`,
    400
  );

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/admin") {
      return Response.redirect(`${url.origin}/admin/`, 301);
    }

    if (url.pathname === "/cards" || url.pathname === "/cards/") {
      return Response.redirect(`${url.origin}/#cards`, 301);
    }

    if (url.pathname.startsWith("/cards/")) {
      const nextPath = url.pathname.replace(/^\/cards\//, "/kartlar/");
      return Response.redirect(`${url.origin}${nextPath}${url.search}`, 301);
    }

    if (url.pathname === "/api/auth") {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        return missingEnv();
      }

      const provider = url.searchParams.get("provider") || "github";
      if (provider !== "github") {
        return authError(provider, "Desteklenmeyen OAuth sağlayıcısı.");
      }

      const state = url.searchParams.get("state") || crypto.randomUUID();
      const scope = url.searchParams.get("scope") || "repo,user:email";
      const authUrl = new URL("https://github.com/login/oauth/authorize");
      authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", getCallbackUrl(request));
      authUrl.searchParams.set("scope", scope);
      authUrl.searchParams.set("state", state);
      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === "/api/callback") {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        return missingEnv();
      }

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") || "";
      if (!code) {
        return authError("github", "GitHub OAuth code dönmedi.");
      }

      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: getCallbackUrl(request),
          state
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.access_token) {
        return authError("github", tokenData.error_description || tokenData.error || "GitHub token alınamadı.");
      }

      const payload = {
        token: tokenData.access_token,
        provider: "github"
      };
      const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");

      return html(`
        <script>
          const payload = ${safePayload};
          const message = "authorization:github:success:" + JSON.stringify(payload);
          let sent = false;

          const sendToken = (targetOrigin) => {
            if (sent || !window.opener) return;
            sent = true;
            window.opener.postMessage(message, targetOrigin || "*");
            window.setTimeout(() => window.close(), 250);
          };

          if (window.opener) {
            window.addEventListener("message", (event) => {
              sendToken(event.origin);
            });
            window.opener.postMessage("authorizing:github", "*");
            window.setTimeout(() => sendToken("*"), 1200);
          } else {
            document.body.textContent = "GitHub login tamamlandı. Admin penceresine dönebilirsin.";
          }
        </script>
      `);
    }

    return env.ASSETS.fetch(request);
  }
};
