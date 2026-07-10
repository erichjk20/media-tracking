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

  const aladinTtbKey = process.env.ALADIN_TTB_KEY || process.env.VITE_ALADIN_TTB_KEY;

  if (!aladinTtbKey) {
    return sendJson(400, { message: "Add ALADIN_TTB_KEY to use Korean book lookup." });
  }

  const query = event.queryStringParameters?.query?.trim();

  if (!query) {
    return sendJson(400, { message: "Enter a Korean book title or author to search." });
  }

  try {
    const aladinUrl = new URL("https://www.aladin.co.kr/ttb/api/ItemSearch.aspx");
    aladinUrl.searchParams.set("ttbkey", aladinTtbKey);
    aladinUrl.searchParams.set("Query", query);
    aladinUrl.searchParams.set("QueryType", "Keyword");
    aladinUrl.searchParams.set("MaxResults", "8");
    aladinUrl.searchParams.set("start", "1");
    aladinUrl.searchParams.set("SearchTarget", "Book");
    aladinUrl.searchParams.set("output", "js");
    aladinUrl.searchParams.set("Version", "20131101");
    aladinUrl.searchParams.set("Cover", "Big");
    aladinUrl.searchParams.set("OptResult", "itemPage");

    const response = await fetch(aladinUrl);
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
    return sendJson(502, { message: "Aladin lookup failed. Check your connection and try again." });
  }
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
