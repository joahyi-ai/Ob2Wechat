import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { createCopyPayload, writeCopyPayload } from "../clipboard/copyArticle";
import type { ConversionWarning } from "../media/embedImages";
import { PreviewRenderer, type RenderedArticle } from "../rendering/renderMarkdown";
import {
  createScrollSyncPoints,
  interpolateScrollPosition,
  reverseScrollSyncPoints,
  type ScrollSyncPoint,
  type SourceScrollGeometry,
} from "../scroll/scrollSync";
import { getTheme, THEME_GROUPS, type Theme } from "../theme/raphael";
import type Ob2WechatPlugin from "../main";

export const VIEW_TYPE_WECHAT_PREVIEW = "ob2wechat-preview";
const RENDER_DEBOUNCE_MS = 200;

export class WechatPreviewView extends ItemView {
  private readonly renderer: PreviewRenderer;
  private toolbarEl!: HTMLElement;
  private fileNameEl!: HTMLElement;
  private themeButtonEl!: HTMLButtonElement;
  private themeMenuEl!: HTMLElement;
  private copyButtonEl!: HTMLButtonElement;
  private statusEl!: HTMLElement;
  private warningEl!: HTMLElement;
  private previewScrollerEl!: HTMLElement;
  private previewEl!: HTMLElement;
  private refreshTimer: number | null = null;
  private requestedRevision = 0;
  private currentArticle: RenderedArticle | null = null;
  private busy = false;
  private sourceScrollGeometry: SourceScrollGeometry | null = null;
  private scrollSyncFrame: number | null = null;
  private previewScrollFrame: number | null = null;
  private expectedPreviewScrollTop: number | null = null;
  private previewScrollReleaseTimer: number | null = null;
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
    this.previewResizeObserver.observe(this.previewEl);
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
    if (this.previewScrollFrame !== null) {
      window.cancelAnimationFrame(this.previewScrollFrame);
      this.previewScrollFrame = null;
    }
    if (this.previewScrollReleaseTimer !== null) {
      window.clearTimeout(this.previewScrollReleaseTimer);
      this.previewScrollReleaseTimer = null;
    }
    this.previewResizeObserver?.disconnect();
    this.previewResizeObserver = null;
    this.closeThemeMenu();
    this.requestedRevision += 1;
    this.currentArticle = null;
    this.sourceScrollGeometry = null;
  }

  getSourceAnchorOffsets(): number[] {
    return this.currentArticle?.scrollAnchors.map((anchor) => anchor.sourceOffset) ?? [];
  }

  syncScrollFromEditor(geometry: SourceScrollGeometry): void {
    this.sourceScrollGeometry = geometry;
    this.scheduleScrollSync();
  }

  updateSourceScrollTopFromPreview(scrollTop: number): void {
    if (!this.sourceScrollGeometry) return;
    this.sourceScrollGeometry = { ...this.sourceScrollGeometry, scrollTop };
  }

  private scheduleScrollSync(): void {
    if (!this.previewScrollerEl || !this.sourceScrollGeometry || this.scrollSyncFrame !== null) return;
    this.scrollSyncFrame = window.requestAnimationFrame(() => {
      this.scrollSyncFrame = null;
      const points = this.buildScrollSyncPoints();
      if (points.length === 0 || !this.sourceScrollGeometry) return;
      const target = interpolateScrollPosition(this.sourceScrollGeometry.scrollTop, points);
      if (Math.abs(this.previewScrollerEl.scrollTop - target) < 1) return;
      this.expectedPreviewScrollTop = target;
      this.previewScrollerEl.scrollTop = target;
      if (this.previewScrollReleaseTimer !== null) {
        window.clearTimeout(this.previewScrollReleaseTimer);
      }
      this.previewScrollReleaseTimer = window.setTimeout(() => {
        this.previewScrollReleaseTimer = null;
        this.expectedPreviewScrollTop = null;
      }, 80);
    });
  }

  private buildScrollSyncPoints(): ScrollSyncPoint[] {
    if (!this.currentArticle || !this.sourceScrollGeometry) return [];
    const sourceTops = new Map(
      this.sourceScrollGeometry.anchors.map((anchor) => [anchor.sourceOffset, anchor.sourceTop]),
    );
    const scrollerRect = this.previewScrollerEl.getBoundingClientRect();
    const anchors = this.currentArticle.scrollAnchors.flatMap((anchor) => {
      const sourceTop = sourceTops.get(anchor.sourceOffset);
      if (sourceTop === undefined || !anchor.element.isConnected) return [];
      const targetRect = anchor.element.getBoundingClientRect();
      return [{
        sourceTop,
        targetTop: targetRect.top - scrollerRect.top + this.previewScrollerEl.scrollTop,
      }];
    });

    return createScrollSyncPoints(
      this.sourceScrollGeometry,
      {
        scrollTop: this.previewScrollerEl.scrollTop,
        scrollHeight: this.previewScrollerEl.scrollHeight,
        clientHeight: this.previewScrollerEl.clientHeight,
      },
      anchors,
    );
  }

  private readonly handlePreviewScroll = (): void => {
    if (this.expectedPreviewScrollTop !== null) {
      if (Math.abs(this.previewScrollerEl.scrollTop - this.expectedPreviewScrollTop) < 2) return;
      this.releasePreviewScrollLock();
    }
    if (this.previewScrollFrame !== null) return;
    this.previewScrollFrame = window.requestAnimationFrame(() => {
      this.previewScrollFrame = null;
      const points = this.buildScrollSyncPoints();
      if (points.length === 0) return;
      const sourceTarget = interpolateScrollPosition(
        this.previewScrollerEl.scrollTop,
        reverseScrollSyncPoints(points),
      );
      this.plugin.syncEditorFromPreview(sourceTarget);
    });
  };

  private releasePreviewScrollLock(): void {
    this.expectedPreviewScrollTop = null;
    if (this.previewScrollReleaseTimer !== null) {
      window.clearTimeout(this.previewScrollReleaseTimer);
      this.previewScrollReleaseTimer = null;
    }
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

    const toolbarActions = this.toolbarEl.createDiv({ cls: "ob2wechat-toolbar-actions" });
    this.buildThemePicker(toolbarActions);

    this.copyButtonEl = toolbarActions.createEl("button", {
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
    this.registerDomEvent(this.previewScrollerEl, "scroll", this.handlePreviewScroll, { passive: true });
    this.previewEl = this.previewScrollerEl.createDiv({ cls: "ob2wechat-preview-shell" });
    this.showEmptyState("请打开一个 Markdown 文件");
  }

  private buildThemePicker(parent: HTMLElement): void {
    const picker = parent.createDiv({ cls: "ob2wechat-theme-picker" });
    this.themeButtonEl = picker.createEl("button", {
      cls: "ob2wechat-theme-button",
      attr: {
        type: "button",
        "aria-haspopup": "listbox",
        "aria-expanded": "false",
      },
    });
    this.themeMenuEl = picker.createDiv({
      cls: "ob2wechat-theme-menu",
      attr: {
        role: "listbox",
        "aria-label": "选择公众号排版样式",
      },
    });

    THEME_GROUPS.forEach((group) => {
      const section = this.themeMenuEl.createDiv({ cls: "ob2wechat-theme-group" });
      section.createDiv({ cls: "ob2wechat-theme-group-label", text: `${group.label} · ${group.themes.length} 款` });
      const options = section.createDiv({ cls: "ob2wechat-theme-options" });
      group.themes.forEach((theme) => this.createThemeOption(options, theme));
    });

    this.closeThemeMenu();
    this.syncThemePicker();
    this.registerDomEvent(this.themeButtonEl, "click", (event) => {
      event.stopPropagation();
      this.setThemeMenuOpen(this.themeMenuEl.hidden);
    });
    this.registerDomEvent(document, "pointerdown", (event) => {
      if (!picker.contains(event.target as Node)) this.closeThemeMenu();
    });
    this.registerDomEvent(document, "keydown", (event) => {
      if (event.key === "Escape") {
        this.closeThemeMenu();
        this.themeButtonEl.focus();
      }
    });
  }

  private createThemeOption(parent: HTMLElement, theme: Theme): void {
    const option = parent.createEl("button", {
      cls: "ob2wechat-theme-option",
      attr: {
        type: "button",
        role: "option",
        "data-theme-id": theme.id,
        title: theme.description,
      },
    });
    const swatch = option.createSpan({ cls: "ob2wechat-theme-swatch", attr: { "aria-hidden": "true" } });
    [
      this.readThemeColor(theme.styles.container, "background-color", "#ffffff"),
      this.readThemeColor(theme.styles.h1, "color", "#333333"),
      this.readThemeColor(theme.styles.a, "color", "#07c160"),
    ].forEach((color) => swatch.createSpan().setCssStyles({ backgroundColor: color }));
    const text = option.createSpan({ cls: "ob2wechat-theme-option-text" });
    text.createSpan({ cls: "ob2wechat-theme-option-name", text: theme.name });
    text.createSpan({ cls: "ob2wechat-theme-option-description", text: theme.description });
    option.createSpan({ cls: "ob2wechat-theme-check", text: "✓", attr: { "aria-hidden": "true" } });
    this.registerDomEvent(option, "click", (event) => {
      event.stopPropagation();
      void this.selectTheme(theme.id);
    });
  }

  private readThemeColor(cssText: string | undefined, property: string, fallback: string): string {
    if (!cssText) return fallback;
    const expression = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;!]+)`, "i");
    return cssText.match(expression)?.[1]?.trim() ?? fallback;
  }

  private setThemeMenuOpen(open: boolean): void {
    this.themeMenuEl.hidden = !open;
    this.themeButtonEl.setAttribute("aria-expanded", String(open));
    this.themeButtonEl.toggleClass("is-open", open);
    if (open) {
      this.themeMenuEl.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
    }
  }

  private closeThemeMenu(): void {
    if (!this.themeMenuEl || !this.themeButtonEl) return;
    this.setThemeMenuOpen(false);
  }

  private syncThemePicker(): void {
    const selectedId = this.plugin.getSelectedThemeId();
    const theme = getTheme(selectedId);
    this.themeButtonEl.setText(`样式 · ${theme.name}  ▾`);
    this.themeButtonEl.setAttribute("aria-label", `当前样式：${theme.name}，点击选择其他样式`);
    this.themeMenuEl.querySelectorAll<HTMLButtonElement>(".ob2wechat-theme-option").forEach((option) => {
      const selected = option.dataset.themeId === theme.id;
      option.toggleClass("is-selected", selected);
      option.setAttribute("aria-selected", String(selected));
    });
  }

  private async selectTheme(themeId: string): Promise<void> {
    this.closeThemeMenu();
    if (themeId === this.plugin.getSelectedThemeId()) return;
    await this.plugin.setSelectedThemeId(themeId);
    this.syncThemePicker();
    this.setStatus(`正在应用「${getTheme(themeId).name}」样式…`, "loading");
    this.scheduleRefresh(true);
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
      const rendered = await this.renderer.render(
        snapshot.markdown,
        snapshot.file,
        this.plugin.getSelectedThemeId(),
      );
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
    this.plugin.syncPreviewFromEditor();
  }

  private showEmptyState(message: string): void {
    this.previewEl.empty();
    this.previewEl.createDiv({ cls: "ob2wechat-empty-state", text: message });
    this.setStatus("", "idle");
    this.warningEl.hide();
    this.copyButtonEl.disabled = true;
    this.sourceScrollGeometry = null;
    this.releasePreviewScrollLock();
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
      && this.currentArticle.themeId === this.plugin.getSelectedThemeId()
    ) {
      return this.currentArticle;
    }

    const revision = ++this.requestedRevision;
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    const rendered = await this.renderer.render(
      snapshot.markdown,
      snapshot.file,
      this.plugin.getSelectedThemeId(),
    );
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
