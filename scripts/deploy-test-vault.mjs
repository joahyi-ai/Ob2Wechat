import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const pluginDir = resolve("test-vault/.obsidian/plugins/wechat-publish-preview");
await mkdir(pluginDir, { recursive: true });

await Promise.all(
  ["main.js", "manifest.json", "styles.css"].map((file) =>
    copyFile(resolve(file), resolve(pluginDir, file)),
  ),
);

console.log(`Deployed WeChat Publish Preview to ${pluginDir}`);
