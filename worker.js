const securityHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
};

const jsonHeaders = {
  ...securityHeaders,
  "Content-Type": "application/json; charset=utf-8"
};

const htmlHeaders = {
  ...securityHeaders,
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

const apiJson = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...jsonHeaders,
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });

const positiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const clientIP = (request) =>
  request.headers.get("CF-Connecting-IP") ||
  request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
  "unknown";

const sha256Hex = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const rateLimitHeaders = ({ limit, remaining, resetAt }) => ({
  "X-RateLimit-Limit": String(limit),
  "X-RateLimit-Remaining": String(Math.max(remaining, 0)),
  "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000))
});

const enforceKVRateLimit = async (request, env, namespace, defaults) => {
  const kv = env.PUSULA_RATE_LIMIT_KV;
  if (!kv || typeof kv.get !== "function" || typeof kv.put !== "function") {
    return { allowed: true, headers: {} };
  }

  const limit = positiveInteger(env.NATAL_CHART_RATE_LIMIT, defaults.limit);
  const windowSeconds = positiveInteger(env.NATAL_CHART_RATE_LIMIT_WINDOW_SECONDS, defaults.windowSeconds);
  const now = Date.now();
  const bucket = Math.floor(now / (windowSeconds * 1000));
  const ipHash = await sha256Hex(`${namespace}:${clientIP(request)}`);
  const key = `rate:${namespace}:${bucket}:${ipHash}`;
  const current = await kv.get(key, "json").catch(() => null);
  const count = positiveInteger(current?.count, 0) + 1;
  const resetAt = (bucket + 1) * windowSeconds * 1000;
  const remaining = Math.max(limit - count, 0);
  const headers = rateLimitHeaders({ limit, remaining, resetAt });

  await kv.put(
    key,
    JSON.stringify({ count, resetAt }),
    { expirationTtl: windowSeconds + 60 }
  );

  if (count > limit) {
    return {
      allowed: false,
      headers: {
        ...headers,
        "Retry-After": String(Math.max(Math.ceil((resetAt - now) / 1000), 1))
      }
    };
  }

  return { allowed: true, headers };
};

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
  pluto: "Plüton",
  northNode: "Kuzey Ay Düğümü",
  ascendant: "Yükselen",
  midheaven: "MC"
};

const astroEngineVersion = "Pusula Astro Engine v2";
const astroAccuracyNote = "Dış lisanslı efemeris kullanmadan, ürün/refleksiyon seviyesi için kendi astronomik yaklaşımımızla hesaplanır.";

const aspectDefinitions = [
  { type: "Kavuşum", angle: 0, orbLimit: 8 },
  { type: "Altmışlık", angle: 60, orbLimit: 4 },
  { type: "Kare", angle: 90, orbLimit: 6 },
  { type: "Üçgen", angle: 120, orbLimit: 6 },
  { type: "Karşıt", angle: 180, orbLimit: 8 }
];

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
    case "pluto":
      return { node: 110.30347, inclination: 17.14175, perihelion: 113.76329, semiMajorAxis: 39.48168677, eccentricity: 0.24880766, meanAnomaly: 14.53 + 0.003975709 * d };
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

const midheavenLongitude = ({ jd, longitude }) => {
  const d = jd - 2451545.0;
  const gmst = normalizeDegrees(280.46061837 + 360.98564736629 * d);
  const localSidereal = normalizeDegrees(gmst + longitude);
  const obliquity = 23.439291 - 0.0000004 * d;
  return normalizeDegrees(atan2Degrees(sinDegrees(localSidereal), cosDegrees(localSidereal) * cosDegrees(obliquity)));
};

