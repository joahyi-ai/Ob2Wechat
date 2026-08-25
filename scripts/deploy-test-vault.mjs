import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const pluginDir = resolve("test-vault/.obsidian/plugins/ob2wechat");
await mkdir(pluginDir, { recursive: true });

await Promise.all(
  ["main.js", "manifest.json", "styles.css"].map((file) =>
    copyFile(resolve(file), resolve(pluginDir, file)),
  ),
);

console.log(`Deployed Ob2Wechat to ${pluginDir}`);
