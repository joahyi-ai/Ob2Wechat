# Ob2Wechat

在 Obsidian 侧边栏实时预览 Markdown 的微信公众号排版，并一键复制可直接粘贴到公众号编辑器的富文本正文。

Ob2Wechat 面向习惯在 Obsidian 中写作、最后发布到微信公众号的用户。插件保持 Markdown 原文简洁：预览和复制所需的图片转换都在内存中完成，不会把 Base64 写回笔记。

## 功能亮点

- 实时预览：编辑当前 Markdown 笔记时，右侧公众号预览自动刷新，无需先保存。
- 双向滚动：编辑区与预览区按正文段落锚点同步滚动，长文也能保持在相近阅读位置。
- 一键复制正文：复制富文本 HTML 后，可直接粘贴到微信公众号后台编辑器。
- 保持原文干净：本地图片和网络图片只在复制阶段转换为内嵌图片，不修改 Markdown 文件。
- 常用语法支持：标题、段落、加粗、斜体、链接、列表、任务列表、引用、代码块和表格。
- Obsidian 内容支持：WikiLink 图片、相对路径图片、Callout、脚注、数学公式和 Mermaid。
- 固定公众号样式：首个正式版本提供一套默认排版，暂不需要选择主题或配置样式。
- 本地优先：不需要公众号 AppID 或 AppSecret，不会自动提交公众号草稿。

## 使用方法

1. 在 Obsidian 中打开一个 Markdown 文件。
2. 点击左侧功能区的“打开公众号预览”图标；也可以按 `Cmd/Ctrl + P` 打开命令面板，运行“打开公众号预览”。
3. 继续编辑笔记，右侧面板会实时更新。滚动任意一侧时，另一侧会跟随到对应内容。
4. 点击右侧面板中的“复制正文”。
5. 打开微信公众号后台的新建图文页面，将内容粘贴到正文编辑区。

复制时会自动移除与文件名对应的文章标题，只保留正文。微信公众号后台的标题输入框需要手动填写，这是网页编辑器对剪贴板内容的限制。

## 支持范围

| 内容 | 预览 | 复制到公众号 |
| --- | --- | --- |
| 标题、段落、强调、链接 | 支持 | 支持 |
| 有序/无序列表、任务列表 | 支持 | 支持 |
| 引用、Callout、脚注 | 支持 | 支持 |
| 代码块 | 支持 | 支持 |
| 表格 | 支持 | 支持 |
| Obsidian 本地及相对路径图片 | 支持 | 自动内嵌 |
| 网络图片 | 支持 | 尝试转换为 Base64；失败时显示警告 |
| 数学公式、Mermaid | 支持 | 转换为图片后复制 |

当前版本不提供样式库、公众号账号配置或自动提交草稿箱功能。

## 安装

### 方式一：Obsidian 社区插件市场（审核通过后推荐）

插件通过社区目录审核后，可以直接在 Obsidian 中安装：

1. 打开“设置” → “社区插件”。
2. 启用社区插件，然后点击“浏览”。
3. 搜索 `Ob2Wechat`。
4. 点击“安装”，安装完成后点击“启用”。

> 首次上架正在准备/审核期间，请使用下面的 BRAT 或手动安装方式。

### 方式二：通过 BRAT 安装

如果希望在社区市场上架前安装或测试最新版：

1. 从 Obsidian 社区插件市场安装并启用 [BRAT](https://github.com/TfTHacker/obsidian42-brat)。
2. 打开命令面板，运行 `BRAT: Add a beta plugin for testing`。
3. 输入仓库地址：`joahyi-ai/Ob2Wechat`。
4. 完成安装后，在“设置” → “社区插件”中启用 Ob2Wechat。

### 方式三：从 GitHub Release 手动安装

1. 前往 [GitHub Releases](https://github.com/joahyi-ai/Ob2Wechat/releases) 下载最新版本中的：
   - `main.js`
   - `manifest.json`
   - `styles.css`
2. 在 Vault 中创建插件目录：

   ```text
   <Vault>/.obsidian/plugins/ob2wechat/
   ```

3. 将三个文件放入该目录，最终结构应为：

   ```text
   <Vault>/.obsidian/plugins/ob2wechat/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```

4. 重启 Obsidian，或重新加载应用。
5. 打开“设置” → “社区插件”，启用 Ob2Wechat。

## 兼容性

- Obsidian `1.6.0` 或更高版本。
- 仅支持桌面端 Obsidian。
- 微信公众号编辑器可能继续清理部分 HTML 或 CSS；正式发布前建议在后台预览一次。

## 隐私与网络访问

Ob2Wechat 不收集遥测，不使用自有服务器，也不会自动上传笔记。

- 笔记内容：仅在本机 Obsidian 中读取和渲染。
- 本地文件：仅在处理当前笔记引用的本地图片时读取 Vault 内资源。
- 网络请求：只有文章引用网络图片时，预览或复制过程才会访问对应图片地址。
- 剪贴板：只有主动点击“复制正文”或运行复制命令时，才会写入当前文章的富文本和纯文本内容。
- 公众号账号：插件不读取公众号登录状态，也不需要 AppID、AppSecret 或 Access Token。

## 常见问题

### 为什么图片在 Markdown 中能显示，复制时仍可能转换失败？

显示图片只需要浏览器加载资源；转换为 Base64 还需要读取图片二进制数据。部分图床会限制跨域读取、防盗链或临时授权，因此可能出现“能显示但无法内嵌”的情况。插件会在复制后列出未完全处理的图片。

### 为什么复制后没有自动填写公众号标题？

网页剪贴板只能把内容粘贴到当前获得焦点的编辑区域，无法同时把标题和正文分发到两个独立输入框。因此 Ob2Wechat 默认只复制正文，标题需要手动填写。

### Base64 会写进 Markdown 吗？

不会。转换只发生在预览的复制副本中，原始 Markdown 文件不会被修改。

## 开发

```bash
pnpm install
pnpm verify
```

- `pnpm test`：运行自动化测试。
- `pnpm build`：类型检查并生成 `main.js`。
- `pnpm deploy:test`：安装当前构建到仓库内的 `test-vault`。
- `pnpm verify`：依次执行测试、构建和测试 Vault 部署。

## 贡献

欢迎通过 [Issues](https://github.com/joahyi-ai/Ob2Wechat/issues) 反馈问题，也欢迎提交 Pull Request。

## 致谢

固定公众号主题和部分微信兼容策略改编自 MIT 许可的 [Raphael Publish](https://github.com/liuxiaopai-ai/raphael-publish)。完整第三方许可信息见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

README 的安装和使用结构参考了 [Wechat Converter](https://github.com/davidlam-oss/obsidian-wechat-converter)。

## 许可证

[MIT License](LICENSE)
