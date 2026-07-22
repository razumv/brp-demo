import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const provenance = randomUUID();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
}

run(npm, ["run", "build:pages"]);
await writeFile(resolve(root, "out/.appearance-pages-build-provenance"), `${provenance}\n`);
const chunks = (await files(resolve(root, "out/_next/static"))).filter((file) => extname(file) === ".js");
let staleChunk = "";
for (const file of chunks) {
  const source = await readFile(file, "utf8");
  if (source.includes('"AstryxAppShellOverlays"')) {
    staleChunk = `/_next/static/${relative(resolve(root, "out/_next/static"), file).replaceAll("\\", "/")}`;
    break;
  }
}
if (!staleChunk) throw new Error("Could not identify the lazy Astryx shell chunk in the fresh Pages export.");

const require = createRequire(import.meta.url);
run(process.execPath, [require.resolve("@playwright/test/cli"), "test", "-c", "playwright.appearance-pages.config.ts", ...process.argv.slice(2)], {
  ...process.env,
  APPEARANCE_PAGES_PROVENANCE: provenance,
  ASTRYX_STALE_CHUNK_URL: `/brp-demo${staleChunk}`,
});
