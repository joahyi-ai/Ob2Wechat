简体中文 | [English](README.en.md)

# 📝 WeChat Publish Preview

让微信公众号排版留在 Obsidian 里。

WeChat Publish Preview 是一款面向公众号写作者的 Obsidian 桌面端插件。它会在右侧边栏实时呈现当前 Markdown 笔记的公众号样式，并将正文复制为可直接粘贴到微信公众号编辑器的富文本。

从写作、预览到复制，整个过程都在 Obsidian 内完成。本地图片、网络图片、数学公式和 Mermaid 只在复制阶段于内存中转换，不会把 Base64 写回笔记，也不需要配置公众号 AppID 或 AppSecret。

![WeChat Publish Preview 在 Obsidian 中实时预览公众号排版](images/wechat-publish-preview.png)

## English summary

WeChat Publish Preview provides a live, WeChat-ready Markdown preview in the right sidebar, synchronized scrolling between the editor and preview, and one-click rich-text copy for the WeChat Official Account editor. Local images, remote images, math, and Mermaid diagrams are converted only in memory, so the original Markdown stays clean. See the [full English README](README.en.md) for installation and usage details.

## 🚀 核心能力一览

- **实时公众号预览**：编辑当前笔记时，右侧预览约 200ms 后自动刷新，无需先保存。
- **双向同步滚动**：编辑区与预览区按正文段落对齐，长文阅读和修改时不容易丢失位置。
- **一键复制富文本**：点击“复制正文”，即可粘贴到微信公众号后台正文编辑区。
- **保持原文干净**：所有图片和图表转换都在内存副本中完成，不修改 Markdown 和附件。
- **适配 Obsidian 内容**：支持 WikiLink 图片、相对路径图片、Callout、脚注、数学公式和 Mermaid。
- **本地优先**：不收集遥测，不读取公众号凭据，不自动上传文章或提交草稿。

## 💡 功能亮点

### 1. 所见更接近所得

预览和剪贴板内容共用同一套微信兼容渲染流程。标题、段落、引用、代码块、表格、图片等关键样式会以内联 CSS 写入复制结果，减少粘贴到公众号编辑器后的样式偏差。

### 2. 双向滚动同步

无论滚动左侧 Markdown 编辑区还是右侧公众号预览，另一侧都会跟随到对应段落。插件使用正文锚点进行定位，而不是只按整篇文章的滚动百分比粗略换算。

### 3. 本地图片无需图床

插件支持 Obsidian 的 `![[Wiki Link]]`、相对路径图片、Vault 附件和网络图片。复制时会尽量将图片转换为内嵌数据；单张图片处理失败不会中断全文复制，并会列出警告。

### 4. 公式与 Mermaid 可复制

数学公式和 Mermaid 图表会先在 Obsidian 中渲染，复制前再转换为适合微信公众号编辑器的图片，降低 SVG、MathML 或复杂样式被过滤后损坏的概率。

### 5. 固定、克制的公众号主题

首个正式版本内置一套固定的微信公众号排版，不提供主题库和复杂设置。打开即可使用，预览内容保持白色文章背景，不受 Obsidian 深色模式影响。

## 📖 使用方法

1. 在 Obsidian 中打开一篇 Markdown 笔记。
2. 点击左侧功能区的“打开公众号预览”图标；也可以按 `Cmd/Ctrl + P`，运行“打开公众号预览”。
3. 继续编辑或滚动笔记，右侧面板会实时更新并同步位置。
4. 点击预览顶部的“复制正文”。
5. 打开微信公众号后台的新建图文页面，将内容粘贴到正文编辑区。

> 插件会在预览中使用 Markdown 文件名生成文章标题，但复制时会移除这个自动标题。公众号后台的标题输入框仍需手动填写。

## 🧩 支持范围

