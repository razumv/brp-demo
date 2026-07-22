import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const output = resolve("out");
const basePath = "/brp-demo";
const port = Number(process.env.PORT ?? 4174);
const expected = process.env.APPEARANCE_PAGES_PROVENANCE;
if (!expected) throw new Error("APPEARANCE_PAGES_PROVENANCE is required.");
const actual = (await readFile(join(output, ".appearance-pages-build-provenance"), "utf8")).trim();
if (actual !== expected) throw new Error("Appearance Pages provenance mismatch.");
await access(join(output, "offline/index.html"));

const types = new Map([
  [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"], [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json"], [".woff2", "font/woff2"],
  [".png", "image/png"], [".svg", "image/svg+xml"], [".ico", "image/x-icon"],
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  if (!url.pathname.startsWith(`${basePath}/`)) {
    response.writeHead(404).end("Not found");
    return;
  }
  const relative = decodeURIComponent(url.pathname.slice(basePath.length + 1));
  const safe = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
  let file = join(output, safe);
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, "index.html");
  } catch {
    if (!url.pathname.endsWith("/") && !extname(url.pathname)) {
      try {
        await access(join(output, safe, "index.html"));
        response.writeHead(308, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      } catch {}
    }
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    await access(file);
    response.writeHead(200, {
      "Content-Type": types.get(extname(file)) ?? "application/octet-stream",
      "Cache-Control": file.includes(`${join("_next", "static")}`) ? "public, max-age=31536000, immutable" : "no-store",
      "Service-Worker-Allowed": `${basePath}/`,
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[appearance-pages] provenance ${actual}; http://127.0.0.1:${port}${basePath}/offline/`);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
