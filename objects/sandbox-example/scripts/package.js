import { rm } from "fs/promises";
import { cwd } from "process";
import { resolve } from "path";

const object = resolve(cwd(), "object");

// I'm sure there's a way to do this directly with a Vite plugin or build step
// Remove the index.html file
await rm(resolve(object, "index.html"));
