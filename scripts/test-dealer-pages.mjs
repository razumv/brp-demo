import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const provenance = randomUUID();

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const buildStatus = run(npmCommand, ["run", "build:pages"]);
if (buildStatus !== 0) {
  process.exitCode = buildStatus;
} else {
  await writeFile(resolve(projectRoot, "out", ".dealer-pages-build-provenance"), `${provenance}\n`);

  const require = createRequire(import.meta.url);
  const playwrightCli = require.resolve("@playwright/test/cli");
  process.exitCode = run(
    process.execPath,
    [playwrightCli, "test", "-c", "playwright.dealer-pages.config.ts", ...process.argv.slice(2)],
    { ...process.env, DEALER_PAGES_BUILD_PROVENANCE: provenance },
  );
}
