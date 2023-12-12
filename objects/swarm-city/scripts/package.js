import { readFile, writeFile, rm, readdir } from "node:fs/promises";
import { cwd } from "node:process";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

// Paths
const object = resolve(cwd(), "object");
const metadataFile = resolve(object, "metadata.json");

// Functions
const createFile = async (path) => {
  const content = await readFile(resolve(object, path), "utf-8");
  const hash = createHash("sha256").update(content, "utf8").digest("base64");

  return { path, hash: `sha256-${hash}` };
};

// I'm sure there's a way to do this directly with a Vite plugin or build step
// Remove the index.html file
await rm(resolve(object, "chat.html"));
await rm(resolve(object, "standalone.html"));

// Update the metadata.json file
const metadata = JSON.parse(await readFile(metadataFile, "utf-8"));
const files = await readdir(resolve(object, "assets"));
const chat = files.find(
  (file) => file.startsWith("chat-") && file.endsWith(".js")
);
const standalone = files.find(
  (file) => file.startsWith("standalone-") && file.endsWith(".js")
);

metadata.files = {
  // The chat file could also be hardcoded but serves as an example of flexibility
  chat: await createFile(`assets/${chat}`),
  standalone: await createFile(`assets/${standalone}`),
  logo: await createFile("logo.svg"),
};

await writeFile(metadataFile, JSON.stringify(metadata, null, "\t"));
