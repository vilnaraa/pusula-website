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

const defaultAllowedLogin = "vilnaraa";

const getAllowedLogin = (env) =>
  String(env.ALLOWED_GITHUB_LOGIN || defaultAllowedLogin)
    .trim()
    .toLowerCase();

const missingEnv = () =>
  html(
    "<main style=\"font:16px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:680px;margin:64px auto;padding:24px;line-height:1.6\"><h1>GitHub login ayarı eksik</h1><p>Admin panelinin çalışması için Cloudflare Worker environment içinde <strong>GITHUB_CLIENT_ID</strong> ve <strong>GITHUB_CLIENT_SECRET</strong> tanımlanmalı.</p><p>GitHub OAuth App callback URL değeri: <code>https://pusulamobil.com.tr/api/callback</code></p></main>",
    500
  );

const authError = (provider, message) =>
  html(
    `<script>
      const targetOrigin = window.location.origin;
      if (window.opener) {
        window.opener.postMessage("authorizing:${provider}", targetOrigin);
        window.opener.postMessage("authorization:${provider}:error:${JSON.stringify({ message })}", targetOrigin);
        window.close();
      }
    </script>
    <p>${message}</p>`,
    400
  );

const apiJson = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...jsonHeaders,
      "Cache-Control": "no-store"
    }
  });

const zodiacSigns = ["Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak", "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"];

const celestialBodies = {
  sun: "Güneş",
  moon: "Ay",
  mercury: "Merkür",
  venus: "Venüs",
  mars: "Mars",
  jupiter: "Jüpiter",
  saturn: "Satürn",
  uranus: "Uranüs",
  neptune: "Neptün",
  ascendant: "Yükselen"
};

const normalizeSecret = (value) => {
  const normalized = String(value || "").trim();
  return normalized && !normalized.includes("$(") ? normalized : "";
};

const normalizeDegrees = (value) => {
  const result = value % 360;
  return result < 0 ? result + 360 : result;
};

const degreesToRadians = (degrees) => degrees * Math.PI / 180;
const radiansToDegrees = (radians) => radians * 180 / Math.PI;
const sinDegrees = (degrees) => Math.sin(degreesToRadians(degrees));
const cosDegrees = (degrees) => Math.cos(degreesToRadians(degrees));
const tanDegrees = (degrees) => Math.tan(degreesToRadians(degrees));
const atan2Degrees = (y, x) => radiansToDegrees(Math.atan2(y, x));

const signForLongitude = (longitude) => zodiacSigns[Math.floor(normalizeDegrees(longitude) / 30) % zodiacSigns.length];

const julianDay = (date) => date.getTime() / 86400000 + 2440587.5;

const timezoneOffsetMs = (date, timeZone) => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);
    const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
    const asUTC = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);
    return asUTC - date.getTime();
  } catch {
    return 0;
  }
};

const zonedDateToUTC = ({ year, month, day, hour, minute, timeZone }) => {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const first = new Date(utcGuess - timezoneOffsetMs(new Date(utcGuess), timeZone));
  return new Date(utcGuess - timezoneOffsetMs(first, timeZone));
};

const sunLongitude = (d) => {
  const meanLongitude = normalizeDegrees(280.460 + 0.9856474 * d);
  const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * d);
  return normalizeDegrees(meanLongitude + 1.915 * sinDegrees(meanAnomaly) + 0.020 * sinDegrees(2 * meanAnomaly));
};

const moonLongitude = (d) => {
  const meanLongitude = normalizeDegrees(218.316 + 13.176396 * d);
  const moonMeanAnomaly = normalizeDegrees(134.963 + 13.064993 * d);
  const sunMeanAnomaly = normalizeDegrees(357.529 + 0.98560028 * d);
  const elongation = normalizeDegrees(297.850 + 12.190749 * d);
  const argumentOfLatitude = normalizeDegrees(93.272 + 13.229350 * d);

  return normalizeDegrees(
    meanLongitude
      + 6.289 * sinDegrees(moonMeanAnomaly)
      + 1.274 * sinDegrees(2 * elongation - moonMeanAnomaly)
      + 0.658 * sinDegrees(2 * elongation)
      + 0.214 * sinDegrees(2 * moonMeanAnomaly)
      - 0.186 * sinDegrees(sunMeanAnomaly)
      - 0.114 * sinDegrees(2 * argumentOfLatitude)
  );
};

