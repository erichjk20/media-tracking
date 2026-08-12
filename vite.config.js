import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      aladinApiPlugin(env.ALADIN_TTB_KEY || env.VITE_ALADIN_TTB_KEY),
      mangadexApiPlugin(),
    ],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "react-vendor",
                test: /node_modules[\\/](react|react-dom)[\\/]/,
                priority: 3,
              },
              {
                name: "supabase-vendor",
                test: /node_modules[\\/]@supabase[\\/]/,
                priority: 2,
              },
              {
                name: "ui-vendor",
                test: /node_modules[\\/]lucide-react[\\/]/,
                priority: 1,
              },
            ],
          },
        },
      },
    },
  };
});

function aladinApiPlugin(aladinTtbKey) {
  const handleAladinBooks = async (request, response) => {
    if (!request.url) {
      sendJson(response, 400, { message: "Missing request URL." });
      return;
    }

    if (!aladinTtbKey) {
      sendJson(response, 400, { message: "Add ALADIN_TTB_KEY to .env.local to use Korean book lookup." });
      return;
    }

    const requestUrl = new URL(request.url, "http://localhost");
    const query = requestUrl.searchParams.get("query")?.trim();

    if (!query) {
      sendJson(response, 400, { message: "Enter a Korean book title or author to search." });
      return;
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

      const aladinResponse = await fetch(aladinUrl);
      const body = await aladinResponse.text();

      response.statusCode = aladinResponse.status;
      response.setHeader("Content-Type", aladinResponse.headers.get("content-type") || "application/json; charset=utf-8");
      response.end(body);
    } catch {
      sendJson(response, 502, { message: "Aladin lookup failed. Check your connection and try again." });
    }
  };

  return {
    name: "aladin-api",
    configureServer(server) {
      server.middlewares.use("/api/aladin/books", handleAladinBooks);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/aladin/books", handleAladinBooks);
    },
  };
}

function mangadexApiPlugin() {
  const handleMangadexManga = async (request, response) => {
    if (!request.url) {
      sendJson(response, 400, { message: "Missing request URL." });
      return;
    }

    const requestUrl = new URL(request.url, "http://localhost");
    const title = requestUrl.searchParams.get("title")?.trim();

    if (!title) {
      sendJson(response, 400, { message: "Enter a manga title to search." });
      return;
    }

    try {
      const mangadexUrl = buildMangadexMangaSearchUrl(requestUrl.searchParams);
      const mangadexResponse = await fetch(mangadexUrl, {
        headers: {
          Accept: "application/json",
        },
      });
      const body = await mangadexResponse.text();

      response.statusCode = mangadexResponse.status;
      response.setHeader("Content-Type", mangadexResponse.headers.get("content-type") || "application/json; charset=utf-8");
      response.end(body);
    } catch {
      sendJson(response, 502, { message: "MangaDex lookup failed. Check your connection and try again." });
    }
  };

  return {
    name: "mangadex-api",
    configureServer(server) {
      server.middlewares.use("/api/mangadex/manga", handleMangadexManga);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/mangadex/manga", handleMangadexManga);
    },
  };
}

function buildMangadexMangaSearchUrl(searchParams) {
  const mangadexUrl = new URL("https://api.mangadex.org/manga");
  for (const [key, value] of searchParams) {
    mangadexUrl.searchParams.append(key, value);
  }
  return mangadexUrl;
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}
