const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

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

  const title = event.queryStringParameters?.title?.trim();

  if (!title) {
    return sendJson(400, { message: "Enter a manga title to search." });
  }

  try {
    const mangadexUrl = new URL("https://api.mangadex.org/manga");
    for (const [key, value] of getSearchParams(event)) {
      mangadexUrl.searchParams.append(key, value);
    }

    const response = await fetch(mangadexUrl, {
      headers: {
        Accept: "application/json",
      },
    });
    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": response.headers.get("content-type") || jsonHeaders["Content-Type"],
      },
      body,
    };
  } catch {
    return sendJson(502, { message: "MangaDex lookup failed. Check your connection and try again." });
  }
}

function getSearchParams(event) {
  if (event.rawQuery) {
    return new URLSearchParams(event.rawQuery);
  }

  const searchParams = new URLSearchParams();
  const multiValueParams = event.multiValueQueryStringParameters || {};

  if (Object.keys(multiValueParams).length) {
    for (const [key, values] of Object.entries(multiValueParams)) {
      for (const value of values || []) {
        searchParams.append(key, value);
      }
    }
    return searchParams;
  }

  for (const [key, value] of Object.entries(event.queryStringParameters || {})) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  }

  return searchParams;
}

function sendJson(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders(),
      ...jsonHeaders,
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
