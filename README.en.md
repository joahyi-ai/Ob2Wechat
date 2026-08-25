[简体中文](README.md) | English

# 📝 WeChat Publish Preview

Keep your WeChat formatting workflow inside Obsidian.

WeChat Publish Preview is a desktop plugin for writers who draft Markdown in Obsidian and publish through the WeChat Official Account editor. It renders the active note with WeChat-ready styling in the right sidebar, keeps the editor and preview aligned with bidirectional scroll sync, and copies the formatted article body in one click for direct pasting into the WeChat draft editor.

During copy, local images are automatically converted to Base64 and embedded with the rich text, so no image-hosting service is required. Remote images, math, and Mermaid diagrams are also converted when possible. All conversion happens in memory: the plugin never writes Base64 data back to your notes and does not require a WeChat AppID or AppSecret.

![Live WeChat article preview in Obsidian](images/wechat-publish-preview.png)

## 🚀 Highlights

- **Live preview** updates shortly after you edit the active note, without requiring a save.
- **Bidirectional scroll sync** keeps either pane aligned when you scroll the editor or the preview.
- **One-click copy to WeChat drafts** produces rich text ready to paste into the WeChat draft editor.
- **Base64 images with no image host** automatically embeds local images during copy while keeping the Markdown and attachments unchanged.
- **Obsidian-aware rendering** supports wiki-linked images, relative images, callouts, footnotes, math, and Mermaid.
- **Local-first design** includes no telemetry, credential access, or automatic draft submission.

## 📖 Quick start

1. Open a Markdown note in Obsidian.
2. Click the **Open WeChat preview** ribbon icon, or run the command from `Cmd/Ctrl + P`.
3. Edit and scroll normally; the sidebar preview updates and follows the source position.
4. Click **Copy article body**.
5. Paste into the body field of the WeChat Official Account editor and enter the title separately.

> The preview uses the Markdown filename as the article title. That generated title is removed from the copied body because the WeChat title is a separate input field.

## 🧩 Supported content

| Content | Preview | WeChat copy |
| --- | :---: | :---: |
| Headings, paragraphs, emphasis, links | ✅ | ✅ |
| Ordered, unordered, and task lists | ✅ | ✅ |
| Blockquotes, callouts, footnotes | ✅ | ✅ |
| Code blocks and tables | ✅ | ✅ |
| Local and relative Obsidian images | ✅ | Embedded as Base64; no image host needed |
| Remote images | ✅ | Converted to Base64 when possible; otherwise warned |
| Math and Mermaid | ✅ | Converted to images |

The current release does not include a theme library, WeChat account configuration, or automatic draft submission.

## 🚀 Installation

### Obsidian Community Plugins

Once the community-directory review is complete:

1. Open **Settings → Community plugins → Browse**.
2. Search for `WeChat Publish Preview`.
3. Click **Install**, then **Enable**.

### BRAT

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat).
2. Run `BRAT: Add a beta plugin for testing` from the command palette.
3. Enter `joahyi-ai/Ob2Wechat`.
4. Enable WeChat Publish Preview under **Settings → Community plugins**.

### Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub Release](https://github.com/joahyi-ai/Ob2Wechat/releases), then place them in:

```text
<Vault>/.obsidian/plugins/wechat-publish-preview/
```

Reload Obsidian and enable the plugin.

## 🔐 Privacy

WeChat Publish Preview runs locally, does not collect telemetry, and never submits drafts automatically. It reads only the active note and referenced Vault images. Network requests occur only for remote images, and clipboard access occurs only after an explicit copy action.

## 🛠 Development

```bash
pnpm install
pnpm verify
```

## 🙏 Credits

The fixed WeChat theme and some compatibility strategies are adapted from the MIT-licensed [Raphael Publish](https://github.com/liuxiaopai-ai/raphael-publish). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.

The README structure and installation flow were inspired by [Wechat Converter](https://github.com/DavidLam-oss/obsidian-wechat-converter).

## 📄 License

[MIT License](LICENSE)
