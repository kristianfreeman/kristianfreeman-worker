export default {
  async fetch(request: Request, env: {}, ctx: ExecutionContext) {
    const url = new URL(request.url);
    console.log("Fetching", url.toString());

    const response = await fetch(request);
    return response;
  },
};