const orbitalElements = (planet, d) => {
  switch (planet) {
    case "mercury":
      return { node: 48.3313 + 0.0000324587 * d, inclination: 7.0047 + 0.00000005 * d, perihelion: 29.1241 + 0.0000101444 * d, semiMajorAxis: 0.387098, eccentricity: 0.205635 + 0.000000000559 * d, meanAnomaly: 168.6562 + 4.0923344368 * d };
    case "venus":
      return { node: 76.6799 + 0.0000246590 * d, inclination: 3.3946 + 0.0000000275 * d, perihelion: 54.8910 + 0.0000138374 * d, semiMajorAxis: 0.723330, eccentricity: 0.006773 - 0.000000001302 * d, meanAnomaly: 48.0052 + 1.6021302244 * d };
    case "earth":
      return { node: 0, inclination: 0, perihelion: 282.9404 + 0.0000470935 * d, semiMajorAxis: 1.000000, eccentricity: 0.016709 - 0.000000001151 * d, meanAnomaly: 356.0470 + 0.9856002585 * d };
    case "mars":
      return { node: 49.5574 + 0.0000211081 * d, inclination: 1.8497 - 0.0000000178 * d, perihelion: 286.5016 + 0.0000292961 * d, semiMajorAxis: 1.523688, eccentricity: 0.093405 + 0.000000002516 * d, meanAnomaly: 18.6021 + 0.5240207766 * d };
    case "jupiter":
      return { node: 100.4542 + 0.0000276854 * d, inclination: 1.3030 - 0.0000001557 * d, perihelion: 273.8777 + 0.0000164505 * d, semiMajorAxis: 5.20256, eccentricity: 0.048498 + 0.000000004469 * d, meanAnomaly: 19.8950 + 0.0830853001 * d };
    case "saturn":
      return { node: 113.6634 + 0.0000238980 * d, inclination: 2.4886 - 0.0000001081 * d, perihelion: 339.3939 + 0.0000297661 * d, semiMajorAxis: 9.55475, eccentricity: 0.055546 - 0.000000009499 * d, meanAnomaly: 316.9670 + 0.0334442282 * d };
    case "uranus":
      return { node: 74.0005 + 0.000013978 * d, inclination: 0.7733 + 0.000000019 * d, perihelion: 96.6612 + 0.000030565 * d, semiMajorAxis: 19.18171 - 0.0000000155 * d, eccentricity: 0.047318 + 0.00000000745 * d, meanAnomaly: 142.5905 + 0.011725806 * d };
    case "neptune":
      return { node: 131.7806 + 0.000030173 * d, inclination: 1.7700 - 0.000000255 * d, perihelion: 272.8461 - 0.000006027 * d, semiMajorAxis: 30.05826 + 0.00000003313 * d, eccentricity: 0.008606 + 0.00000000215 * d, meanAnomaly: 260.2471 + 0.005995147 * d };
    default:
      throw new Error("Unknown planet");
  }
};

const solveEccentricAnomaly = (meanAnomaly, eccentricity) => {
  let eccentricAnomaly = meanAnomaly + radiansToDegrees(eccentricity * sinDegrees(meanAnomaly) * (1 + eccentricity * cosDegrees(meanAnomaly)));
  for (let index = 0; index < 5; index += 1) {
    const delta = (eccentricAnomaly - radiansToDegrees(eccentricity * sinDegrees(eccentricAnomaly)) - meanAnomaly) / (1 - eccentricity * cosDegrees(eccentricAnomaly));
    eccentricAnomaly -= delta;
  }
  return eccentricAnomaly;
};

