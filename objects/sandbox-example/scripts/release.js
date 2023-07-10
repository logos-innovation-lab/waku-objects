import { copyFile, rm, mkdir } from "fs/promises";

// I'm sure there's a way to do this directly with a Vite plugin or build step
await rm("./object", { recursive: true, force: true });
await mkdir("./object");
await copyFile("./dist/assets/index.js", "./object/index.js");
await copyFile("./dist/metadata.json", "./object/metadata.json");
