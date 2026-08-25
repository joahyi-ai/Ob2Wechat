import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { createCopyPayload, writeCopyPayload } from "../clipboard/copyArticle";
import type { ConversionWarning } from "../media/embedImages";
import { PreviewRenderer, type RenderedArticle } from "../rendering/renderMarkdown";
import { scrollTopForProgress } from "../scroll/scrollSync";
import type Ob2WechatPlugin from "../main";

export const VIEW_TYPE_WECHAT_PREVIEW = "ob2wechat-preview";
const RENDER_DEBOUNCE_MS = 200;

export class WechatPreviewView extends ItemView {
  private readonly renderer: PreviewRenderer;
  private toolbarEl!: HTMLElement;
  private fileNameEl!: HTMLElement;
  private copyButtonEl!: HTMLButtonElement;
  private statusEl!: HTMLElement;
  private warningEl!: HTMLElement;
  private previewScrollerEl!: HTMLElement;
  private previewEl!: HTMLElement;
  private refreshTimer: number | null = null;
  private requestedRevision = 0;
  private currentArticle: RenderedArticle | null = null;
  private busy = false;
  private editorScrollProgress = 0;
  private scrollSyncFrame: number | null = null;
  private previewResizeObserver: ResizeObserver | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: Ob2WechatPlugin,
  ) {
    super(leaf);
    this.renderer = new PreviewRenderer(plugin.app);
  }

  getViewType(): string {
    return VIEW_TYPE_WECHAT_PREVIEW;
  }

  getDisplayText(): string {
    return "公众号预览";
  }

  getIcon(): string {
    return "message-square-text";
  }

  async onOpen(): Promise<void> {
    this.buildInterface();
    this.previewResizeObserver = new ResizeObserver(() => this.scheduleScrollSync());
    this.previewResizeObserver.observe(this.previewScrollerEl);
    this.scheduleRefresh(true);
  }

  async onClose(): Promise<void> {
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.scrollSyncFrame !== null) {
      window.cancelAnimationFrame(this.scrollSyncFrame);
      this.scrollSyncFrame = null;
    }
    this.previewResizeObserver?.disconnect();
    this.previewResizeObserver = null;
    this.requestedRevision += 1;
    this.currentArticle = null;
  }

  syncScrollFromEditor(progress: number): void {
    this.editorScrollProgress = progress;
    this.scheduleScrollSync();
  }

  private scheduleScrollSync(): void {
    if (!this.previewScrollerEl || this.scrollSyncFrame !== null) return;
    this.scrollSyncFrame = window.requestAnimationFrame(() => {
      this.scrollSyncFrame = null;
      this.previewScrollerEl.scrollTop = scrollTopForProgress(
        this.editorScrollProgress,
        this.previewScrollerEl.scrollHeight,
        this.previewScrollerEl.clientHeight,
      );
    });
  }

  scheduleRefresh(immediate = false): void {
    this.requestedRevision += 1;
    const revision = this.requestedRevision;
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (immediate) {
      void this.renderRevision(revision);
      return;
    }

    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      void this.renderRevision(revision);
    }, RENDER_DEBOUNCE_MS);
  }

  private buildInterface(): void {
    this.contentEl.empty();
    this.contentEl.addClass("ob2wechat-view");

    this.toolbarEl = this.contentEl.createDiv({ cls: "ob2wechat-toolbar" });
    const titleGroup = this.toolbarEl.createDiv({ cls: "ob2wechat-title-group" });
    titleGroup.createDiv({ cls: "ob2wechat-eyebrow", text: "公众号预览" });
    this.fileNameEl = titleGroup.createDiv({ cls: "ob2wechat-file-name", text: "未选择笔记" });

    this.copyButtonEl = this.toolbarEl.createEl("button", {
      cls: "mod-cta ob2wechat-copy-button",
      text: "复制正文",
      attr: {
        type: "button",
        "aria-label": "复制当前笔记正文到公众号",
      },
    });
    this.registerDomEvent(this.copyButtonEl, "click", () => void this.copyArticle());

    this.statusEl = this.contentEl.createDiv({ cls: "ob2wechat-status", attr: { role: "status" } });
    this.warningEl = this.contentEl.createDiv({ cls: "ob2wechat-warning", attr: { role: "alert" } });
    this.warningEl.hide();

    this.previewScrollerEl = this.contentEl.createDiv({ cls: "ob2wechat-preview-scroller" });
    this.previewEl = this.previewScrollerEl.createDiv({ cls: "ob2wechat-preview-shell" });
    this.showEmptyState("请打开一个 Markdown 文件");
  }

  private async renderRevision(revision: number): Promise<void> {
    const snapshot = this.plugin.getSourceSnapshot();
    if (!snapshot) {
      if (revision === this.requestedRevision) {
        this.currentArticle = null;
        this.fileNameEl.setText("未选择笔记");
        this.fileNameEl.removeAttribute("title");
        this.showEmptyState("请打开一个 Markdown 文件");
      }
      return;
    }

    this.fileNameEl.setText(snapshot.file.basename);
    this.fileNameEl.setAttribute("title", snapshot.file.path);
    if (!this.currentArticle) this.setStatus("正在生成预览…", "loading");

    try {
      const rendered = await this.renderer.render(snapshot.markdown, snapshot.file);
      if (revision !== this.requestedRevision) return;
      this.commitRenderedArticle(rendered);
    } catch (error) {
      if (revision !== this.requestedRevision) return;
      this.showRenderError(error);
    }
  }

  private commitRenderedArticle(rendered: RenderedArticle): void {
    this.currentArticle = rendered;
    this.previewEl.empty();
    this.previewEl.appendChild(rendered.article);
    this.setStatus("预览已同步", "ready");
    this.warningEl.hide();
    this.copyButtonEl.disabled = false;
    this.scheduleScrollSync();
  }

  private showEmptyState(message: string): void {
    this.previewEl.empty();
    this.previewEl.createDiv({ cls: "ob2wechat-empty-state", text: message });
    this.setStatus("", "idle");
    this.warningEl.hide();
    this.copyButtonEl.disabled = true;
    this.editorScrollProgress = 0;
    this.previewScrollerEl.scrollTop = 0;
  }

  private showRenderError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.previewEl.empty();
    const errorEl = this.previewEl.createDiv({ cls: "ob2wechat-error-state" });
    errorEl.createEl("strong", { text: "预览生成失败" });
    errorEl.createDiv({ text: message });
    const retry = errorEl.createEl("button", { text: "重试", attr: { type: "button" } });
    this.registerDomEvent(retry, "click", () => this.scheduleRefresh(true));
    this.setStatus("预览出错", "error");
    this.copyButtonEl.disabled = true;
  }

  private setStatus(text: string, state: "idle" | "loading" | "ready" | "error"): void {
    this.statusEl.setText(text);
    this.statusEl.dataset.state = state;
    this.statusEl.toggleClass("is-hidden", text.length === 0);
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.copyButtonEl.disabled = busy || !this.currentArticle;
    this.copyButtonEl.setText(busy ? "正在处理图片…" : "复制正文");
    this.copyButtonEl.setAttribute("aria-busy", String(busy));
  }

  private async latestArticleForCopy(): Promise<RenderedArticle> {
    const snapshot = this.plugin.getSourceSnapshot();
    if (!snapshot) throw new Error("请先打开一个 Markdown 文件");

    if (
      this.currentArticle
      && this.currentArticle.sourcePath === snapshot.file.path
      && this.currentArticle.sourceMarkdown === snapshot.markdown
    ) {
      return this.currentArticle;
    }

    const revision = ++this.requestedRevision;
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    const rendered = await this.renderer.render(snapshot.markdown, snapshot.file);
    if (revision === this.requestedRevision) this.commitRenderedArticle(rendered);
    return rendered;
  }

  async copyArticle(): Promise<void> {
    if (this.busy) return;
    this.warningEl.hide();
    this.setBusy(true);

    try {
      const rendered = await this.latestArticleForCopy();
      const payload = await createCopyPayload(this.app, rendered.article, rendered.sourcePath);
      await writeCopyPayload(payload);
      this.showCopyWarnings(payload.warnings);

      if (payload.warnings.length === 0) {
        const imageSummary = payload.embeddedImageCount > 0
          ? `，已内嵌 ${payload.embeddedImageCount} 张图片`
          : "";
        const titleSummary = payload.titleRemoved ? "，已移除文章标题" : "";
        new Notice(`正文已复制到剪贴板${titleSummary}${imageSummary}，可前往公众号后台粘贴`);
      } else {
        new Notice(`已复制，但有 ${payload.warnings.length} 项未完全处理`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`复制失败：${message}`);
      this.showCopyError(message);
    } finally {
      this.setBusy(false);
    }
  }

  private showCopyWarnings(warnings: ConversionWarning[]): void {
    if (warnings.length === 0) {
      this.warningEl.empty();
      this.warningEl.hide();
      return;
    }

    this.warningEl.empty();
    const details = this.warningEl.createEl("details");
    details.createEl("summary", { text: `${warnings.length} 项内容使用了降级结果` });
    const list = details.createEl("ul");
    warnings.slice(0, 8).forEach((warning) => {
      const label = warning.source.length > 140 ? `${warning.source.slice(0, 137)}…` : warning.source;
      list.createEl("li", { text: `${label}：${warning.message}` });
    });
    if (warnings.length > 8) list.createEl("li", { text: `另有 ${warnings.length - 8} 项` });
    this.warningEl.show();
  }

  private showCopyError(message: string): void {
    this.warningEl.empty();
    this.warningEl.createEl("strong", { text: "复制失败" });
    this.warningEl.createDiv({ text: message });
    this.warningEl.show();
  }
}
