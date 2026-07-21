import { createServer, type Server } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const BASE_PATH = "/brp-demo";
const PROVENANCE_FILE = ".dealer-pages-build-provenance";

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2",
};

export type DealerPagesServer = {
  url: (pathname: string) => string;
  close: () => Promise<void>;
};

type DealerPagesServerOptions = {
  outDir?: string;
  port?: number;
  provenance?: string;
};

function fileWithinExport(outDir: string, path: string) {
  const candidate = resolve(outDir, path);
  const pathFromExport = relative(outDir, candidate);
  return pathFromExport && !pathFromExport.startsWith(`..${sep}`) && pathFromExport !== ".." ? candidate : null;
}

async function existingFile(path: string | null) {
  if (!path) return null;
  try {
    return (await stat(path)).isFile() ? path : null;
  } catch {
    return null;
  }
}

function closeServer(server: Server) {
  return new Promise<void>((resolveClose, rejectClose) => {
    server.closeAllConnections();
    server.close((error) => error ? rejectClose(error) : resolveClose());
  });
}

export async function startDealerPagesServer({
  outDir = resolve(process.cwd(), "out"),
  port = 4173,
  provenance,
}: DealerPagesServerOptions = {}): Promise<DealerPagesServer> {
  const exportedRoot = resolve(outDir);
  const recordedProvenance = await readFile(resolve(exportedRoot, PROVENANCE_FILE), "utf8").catch(() => "");
  if (!provenance || recordedProvenance.trim() !== provenance) {
    throw new Error("Pages export provenance is missing or stale; run npm run test:e2e:dealer-pages.");
  }
  const exportedIndex = await existingFile(resolve(exportedRoot, "index.html"));
  if (!exportedIndex) {
    throw new Error(`GitHub Pages export is missing: ${exportedRoot}`);
  }

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
    let pathname: string;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      response.writeHead(400).end("Bad request");
      return;
    }

    if (pathname === BASE_PATH) {
      response.writeHead(308, { Location: `${BASE_PATH}/` }).end();
      return;
    }

    if (!pathname.startsWith(`${BASE_PATH}/`)) {
      response.writeHead(404).end("Not found");
      return;
    }

    const exportPath = pathname.slice(BASE_PATH.length + 1);
    const hasTrailingSlash = pathname.endsWith("/");
    const isAsset = Boolean(extname(exportPath));
    const routeFile = hasTrailingSlash
      ? fileWithinExport(exportedRoot, `${exportPath}index.html`)
      : isAsset
        ? fileWithinExport(exportedRoot, exportPath)
        : fileWithinExport(exportedRoot, `${exportPath}/index.html`);
    const file = await existingFile(routeFile);

    if (!file && !hasTrailingSlash && !isAsset) {
      response.writeHead(404).end("Not found");
      return;
    }

    if (!file) {
      response.writeHead(404).end("Not found");
      return;
    }

    if (!hasTrailingSlash && !isAsset) {
      response.writeHead(308, { Location: `${pathname}/${requestUrl.search}` }).end();
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(file)] || "application/octet-stream",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    response.end(await readFile(file));
  });

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });

  return {
    url: (pathname) => `http://127.0.0.1:${port}${pathname}`,
    close: () => closeServer(server),
  };
}