const northNodeLongitude = (d) => normalizeDegrees(125.04452 - 0.0529538083 * d);

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
  placements.filter((placement) => contributesToDominance(placement.body)).forEach((placement) => {
    const key = mapper(placement.sign);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Dengeli";
};

const contributesToDominance = (body) =>
  ![celestialBodies.ascendant, celestialBodies.midheaven, celestialBodies.northNode].includes(body);

const participatesInAspects = (body) =>
  ![celestialBodies.northNode].includes(body);

const smallestAngularDistance = (first, second) => {
  const distance = Math.abs(normalizeDegrees(first) - normalizeDegrees(second));
  return Math.min(distance, 360 - distance);
};

const majorAspects = (placements) => {
  const aspectBodies = placements.filter((placement) => participatesInAspects(placement.body));
  const results = [];

  for (let firstIndex = 0; firstIndex < aspectBodies.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < aspectBodies.length; secondIndex += 1) {
      const first = aspectBodies[firstIndex];
      const second = aspectBodies[secondIndex];
      const separation = smallestAngularDistance(first.longitude, second.longitude);
      const match = aspectDefinitions
        .map((definition) => ({ ...definition, orb: Math.abs(separation - definition.angle) }))
        .filter((definition) => definition.orb <= definition.orbLimit)
        .sort((a, b) => a.orb - b.orb)[0];

      if (!match) continue;

      results.push({
        firstBody: first.body,
        secondBody: second.body,
        type: match.type,
        orb: Math.round(match.orb * 10) / 10
      });
    }
  }

  return results
    .sort((a, b) => a.orb - b.orb || `${a.firstBody}${a.secondBody}`.localeCompare(`${b.firstBody}${b.secondBody}`))
    .slice(0, 10);
};

const balanceItems = (placements, labels, mapper) => {
  const contributing = placements.filter((placement) => contributesToDominance(placement.body));
  const total = Math.max(contributing.length, 1);
  const counts = new Map();
  contributing.forEach((placement) => {
    const key = mapper(placement.sign);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return labels.map((name) => {
    const count = counts.get(name) || 0;
    return { name, count, ratio: count / total };
  });
};

const compactPlacement = (placement) => `${placement.sign} ${placement.degree}°${String(placement.minute).padStart(2, "0")}`;

const chartSignature = (placements, element, modality) => {
  const byBody = (body) => placements.find((placement) => placement.body === body);
  const sun = byBody(celestialBodies.sun);
  const moon = byBody(celestialBodies.moon);
  const ascendant = byBody(celestialBodies.ascendant);
  return `${element} / ${modality} imza • ${sun ? compactPlacement(sun) : "Güneş hazır"}, ${moon ? compactPlacement(moon) : "Ay hazır"}, ${ascendant ? compactPlacement(ascendant) : "Yükselen hazır"}`;
};

const chartInsights = (placements, aspects) => {
  const byBody = (body) => placements.find((placement) => placement.body === body);
  const sun = byBody(celestialBodies.sun);
  const moon = byBody(celestialBodies.moon);
  const ascendant = byBody(celestialBodies.ascendant);
  const mercury = byBody(celestialBodies.mercury);
  const venus = byBody(celestialBodies.venus);
  const mars = byBody(celestialBodies.mars);
  const midheaven = byBody(celestialBodies.midheaven);
  const tightestAspect = aspects[0];
  const aspectMeaning = {
    "Kavuşum": "iki tema aynı noktada yoğunlaşır",
    "Altmışlık": "küçük fırsat ve akış alanı açar",
    "Kare": "gerilim üzerinden hareket ister",
    "Üçgen": "doğal destek ve kolaylık verir",
    "Karşıt": "iki uç arasında denge ister"
  };

  return [
    {
      title: "Kimlik ekseni",
      headline: `${sun?.sign || "Güneş"} tonu, dış dünyaya ${ascendant?.sign || "yükselen"} filtresiyle görünür.`,
      body: "Bu kombinasyon kullanıcının kendini nasıl merkezlediğini ve ilk izlenimde hangi enerjiyi taşıdığını anlatır. Pusula bunu günlük kart dilinde daha uygulanabilir, kısa bir yön önerisine çevirir.",
      relatedBodies: [celestialBodies.sun, celestialBodies.ascendant]
    },
    {
      title: "Duygusal ritim",
      headline: `Ay ${moon ? compactPlacement(moon) : "yerleşimi"}, iç ihtiyaç ve dinlenme biçimini gösterir.`,
      body: "Duygusal ritim bölümü kişinin hızlı tepki vermeden önce neye ihtiyaç duyduğunu ayırmak için kullanılır. Bu alan terapi iddiası taşımaz; refleksiyon ve günlük farkındalık katmanıdır.",
      relatedBodies: [celestialBodies.moon]
    },
    {
      title: "Zihin ve ilişki dili",
      headline: `${mercury?.sign || "Merkür"} düşünme, ${venus?.sign || "Venüs"} yakınlık tonunu belirginleştirir.`,
      body: "Bu bölüm iletişim, karar verme ve temas kurma stilini sadeleştirir. Amaç etikete hapsetmek değil; kullanıcının kendini daha net ifade edeceği küçük bir alan açmaktır.",
      relatedBodies: [celestialBodies.mercury, celestialBodies.venus]
    },
    {
      title: "Aksiyon ve yön",
      headline: `${mars?.sign || "Mars"} hareket tarzı, ${midheaven?.sign || "MC"} görünür hedef alanıyla birleşir.`,
      body: "Kariyer ve planlama kartlarında bu eksen büyük hedef yerine tek net adım üretmek için kullanılır. Kullanıcıya emir vermez; seçenekleri daha okunur hale getirir.",
      relatedBodies: [celestialBodies.mars, celestialBodies.midheaven]
    },
    {
      title: "Ana açı odağı",
      headline: tightestAspect ? `${tightestAspect.firstBody} ${tightestAspect.type} ${tightestAspect.secondBody}` : "Açı odağı harita tamamlanınca netleşir.",
      body: tightestAspect ? `Bu açı ${tightestAspect.orb.toFixed(1)}° orb yakınlıkla çalışır; ${aspectMeaning[tightestAspect.type] || "haritada önemli bir odak oluşturur"}. Pusula bunu günlük dilde gerilim, destek veya denge ihtiyacı olarak sadeleştirir.` : "Major açılar haritanın en görünür iç gerilim ve destek noktalarını belirlemek için kullanılır.",
      relatedBodies: tightestAspect ? [tightestAspect.firstBody, tightestAspect.secondBody] : []
    }
  ];
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
  const midheaven = midheavenLongitude({ jd, longitude });
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
    [celestialBodies.pluto, planetLongitude("pluto", d)],
    [celestialBodies.northNode, northNodeLongitude(d)],
    [celestialBodies.ascendant, ascendant],
    [celestialBodies.midheaven, midheaven]
  ].map(([body, longitudeValue]) => makePlacement({ body, longitude: longitudeValue, ascendant }));
  const aspects = majorAspects(placements);
  const dominantElement = dominantValue(placements, elementForSign);
  const dominantModality = dominantValue(placements, modalityForSign);

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
    aspects,
    dominantElement,
    dominantModality,
    elementBalance: balanceItems(placements, ["Ateş", "Toprak", "Hava", "Su"], elementForSign),
    modalityBalance: balanceItems(placements, ["Öncü", "Sabit", "Değişken"], modalityForSign),
    insights: chartInsights(placements, aspects),
    chartSignature: chartSignature(placements, dominantElement, dominantModality),
    qualityScore: 92,
    calculationSource: "Pusula Astro Engine",
    engineVersion: astroEngineVersion,
    accuracyNote: astroAccuracyNote
  };
};

