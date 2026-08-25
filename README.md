# Ob2Wechat

Ob2Wechat 是一个桌面端 Obsidian 插件：在右侧边栏实时预览当前 Markdown 笔记的微信公众号排版，并将整篇文章复制为可粘贴到公众号后台的富文本 HTML。

## V1 功能

- 跟随当前活动 Markdown 笔记实时刷新，无需先保存。
- 左侧 Markdown 编辑区滚动时，右侧预览按对应阅读进度同步滚动。
- 固定使用 Raphael Publish 的“微信公众号原生”样式。
- 支持标题、段落、强调、链接、列表、任务列表、引用、代码块和表格。
- 支持 Obsidian 本地图片、相对路径图片和网络图片。
- 支持 Callout、脚注、数学公式和 Mermaid。
- 点击复制时才在内存中将图片、公式和 Mermaid 转为可粘贴图片；不会把 Base64 写回 Markdown。
- 同时写入 `text/html` 与 `text/plain` 剪贴板格式。
- 不需要公众号 AppID/AppSecret，不会自动提交公众号草稿。

## 开发

```bash
pnpm install
pnpm verify
```

构建产物是仓库根目录的 `main.js`。`pnpm deploy:test` 会把构建产物安装到 `test-vault`。

## 手动安装

1. 创建 `<Vault>/.obsidian/plugins/ob2wechat/`。
2. 将 `main.js`、`manifest.json`、`styles.css` 复制到该目录。
3. 在 Obsidian 的“第三方插件”中启用 Ob2Wechat。
4. 点击左侧公众号图标，或在命令面板运行“打开公众号预览”。

## 隐私

插件不收集遥测或文章内容，也不使用自有服务器。仅当文章包含网络图片且用户进行预览或复制时，Obsidian 会从对应图片 URL 读取资源。

## 致谢与许可证

项目使用 MIT 许可证。固定主题和部分微信兼容策略改编自 MIT 许可的 [Raphael Publish](https://github.com/liuxiaopai-ai/raphael-publish)，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
