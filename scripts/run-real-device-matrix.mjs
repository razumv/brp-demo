import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm, writeFile, mkdir, cp, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { Local } from "browserstack-local";

const root = process.cwd();
const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
if (!username || !accessKey) {
  throw new Error("BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY are release-blocking requirements for the real-device matrix.");
}

const git = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
if (git.status !== 0) throw new Error(git.stderr || "Unable to resolve candidate SHA");
const sha = git.stdout.trim();
const token = randomUUID();
const localIdentifier = `brp-astryx-${sha.slice(0, 12)}-${token.slice(0, 8)}`;
const provenanceFile = resolve(root, "public/__appearance-candidate.json");
let server;
const tunnel = new Local();

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
}

async function waitForCandidate() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:3112/__appearance-candidate.json", { cache: "no-store" });
      if (response.ok && (await response.json()).sha === sha) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error("Candidate production server did not publish matching provenance.");
}

async function startTunnel() {
  await new Promise((resolveStart, reject) => tunnel.start({
    key: accessKey,
    localIdentifier,
    onlyAutomate: true,
    forceLocal: true,
  }, (error) => error ? reject(error) : resolveStart()));
}

async function stopTunnel() {
  if (!tunnel.isRunning()) return;
  await new Promise((resolveStop) => tunnel.stop(resolveStop));
}

try {
  await mkdir(dirname(provenanceFile), { recursive: true });
  await writeFile(provenanceFile, JSON.stringify({ sha, token, generatedAt: new Date().toISOString() }));
  run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
  const required = JSON.parse(await readFile(resolve(root, ".next/required-server-files.json"), "utf8"));
  const relativeAppDirectory = required.relativeAppDir ?? "";
  const standalone = resolve(root, ".next/standalone", relativeAppDirectory);
  await cp(resolve(root, ".next/static"), join(standalone, ".next/static"), { recursive: true });
  await cp(resolve(root, "public"), join(standalone, "public"), { recursive: true });
  server = spawn(process.execPath, [join(standalone, "server.js")], {
    cwd: standalone,
    env: { ...process.env, HOSTNAME: "127.0.0.1", PORT: "3112" },
    stdio: "inherit",
  });
  await waitForCandidate();
  await startTunnel();
  const require = createRequire(import.meta.url);
  run(process.execPath, [require.resolve("@playwright/test/cli"), "test", "-c", "playwright.real-devices.config.ts"], {
    ...process.env,
    PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3112",
    APPEARANCE_CANDIDATE_SHA: sha,
    BROWSERSTACK_LOCAL_IDENTIFIER: localIdentifier,
  });
} finally {
  server?.kill("SIGTERM");
  await stopTunnel();
  await rm(provenanceFile, { force: true });
}
