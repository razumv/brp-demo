import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
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

const buildStatus = run(npmCommand, ["run", "build"]);
if (buildStatus !== 0) {
  process.exitCode = buildStatus;
} else {
  const provenancePath = resolve(projectRoot, ".next/.appearance-build-provenance");
  await mkdir(resolve(projectRoot, ".next"), { recursive: true });
  await writeFile(provenancePath, `${provenance}\n`);

  const require = createRequire(import.meta.url);
  const playwrightCli = require.resolve("@playwright/test/cli");
  process.exitCode = run(
    process.execPath,
    [
      playwrightCli,
      "test",
      "-c",
      "playwright.appearance.config.ts",
      ...process.argv.slice(2),
    ],
    { ...process.env, APPEARANCE_BUILD_PROVENANCE: provenance },
  );
}
