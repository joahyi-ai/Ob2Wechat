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
import type { ScrollMetrics, SourceScrollGeometry } from "./scroll/scrollSync";

export interface SourceSnapshot {
  file: TFile;
  markdown: string;
}

interface CodeMirrorBlockInfo {
  top: number;
}

interface CodeMirrorViewLike {
  contentHeight: number;
  documentTop: number;
  scaleY: number;
  lineBlockAt(position: number): CodeMirrorBlockInfo;
}

interface EditorWithCodeMirror extends Editor {
  cm?: CodeMirrorViewLike;
}

export default class Ob2WechatPlugin extends Plugin {
  private sourceView: MarkdownView | null = null;
  private sourceScroller: HTMLElement | null = null;
  private sourceScrollFrame: number | null = null;
  private sourceScrollerRetryTimer: number | null = null;
  private sourceScrollerObserver: MutationObserver | null = null;
  private observedSourceContainer: HTMLElement | null = null;
  private expectedSourceScrollTop: number | null = null;
  private sourceScrollReleaseTimer: number | null = null;

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
    this.observeSourceScroller(view);
    const scroller = view.containerEl.querySelector<HTMLElement>(".cm-scroller");
    if (!scroller) {
      if (this.sourceScroller && !view.containerEl.contains(this.sourceScroller)) {
        this.sourceScroller.removeEventListener("scroll", this.handleSourceScroll);
        this.sourceScroller = null;
      }
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
      this.syncPreviewFromEditor();
      return;
    }

    if (this.sourceScroller) {
      this.sourceScroller.removeEventListener("scroll", this.handleSourceScroll);
    }
    this.sourceScroller = scroller;
    scroller.addEventListener("scroll", this.handleSourceScroll, { passive: true });
    this.expectedSourceScrollTop = null;
    this.syncPreviewFromEditor();
  }

  private observeSourceScroller(view: MarkdownView): void {
    if (this.observedSourceContainer === view.containerEl) return;
    this.sourceScrollerObserver?.disconnect();
    this.observedSourceContainer = view.containerEl;
    this.sourceScrollerObserver = new MutationObserver(() => {
      if (this.sourceView !== view) return;
      const current = view.containerEl.querySelector<HTMLElement>(".cm-scroller");
      if (current !== this.sourceScroller) this.attachSourceScroller(view);
    });
    this.sourceScrollerObserver.observe(view.containerEl, { childList: true, subtree: true });
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
    if (this.sourceScrollReleaseTimer !== null) {
      window.clearTimeout(this.sourceScrollReleaseTimer);
      this.sourceScrollReleaseTimer = null;
    }
    if (this.sourceScroller) {
      this.sourceScroller.removeEventListener("scroll", this.handleSourceScroll);
      this.sourceScroller = null;
    }
    this.sourceScrollerObserver?.disconnect();
    this.sourceScrollerObserver = null;
    this.observedSourceContainer = null;
    this.expectedSourceScrollTop = null;
  }

  private readonly handleSourceScroll = (): void => {
    if (this.expectedSourceScrollTop !== null && this.sourceScroller) {
      if (Math.abs(this.sourceScroller.scrollTop - this.expectedSourceScrollTop) < 2) return;
      this.releaseSourceScrollLock();
    }
    if (this.sourceScrollFrame !== null) return;
    this.sourceScrollFrame = window.requestAnimationFrame(() => {
      this.sourceScrollFrame = null;
      this.syncPreviewFromEditor();
    });
  };

  private releaseSourceScrollLock(): void {
    this.expectedSourceScrollTop = null;
    if (this.sourceScrollReleaseTimer !== null) {
      window.clearTimeout(this.sourceScrollReleaseTimer);
      this.sourceScrollReleaseTimer = null;
    }
  }

  public syncPreviewFromEditor(): void {
    if (!this.sourceScroller || !this.sourceView) return;
    const preview = this.previewView();
    if (!preview) return;
    const sourceMarkdownLength = this.sourceView.editor.getValue().length;
    const codeMirror = (this.sourceView.editor as EditorWithCodeMirror).cm;
    const metrics = this.getSourceScrollMetrics(codeMirror);
    const anchors = preview.getSourceAnchorOffsets().map((sourceOffset) => {
      const boundedOffset = Math.min(sourceMarkdownLength, Math.max(0, sourceOffset));
      let sourceTop = sourceMarkdownLength === 0
        ? 0
        : (boundedOffset / sourceMarkdownLength) * metrics.scrollHeight;
      if (codeMirror) {
        try {
          sourceTop = codeMirror.lineBlockAt(boundedOffset).top;
        } catch {
          // Keep the proportional fallback if CodeMirror is between document updates.
        }
      }
      return { sourceOffset, sourceTop };
    });
    const geometry: SourceScrollGeometry = {
      ...metrics,
      anchors,
    };
    preview.syncScrollFromEditor(geometry);
  }

  public syncEditorFromPreview(scrollTop: number): void {
    if (!this.sourceScroller || !this.sourceView || !Number.isFinite(scrollTop)) return;
    const codeMirror = (this.sourceView.editor as EditorWithCodeMirror).cm;
    const metrics = this.getSourceScrollMetrics(codeMirror);
    const maximum = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
    const target = Math.min(maximum, Math.max(0, scrollTop));
    if (Math.abs(metrics.scrollTop - target) < 1) return;
    const scaleY = codeMirror?.scaleY || 1;
    const domMaximum = Math.max(0, this.sourceScroller.scrollHeight - this.sourceScroller.clientHeight);
    const domTarget = Math.min(
      domMaximum,
      Math.max(0, this.sourceScroller.scrollTop + (target - metrics.scrollTop) * scaleY),
    );

    this.expectedSourceScrollTop = domTarget;
    this.sourceScroller.scrollTop = domTarget;
    this.previewView()?.updateSourceScrollTopFromPreview(target);
    if (this.sourceScrollReleaseTimer !== null) {
      window.clearTimeout(this.sourceScrollReleaseTimer);
    }
    this.sourceScrollReleaseTimer = window.setTimeout(() => {
      this.sourceScrollReleaseTimer = null;
      this.expectedSourceScrollTop = null;
    }, 80);
  }

  private getSourceScrollMetrics(codeMirror: CodeMirrorViewLike | undefined): ScrollMetrics {
    if (!this.sourceScroller || !codeMirror) {
      return {
        scrollTop: this.sourceScroller?.scrollTop ?? 0,
        scrollHeight: this.sourceScroller?.scrollHeight ?? 0,
        clientHeight: this.sourceScroller?.clientHeight ?? 0,
      };
    }

    const viewportTop = this.sourceScroller.getBoundingClientRect().top;
    const scaleY = codeMirror.scaleY || 1;
    return {
      scrollTop: Math.max(0, (viewportTop - codeMirror.documentTop) / scaleY),
      scrollHeight: codeMirror.contentHeight,
      clientHeight: this.sourceScroller.clientHeight / scaleY,
    };
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
    this.syncPreviewFromEditor();
  }

  private async copyViaPreview(): Promise<void> {
    await this.activatePreview();
    await this.previewView()?.copyArticle();
  }
}
