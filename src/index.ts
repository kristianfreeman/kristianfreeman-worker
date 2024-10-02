import * as cheerio from "cheerio";

// If testing new functionality, set this to true
// It will not process using the Workers fn 
// unless the debug query param is set
const DEBUG_GATE = false

export default {
  async fetch(request: Request, env: {}, ctx: ExecutionContext) {
    const url = new URL(request.url);
    console.log("Fetching", url.toString());
    const debug = url.searchParams.get("debug");
    const urlWithoutParams = url.toString().split("?")[0];
    const response = await fetch(urlWithoutParams);

    if (!debug && DEBUG_GATE) {
      return response;
    }

    try {
      const ignoreExts = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico"];
      const ignorePaths = ["/feed"];

      if (
        ignoreExts.includes(url.pathname.split(".").pop()) ||
        ignorePaths.includes(url.pathname)
      ) {
        return response;
      }

      const newResp = response.clone();
      const html = await newResp.text();
      const $ = cheerio.load(html);

      let title = $("title").text().trim();

      if (title) {
        // bearblog adds this, remove it
        title = title.replace(' | Kristian Freeman', '');
        const encodedTitle = encodeURIComponent(title);
        const ogImageUrl = `https://og.kristianfreeman.com/image/og.png?title=${encodedTitle}`;

        $('meta[property="og:image"]').remove();
        $('meta[property="twitter:image"]').remove();
        $("head").append(`<meta property="og:image" content="${ogImageUrl}">`);
        $("head").append(`<meta property="twitter:image" content="${ogImageUrl}">`);

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
    } catch (e: any) {
      console.log(e)
      return new Response(e.message, {
        status: 500,
      });
    }
  },
};