const heliocentricCoordinates = (planet, d) => {
  const elements = orbitalElements(planet, d);
  const eccentricAnomaly = solveEccentricAnomaly(elements.meanAnomaly, elements.eccentricity);
  const xv = elements.semiMajorAxis * (cosDegrees(eccentricAnomaly) - elements.eccentricity);
  const yv = elements.semiMajorAxis * (Math.sqrt(1 - elements.eccentricity * elements.eccentricity) * sinDegrees(eccentricAnomaly));
  const trueAnomaly = atan2Degrees(yv, xv);
  const radius = Math.sqrt(xv * xv + yv * yv);
  const argument = trueAnomaly + elements.perihelion;

  return {
    x: radius * (cosDegrees(elements.node) * cosDegrees(argument) - sinDegrees(elements.node) * sinDegrees(argument) * cosDegrees(elements.inclination)),
    y: radius * (sinDegrees(elements.node) * cosDegrees(argument) + cosDegrees(elements.node) * sinDegrees(argument) * cosDegrees(elements.inclination)),
    z: radius * (sinDegrees(argument) * sinDegrees(elements.inclination))
  };
};

const planetLongitude = (planet, d) => {
  const earth = heliocentricCoordinates("earth", d);
  const body = heliocentricCoordinates(planet, d);
  return normalizeDegrees(atan2Degrees(body.y - earth.y, body.x - earth.x));
};

const ascendantLongitude = ({ jd, latitude, longitude }) => {
  const d = jd - 2451545.0;
  const gmst = normalizeDegrees(280.46061837 + 360.98564736629 * d);
  const localSidereal = normalizeDegrees(gmst + longitude);
  const obliquity = 23.439291 - 0.0000004 * d;
  const numerator = -cosDegrees(localSidereal);
  const denominator = sinDegrees(obliquity) * tanDegrees(latitude) + cosDegrees(obliquity) * sinDegrees(localSidereal);
  return normalizeDegrees(atan2Degrees(numerator, denominator));
};

const makePlacement = ({ body, longitude, ascendant }) => {
  const normalized = normalizeDegrees(longitude);
  const inSign = normalized % 30;
  return {
    body,
    longitude: normalized,
    sign: signForLongitude(normalized),
    degree: Math.floor(inSign),
    minute: Math.round((inSign - Math.floor(inSign)) * 60),
    house: Math.floor(normalizeDegrees(normalized - ascendant) / 30) + 1
  };
};

const equalHouses = (ascendant) =>
  Array.from({ length: 12 }, (_, index) => {
    const longitude = normalizeDegrees(ascendant + index * 30);
    return {
      number: index + 1,
      longitude,
      sign: signForLongitude(longitude),
      degree: Math.floor(longitude % 30)
    };
  });

const elementForSign = (sign) => {
  if (["Koç", "Aslan", "Yay"].includes(sign)) return "Ateş";
  if (["Boğa", "Başak", "Oğlak"].includes(sign)) return "Toprak";
  if (["İkizler", "Terazi", "Kova"].includes(sign)) return "Hava";
  return "Su";
};

const modalityForSign = (sign) => {
  if (["Koç", "Yengeç", "Terazi", "Oğlak"].includes(sign)) return "Öncü";
  if (["Boğa", "Aslan", "Akrep", "Kova"].includes(sign)) return "Sabit";
  return "Değişken";
};

