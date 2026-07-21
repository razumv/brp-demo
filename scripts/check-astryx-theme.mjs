import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join, resolve } from "node:path";

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();
const generatedFiles = [
  "neutral.css",
  "neutral.js",
  "neutral.d.ts",
  "neutral.variants.d.ts",
];
const sourceFiles = ["neutralTheme.ts", "icons.tsx"];

function normalizeGeneratedTimestamp(contents) {
  return contents.replace(/^ \* Generated: .*$/m, " * Generated: <normalized>");
}

async function readGenerated(directory) {
  return Promise.all(
    generatedFiles.map(async (file) => [file, await readFile(join(directory, file), "utf8")]),
  );
}

const sourceDirectory = resolve(projectRoot, "src/themes/neutral");
const committedOutputs = new Map(await readGenerated(sourceDirectory));
const temporaryRoot = await mkdtemp(join(projectRoot, ".astryx-theme-"));

try {
  const temporaryThemeDirectory = join(temporaryRoot, "src/themes/neutral");
  await mkdir(temporaryThemeDirectory, { recursive: true });
  await Promise.all(
    sourceFiles.map(async (file) => {
      await writeFile(
        join(temporaryThemeDirectory, file),
        await readFile(join(sourceDirectory, file)),
      );
    }),
  );

  const astryxCli = resolve(projectRoot, "node_modules/.bin/astryx");
  await execFileAsync(astryxCli, ["theme", "build", "src/themes/neutral/neutralTheme.ts"], {
    cwd: temporaryRoot,
  });

  const rebuiltOutputs = new Map(await readGenerated(temporaryThemeDirectory));
  for (const file of generatedFiles) {
    assert.equal(
      normalizeGeneratedTimestamp(rebuiltOutputs.get(file)),
      normalizeGeneratedTimestamp(committedOutputs.get(file)),
      `${file} does not match the deterministic Neutral theme build`,
    );
  }
} finally {
  const outputsAfterCheck = new Map(await readGenerated(sourceDirectory));
  for (const file of generatedFiles) {
    assert.equal(
      outputsAfterCheck.get(file),
      committedOutputs.get(file),
      `${file} changed while checking deterministic output`,
    );
  }
  await rm(temporaryRoot, { recursive: true, force: true });
}