| 内容 | 预览 | 复制到公众号 |
| --- | :---: | :---: |
| 标题、段落、强调、链接 | ✅ | ✅ |
| 有序/无序列表、任务列表 | ✅ | ✅ |
| 引用、Callout、脚注 | ✅ | ✅ |
| 代码块、表格 | ✅ | ✅ |
| Obsidian 本地及相对路径图片 | ✅ | 自动内嵌 |
| 网络图片 | ✅ | 尝试内嵌；失败时警告 |
| 数学公式、Mermaid | ✅ | 转换为图片 |

当前版本不提供样式库、公众号账号配置或自动提交草稿箱功能。

## 🚀 安装

### 方式一：Obsidian 社区插件市场（审核通过后推荐 ⭐）

1. 打开 Obsidian 的“设置” → “社区插件”。
2. 启用社区插件，然后点击“浏览”。
3. 搜索 `WeChat Publish Preview`。
4. 点击“安装”，安装完成后点击“启用”。

> 首次上架正在准备或审核期间，请使用 BRAT 或手动安装。

### 方式二：通过 BRAT 安装

1. 安装并启用 [BRAT](https://github.com/TfTHacker/obsidian42-brat)。
2. 打开命令面板，运行 `BRAT: Add a beta plugin for testing`。
3. 输入仓库：`joahyi-ai/Ob2Wechat`。
4. 安装完成后，在“设置” → “社区插件”中启用 WeChat Publish Preview。

### 方式三：从 GitHub Release 手动安装

1. 前往 [GitHub Releases](https://github.com/joahyi-ai/Ob2Wechat/releases) 下载 `main.js`、`manifest.json` 和 `styles.css`。
2. 将三个文件放入以下目录：

   ```text
   <Vault>/.obsidian/plugins/wechat-publish-preview/
   ```

3. 重启 Obsidian 或重新加载应用，然后在“设置” → “社区插件”中启用插件。

## 🔐 隐私与权限说明

WeChat Publish Preview 默认只在本地工作，不收集遥测，也不会自动上传笔记。

- **笔记内容**：仅在本机 Obsidian 中读取和渲染。
- **本地文件**：仅在处理当前笔记引用的 Vault 图片时读取。
- **网络请求**：仅当文章引用网络图片时访问对应图片地址。
- **剪贴板**：仅在你主动点击复制按钮或运行复制命令时写入。
- **公众号账号**：不读取登录状态，不需要 AppID、AppSecret 或 Access Token。

## ❓ 常见问题

### 为什么图片能预览，复制时仍可能转换失败？

显示图片只需要加载资源；内嵌图片还需要读取二进制数据。部分图床会限制跨域读取、防盗链或临时授权。插件会继续复制正文，并列出未能完全处理的图片。

### 为什么没有自动填写公众号标题？

网页剪贴板无法把一次粘贴同时分发到标题和正文两个输入框，因此插件只复制正文，标题需要手动填写。

### Base64 会写进 Markdown 吗？

不会。转换只发生在本次复制使用的内存副本中，原始 Markdown 和附件不会被修改。

## 🛠 开发

```bash
pnpm install
pnpm verify
```

- `pnpm test`：运行自动化测试。
- `pnpm build`：类型检查并生成 `main.js`。
- `pnpm deploy:test`：安装当前构建到仓库内的 `test-vault`。
- `pnpm verify`：依次执行检查、测试、构建和测试 Vault 部署。

## 🤝 贡献

欢迎通过 [Issues](https://github.com/joahyi-ai/Ob2Wechat/issues) 反馈问题，也欢迎提交 Pull Request。

## 🙏 致谢

固定公众号主题和部分微信兼容策略改编自 MIT 许可的 [Raphael Publish](https://github.com/liuxiaopai-ai/raphael-publish)，完整许可信息见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

README 的内容组织和安装说明参考了 [Wechat Converter](https://github.com/DavidLam-oss/obsidian-wechat-converter)。

## 📄 许可证

[MIT License](LICENSE)