const handleNatalChart = async (request, env) => {
  if (request.method !== "POST") {
    return apiJson({ error: "Method not allowed" }, 405);
  }

  const contentLength = Number.parseInt(request.headers.get("Content-Length") || "0", 10);
  if (Number.isFinite(contentLength) && contentLength > 4096) {
    return apiJson({ error: "Payload too large" }, 413);
  }

  const rateLimit = await enforceKVRateLimit(request, env, "natal-chart", {
    limit: 12,
    windowSeconds: 3600
  });
  if (!rateLimit.allowed) {
    return apiJson({ error: "Rate limit exceeded" }, 429, rateLimit.headers);
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return apiJson({ error: "Invalid request body" }, 400, rateLimit.headers);
  }

  if (new TextEncoder().encode(rawBody).byteLength > 4096) {
    return apiJson({ error: "Payload too large" }, 413, rateLimit.headers);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiJson({ error: "Invalid JSON body" }, 400, rateLimit.headers);
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
          calculationSource: providerChart.calculationSource || "Lisanslı astro provider"
        }, 200, rateLimit.headers);
      }
    } catch {
      // Provider failure intentionally falls through to deterministic fallback.
    }
  }

  try {
    return apiJson(calculateFallbackNatalChart(payload), 200, rateLimit.headers);
  } catch (error) {
    return apiJson({ error: error.message || "Natal chart calculation failed" }, 400, rateLimit.headers);
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.protocol !== "https:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

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
