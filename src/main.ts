import {
  Editor,
  MarkdownView,
  Plugin,
  TAbstractFile,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import {
  VIEW_TYPE_WECHAT_PREVIEW,
  WechatPreviewView,
} from "./views/WechatPreviewView";
import { calculateScrollProgress } from "./scroll/scrollSync";

export interface SourceSnapshot {
  file: TFile;
  markdown: string;
}

export default class Ob2WechatPlugin extends Plugin {
  private sourceView: MarkdownView | null = null;
  private sourceScroller: HTMLElement | null = null;
  private sourceScrollFrame: number | null = null;
  private sourceScrollerRetryTimer: number | null = null;

  async onload(): Promise<void> {
    this.registerView(
      VIEW_TYPE_WECHAT_PREVIEW,
      (leaf) => new WechatPreviewView(leaf, this),
    );

    this.addRibbonIcon("message-square-text", "打开公众号预览", () => {
      void this.activatePreview();
    });

    this.addCommand({
      id: "open-wechat-preview",
      name: "打开公众号预览",
      callback: () => void this.activatePreview(),
    });

    this.addCommand({
      id: "copy-current-note-to-wechat",
      name: "复制当前笔记正文到公众号",
      checkCallback: (checking) => {
        const available = this.getSourceSnapshot() !== null;
        if (!checking && available) void this.copyViaPreview();
        return available;
      },
    });

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        this.updateSourceView(leaf);
      }),
    );

    this.registerEvent(
      this.app.workspace.on("editor-change", (_editor: Editor, info) => {
        if (info instanceof MarkdownView && info === this.sourceView) {
          this.previewView()?.scheduleRefresh(false);
        }
      }),
    );

    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        const active = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (active) {
          this.sourceView = active;
          this.attachSourceScroller(active);
        }
        this.previewView()?.scheduleRefresh(true);
      }),
    );

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        if (this.sourceView) this.attachSourceScroller(this.sourceView);
      }),
    );

    this.registerEvent(
      this.app.vault.on("rename", (file) => this.refreshForFileEvent(file)),
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => this.refreshForFileEvent(file)),
    );

    this.app.workspace.onLayoutReady(() => {
      this.sourceView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (this.sourceView) this.attachSourceScroller(this.sourceView);
      this.previewView()?.scheduleRefresh(true);
    });
  }

  onunload(): void {
    this.detachSourceScroller();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_WECHAT_PREVIEW);
  }

  getSourceSnapshot(): SourceSnapshot | null {
    if (!this.sourceView?.file) return null;
    const stillOpen = this.app.workspace
      .getLeavesOfType("markdown")
      .some((leaf) => leaf.view === this.sourceView);
    if (!stillOpen) {
      this.sourceView = null;
      this.detachSourceScroller();
      return null;
    }

    return {
      file: this.sourceView.file,
      markdown: this.sourceView.editor.getValue(),
    };
  }

  private updateSourceView(leaf: WorkspaceLeaf | null): void {
    if (!leaf) return;
    if (leaf.view instanceof MarkdownView) {
      this.sourceView = leaf.view;
      this.attachSourceScroller(leaf.view);
      this.previewView()?.scheduleRefresh(true);
      return;
    }

    if (leaf.view.getViewType() !== VIEW_TYPE_WECHAT_PREVIEW) {
      this.sourceView = null;
      this.detachSourceScroller();
      this.previewView()?.scheduleRefresh(true);
    }
  }

  private attachSourceScroller(view: MarkdownView): void {
    const scroller = view.containerEl.querySelector<HTMLElement>(".cm-scroller");
    if (!scroller) {
      if (this.sourceScrollerRetryTimer !== null) window.clearTimeout(this.sourceScrollerRetryTimer);
      this.sourceScrollerRetryTimer = window.setTimeout(() => {
        this.sourceScrollerRetryTimer = null;
        if (this.sourceView === view && view.containerEl.querySelector(".cm-scroller")) {
          this.attachSourceScroller(view);
        }
      }, 50);
      return;
    }

    if (this.sourceScroller === scroller) {
      this.syncPreviewScroll();
      return;
    }

    this.detachSourceScroller();
    this.sourceScroller = scroller;
    scroller.addEventListener("scroll", this.handleSourceScroll, { passive: true });
    this.syncPreviewScroll();
  }

  private detachSourceScroller(): void {
    if (this.sourceScrollerRetryTimer !== null) {
      window.clearTimeout(this.sourceScrollerRetryTimer);
      this.sourceScrollerRetryTimer = null;
    }
    if (this.sourceScrollFrame !== null) {
      window.cancelAnimationFrame(this.sourceScrollFrame);
      this.sourceScrollFrame = null;
    }
    if (this.sourceScroller) {
      this.sourceScroller.removeEventListener("scroll", this.handleSourceScroll);
      this.sourceScroller = null;
    }
  }

  private readonly handleSourceScroll = (): void => {
    if (this.sourceScrollFrame !== null) return;
    this.sourceScrollFrame = window.requestAnimationFrame(() => {
      this.sourceScrollFrame = null;
      this.syncPreviewScroll();
    });
  };

  private syncPreviewScroll(): void {
    if (!this.sourceScroller) return;
    const progress = calculateScrollProgress({
      scrollTop: this.sourceScroller.scrollTop,
      scrollHeight: this.sourceScroller.scrollHeight,
      clientHeight: this.sourceScroller.clientHeight,
    });
    this.previewView()?.syncScrollFromEditor(progress);
  }

  private refreshForFileEvent(file: TAbstractFile): void {
    if (!this.sourceView?.file) return;
    if (file === this.sourceView.file || file.path === this.sourceView.file.path) {
      this.previewView()?.scheduleRefresh(true);
    }
  }

  private previewView(): WechatPreviewView | null {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_WECHAT_PREVIEW)[0];
    return leaf?.view instanceof WechatPreviewView ? leaf.view : null;
  }

  private async activatePreview(): Promise<void> {
    const activeMarkdown = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeMarkdown) {
      this.sourceView = activeMarkdown;
      this.attachSourceScroller(activeMarkdown);
    }

    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_WECHAT_PREVIEW)[0] ?? null;
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      if (!leaf) leaf = this.app.workspace.getLeaf("split", "vertical");
      await leaf.setViewState({
        type: VIEW_TYPE_WECHAT_PREVIEW,
        active: true,
      });
    }

    await this.app.workspace.revealLeaf(leaf);
    this.previewView()?.scheduleRefresh(true);
    this.syncPreviewScroll();
  }

  private async copyViaPreview(): Promise<void> {
    await this.activatePreview();
    await this.previewView()?.copyArticle();
  }
}
