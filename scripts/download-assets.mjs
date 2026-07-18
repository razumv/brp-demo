import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const assets = [
  ["https://brp-dev1.k8s.artemahr.tech/favicon.png", "public/favicon.png"],
  ["https://brp-catalog.ams3.digitaloceanspaces.com/logo/CAN_OFF_EN_US.png", "public/images/catalog/CAN_OFF_EN_US.png"],
  ["https://brp-catalog.ams3.digitaloceanspaces.com/logo/CAN_ONR_EN_US.png", "public/images/catalog/CAN_ONR_EN_US.png"],
  ["https://brp-catalog.ams3.digitaloceanspaces.com/logo/SEA_DOO_EN_US.png", "public/images/catalog/SEA_DOO_EN_US.png"],
  ["https://brp-catalog.ams3.digitaloceanspaces.com/logo/SKI_DOO_EN_US.png", "public/images/catalog/SKI_DOO_EN_US.png"],
  ["https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7W0Q5n-wU.woff2", "public/fonts/inter-latin.woff2"],
  ["https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2", "public/fonts/inter-cyrillic.woff2"],
];

for (const [url, relativePath] of assets) {
  const destination = join(root, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to download " + url + ": " + response.status);
  }
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

const diagramSource = join(root, "docs/design-references/dealer-diagram-desktop.png");
const diagramDestination = join(root, "public/images/catalog/maintenance-diagram-source.png");
await mkdir(dirname(diagramDestination), { recursive: true });
await copyFile(diagramSource, diagramDestination);

console.log("Downloaded " + assets.length + " source assets and copied the diagram reference.");
