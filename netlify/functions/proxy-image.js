const allowedHosts = new Set(["uploads.mangadex.org"]);
const optimizedMangadexSuffixPattern = /\.(256|512)\.jpg$/i;

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return sendJson(405, { message: "Method not allowed." });
  }

  const source = event.queryStringParameters?.url || "";
  const imageUrl = getAllowedImageUrl(source);

  if (!imageUrl) {
    return sendJson(400, { message: "Unsupported image URL." });
  }

  try {
    const upstreamUrl = getOptimizedImageUrl(imageUrl);
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "shelvd-cover-proxy/1.0",
      },
    });

    if (!response.ok) {
      return sendJson(response.status, { message: "Image lookup failed." });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return sendJson(415, { message: "Unsupported image response." });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
        "Content-Type": contentType,
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch {
    return sendJson(502, { message: "Image proxy failed." });
  }
}

function getAllowedImageUrl(source) {
  try {
    const url = new URL(source);
    if (url.protocol !== "https:") return null;
    if (!allowedHosts.has(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function getOptimizedImageUrl(url) {
  if (url.hostname !== "uploads.mangadex.org") return url;
  if (optimizedMangadexSuffixPattern.test(url.pathname)) return url;

  const optimizedUrl = new URL(url);
  optimizedUrl.pathname = `${optimizedUrl.pathname}.512.jpg`;
  return optimizedUrl;
}

function sendJson(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}
