import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const manifestPath = path.resolve("docs/research/astryx-baseline-manifest.json");
const outputDirectory = path.resolve("docs/design-references/astryx-baseline");
const verifierPath = path.resolve("scripts/capture-astryx-baseline.mjs");
const targetFilename = "login--light--390.png";
const targetPngPath = path.join(outputDirectory, targetFilename);

const originalManifest = await fs.readFile(manifestPath, "utf8");
const originalPng = await fs.readFile(targetPngPath);

function writeManifest(manifest) {
  return fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function entryFor(manifest, filename) {
  const entry = manifest.screenshots.find((candidate) => candidate.filename === filename);
  if (!entry) throw new Error(`Missing fixture entry ${filename}`);
  return entry;
}

async function expectRejected(label, mutate) {
  await fs.writeFile(manifestPath, originalManifest);
  await fs.writeFile(targetPngPath, originalPng);
  const manifest = JSON.parse(originalManifest);
  await mutate(manifest);
  const result = spawnSync(process.execPath, [verifierPath, "--verify"], { encoding: "utf8" });
  if (result.status === 0) {
    throw new Error(`${label}: verifier accepted a semantically invalid manifest`);
  }
  console.log(`RED proved: ${label}`);
}

try {
  await expectRejected("duplicate filename", async (manifest) => {
    const first = entryFor(manifest, targetFilename);
    const second = manifest.screenshots.find((entry) => entry.filename !== targetFilename);
    Object.assign(second, structuredClone(first));
    await writeManifest(manifest);
  });

  await expectRejected("wrong route", async (manifest) => {
    entryFor(manifest, targetFilename).route = "/not-the-login-route";
    await writeManifest(manifest);
  });

  await expectRejected("wrong viewport", async (manifest) => {
    entryFor(manifest, targetFilename).viewport.width = 391;
    await writeManifest(manifest);
  });

  await expectRejected("self-consistent wrong PNG dimensions", async (manifest) => {
    const mutatedPng = Buffer.from(originalPng);
    mutatedPng.writeUInt32BE(391, 16);
    await fs.writeFile(targetPngPath, mutatedPng);
    const entry = entryFor(manifest, targetFilename);
    entry.png.width = 391;
    entry.png.bytes = mutatedPng.length;
    entry.png.sha256 = createHash("sha256").update(mutatedPng).digest("hex");
    await writeManifest(manifest);
  });
} finally {
  await fs.writeFile(manifestPath, originalManifest);
  await fs.writeFile(targetPngPath, originalPng);
}