const dominantValue = (placements, mapper) => {
  const counts = new Map();
  placements.filter((placement) => placement.body !== celestialBodies.ascendant).forEach((placement) => {
    const key = mapper(placement.sign);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Dengeli";
};

const calculateFallbackNatalChart = (payload) => {
  const location = payload.location || {};
  const year = Number(payload.year);
  const month = Number(payload.month);
  const day = Number(payload.day);
  const hour = Number(payload.hour);
  const minute = Number(payload.minute);
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const timeZoneIdentifier = String(location.timeZoneIdentifier || "UTC");

  if (![year, month, day, hour, minute, latitude, longitude].every(Number.isFinite)) {
    throw new Error("Eksik veya hatalı doğum verisi.");
  }

  const birthDateUTC = zonedDateToUTC({ year, month, day, hour, minute, timeZone: timeZoneIdentifier });
  const jd = julianDay(birthDateUTC);
  const d = jd - 2451543.5;
  const ascendant = ascendantLongitude({ jd, latitude, longitude });
  const houses = equalHouses(ascendant);
  const placements = [
    [celestialBodies.sun, sunLongitude(d)],
    [celestialBodies.moon, moonLongitude(d)],
    [celestialBodies.mercury, planetLongitude("mercury", d)],
    [celestialBodies.venus, planetLongitude("venus", d)],
    [celestialBodies.mars, planetLongitude("mars", d)],
    [celestialBodies.jupiter, planetLongitude("jupiter", d)],
    [celestialBodies.saturn, planetLongitude("saturn", d)],
    [celestialBodies.uranus, planetLongitude("uranus", d)],
    [celestialBodies.neptune, planetLongitude("neptune", d)],
    [celestialBodies.ascendant, ascendant]
  ].map(([body, longitudeValue]) => makePlacement({ body, longitude: longitudeValue, ascendant }));

  return {
    calculatedAt: new Date().toISOString(),
    birthDateUTC: birthDateUTC.toISOString(),
    location: {
      displayName: String(location.displayName || ""),
      latitude,
      longitude,
      timeZoneIdentifier
    },
    placements,
    houses,
    dominantElement: dominantValue(placements, elementForSign),
    dominantModality: dominantValue(placements, modalityForSign),
    calculationSource: "Pusula server fallback"
  };
};

const handleNatalChart = async (request, env) => {
  if (request.method !== "POST") {
    return apiJson({ error: "Method not allowed" }, 405);
  }

  const expectedKey = normalizeSecret(env.ASTRO_CHART_API_KEY);
  if (expectedKey) {
    const authorization = request.headers.get("Authorization") || "";
    if (authorization !== `Bearer ${expectedKey}`) {
      return apiJson({ error: "Unauthorized" }, 401);
    }
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiJson({ error: "Invalid JSON body" }, 400);
  }

  const providerURL = normalizeSecret(env.ASTRO_PROVIDER_URL);
  if (providerURL) {
    try {
      const providerResponse = await fetch(providerURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(normalizeSecret(env.ASTRO_PROVIDER_KEY) ? { Authorization: `Bearer ${normalizeSecret(env.ASTRO_PROVIDER_KEY)}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (providerResponse.ok) {
        const providerChart = await providerResponse.json();
        return apiJson({
          ...providerChart,
          calculationSource: providerChart.calculationSource || "Swiss Ephemeris provider"
        });
      }
    } catch {
      // Provider failure intentionally falls through to deterministic fallback.
    }
  }

  try {
    return apiJson(calculateFallbackNatalChart(payload));
  } catch (error) {
    return apiJson({ error: error.message || "Natal chart calculation failed" }, 400);
  }
};

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
      const scope = "public_repo user:email";
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

      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "pusula-admin"
        }
      });
      const userData = await userResponse.json();
      const login = String(userData.login || "").toLowerCase();
      const allowedLogin = getAllowedLogin(env);

      if (!userResponse.ok || login !== allowedLogin) {
        return authError(
          "github",
          "Bu admin paneline sadece yetkilendirilmiş GitHub hesabı ile giriş yapılabilir."
        );
      }

      const payload = {
        token: tokenData.access_token,
        provider: "github",
        login
      };
      const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");

      return html(`
        <script>
          const payload = ${safePayload};
          const message = "authorization:github:success:" + JSON.stringify(payload);
          const allowedOrigin = window.location.origin;
          let sent = false;

          const sendToken = (targetOrigin) => {
            if (sent || !window.opener) return;
            if (targetOrigin !== allowedOrigin) return;
            sent = true;
            window.opener.postMessage(message, allowedOrigin);
            window.setTimeout(() => window.close(), 250);
          };

          if (window.opener) {
            window.addEventListener("message", (event) => {
              sendToken(event.origin);
            });
            window.opener.postMessage("authorizing:github", allowedOrigin);
            window.setTimeout(() => sendToken(allowedOrigin), 1200);
          } else {
            document.body.textContent = "GitHub login tamamlandı. Admin penceresine dönebilirsin.";
          }
        </script>
      `);
    }

    if (url.pathname === "/api/natal-chart") {
      return handleNatalChart(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
