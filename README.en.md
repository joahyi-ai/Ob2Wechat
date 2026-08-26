[简体中文](README.md) | English

# 📝 WeChat Publish Preview

Keep your WeChat formatting workflow inside Obsidian.

WeChat Publish Preview is a desktop plugin for writers who draft Markdown in Obsidian and publish through the WeChat Official Account editor. It renders the active note with WeChat-ready styling in the right sidebar, keeps the editor and preview aligned with bidirectional scroll sync, and copies the formatted article body in one click for direct pasting into the WeChat draft editor.

During copy, local images are automatically converted to Base64 and embedded with the rich text, so no image-hosting service is required. Remote images, math, and Mermaid diagrams are also converted when possible. All conversion happens in memory: the plugin never writes Base64 data back to your notes and does not require a WeChat AppID or AppSecret.

![Live WeChat article preview in Obsidian](images/wechat-publish-preview.png)

## 🚀 Highlights

- **Live preview** updates shortly after you edit the active note, without requiring a save.
- **30 article themes** are available from the style dropdown, grouped into classic, modern, and additional styles; the last choice is remembered.
- **Bidirectional scroll sync** keeps either pane aligned when you scroll the editor or the preview.
- **One-click copy to WeChat drafts** produces rich text ready to paste into the WeChat draft editor.
- **Base64 images with no image host** automatically embeds local images during copy while keeping the Markdown and attachments unchanged.
- **Theme-aware callout symbols** keep note, warning, and other type symbols visible in the preview while matching the selected theme; copied callouts become stable, static WeChat-compatible blocks.
- **Theme-colored task controls** replace Obsidian's default purple checkboxes with checked and unchecked markers derived from the selected article theme, including in copied output.
- **Obsidian-aware rendering** supports wiki-linked images, relative images, callouts, task lists, footnotes, math, and Mermaid.
- **Local-first design** includes no telemetry, credential access, or automatic draft submission.

## 📖 Quick start

1. Open a Markdown note in Obsidian.
2. Click the **Open WeChat preview** ribbon icon, or run the command from `Cmd/Ctrl + P`.
3. Optionally open the **Style** dropdown in the preview toolbar and choose a theme.
4. Edit and scroll normally; the sidebar preview updates and follows the source position.
5. Click **Copy article body**, then paste into the WeChat Official Account editor.

> The preview uses the Markdown filename as the article title. That generated title is removed from the copied body because the WeChat title is a separate input field.

### Callouts and tasks

Callout type symbols remain visible in the preview, while their title, body, border, and background inherit the selected theme's blockquote treatment. During copy, folding controls are removed and callouts become static semantic blocks for better WeChat compatibility.

Task controls are drawn by the plugin rather than by Obsidian, so they do not inherit Obsidian's default purple checkbox style. Checked tasks use the selected theme's accent fill, unchecked tasks use its accent border, and the same appearance is retained in copied content.

## 🧩 Supported content

| Content | Preview | WeChat copy |
| --- | :---: | :---: |
| Headings, paragraphs, emphasis, links | ✅ | ✅ |
| Ordered, unordered, and task lists | ✅, theme-colored tasks | ✅, state and theme color retained |
| Blockquotes, callouts, footnotes | ✅, callout symbols retained | ✅, converted to static compatible blocks |
| Code blocks and tables | ✅ | ✅ |
| Local and relative Obsidian images | ✅ | Embedded as Base64; no image host needed |
| Remote images | ✅ | Converted to Base64 when possible; otherwise warned |
| Math and Mermaid | ✅ | Converted to images |

The plugin includes 30 Raphael Publish-inspired themes. It does not require WeChat account configuration and does not submit drafts automatically.

## 🚀 Installation

### Obsidian Community Plugins

1. Open **Settings → Community plugins → Browse**.
2. Search for `WeChat Publish Preview`.
3. Click **Install**, then **Enable**.

### BRAT

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat).
2. Run `BRAT: Add a beta plugin for testing` from the command palette.
3. Enter `joahyi-ai/WeChat-Publish-Preview`.
4. Enable WeChat Publish Preview under **Settings → Community plugins**.

### Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub Release](https://github.com/joahyi-ai/WeChat-Publish-Preview/releases), then place them in:

```text
<Vault>/.obsidian/plugins/wechat-publish-preview/
```

Reload Obsidian and enable the plugin.

## 🔐 Privacy

WeChat Publish Preview runs locally, does not collect telemetry, and never submits drafts automatically. It reads only the active note and referenced Vault images. Network requests occur only for remote images, and clipboard access occurs only after an explicit copy action.

## 🗒 Changelog

### 1.1.0 — 2026-08-26

- Added 30 grouped Raphael Publish-inspired themes with instant preview, synchronized copy output, and remembered selection.
- Kept callout type symbols visible and theme-colored in the preview, with static WeChat-compatible callout output during copy.
- Replaced native Obsidian task checkboxes with theme-colored checked and unchecked markers that remain consistent in copied content.
- Improved dark-theme code highlighting, callout readability, nested list styling, and preservation of theme typography.
- Refreshed the README screenshot to show the new style selector and theme-aware callouts.

### 1.0.4 — 2026-08-25

- Refreshed marketplace documentation for bidirectional scrolling, in-memory Base64 image embedding, and the WeChat rich-text copy workflow.

### 1.0.3 — 2026-08-25

- Updated the plugin description for community-directory compliance and added an English summary to the primary README.

### 1.0.2 — 2026-08-25

- Reworked the Chinese and English documentation, added a real Obsidian screenshot, and refreshed marketplace presentation.

### 1.0.1 — 2026-08-25

- Aligned the plugin ID, display name, and minimum Obsidian version with community review requirements; fixed official ESLint findings and expanded English documentation.

### 1.0.0 — 2026-08-25

- Initial release with live WeChat preview, bidirectional scrolling, rich-text copy, Base64 images, math/Mermaid conversion, tables, code blocks, lists, blockquotes, callouts, and footnotes.

## 🛠 Development

```bash
pnpm install
pnpm verify
```

## 🙏 Credits

The article theme library and some compatibility strategies are adapted from the MIT-licensed [Raphael Publish](https://github.com/liuxiaopai-ai/raphael-publish). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.

The README structure and installation flow were inspired by [Wechat Converter](https://github.com/DavidLam-oss/obsidian-wechat-converter).

## 📄 License

[MIT License](LICENSE)
