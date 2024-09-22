import * as cheerio from "cheerio";

export default {
  async fetch(request: Request, env: {}, ctx: ExecutionContext) {
    ctx.passThroughOnException();

    const url = new URL(request.url);
    const response = await fetch(request);

    const ignoreExts = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico"];
    const ignorePaths = ["/feed"];

    if (
      ignoreExts.includes(url.pathname.split(".").pop()) ||
      ignorePaths.includes(url.pathname)
    ) {
      return response;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let title = $("title").text().trim();

    if (title) {
      const encodedTitle = encodeURIComponent(title);
      const ogImageUrl = `https://og-link.signalnerve.workers.dev/image/og.png?title=${encodedTitle}`;

      $('meta[property="og:image"]').remove();
      $("head").append(`<meta property="og:image" content="${ogImageUrl}">`);

      $('meta[property="twitter:card"]').remove();
      $("head").append(`<meta property="twitter:card" content="summary_large_image">`);

      const modifiedHtml = $.html();
      return new Response(modifiedHtml, {
        headers: {
          "Content-Type": "text/html",
          ...Object.fromEntries(response.headers),
        },
      });
    }

    return new Response(html, {
      headers: response.headers,
    });
  },
};
