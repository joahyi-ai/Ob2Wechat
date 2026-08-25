import { App, Component, MarkdownRenderer, TFile } from "obsidian";
import { applyWechatTheme } from "../theme/wechatTheme";
import { awaitRenderStable } from "./awaitRenderStable";
import { normalizeRenderedDocument } from "./normalize";
import { prepareMarkdown } from "./source";

export interface RenderedScrollAnchor {
  sourceOffset: number;
  element: HTMLElement;
}

export interface RenderedArticle {
  article: HTMLElement;
  plainText: string;
  sourceMarkdown: string;
  sourcePath: string;
  scrollAnchors: RenderedScrollAnchor[];
}

const SCROLL_ANCHOR_SELECTOR = "[data-ob2wechat-source-offset]";

function createStagingElement(): HTMLElement {
  const staging = document.createElement("div");
  staging.className = "markdown-rendered ob2wechat-render-staging";
  staging.setAttribute("aria-hidden", "true");
  staging.setAttribute(
    "style",
    "position:fixed;left:-100000px;top:0;width:480px;min-height:1px;opacity:0;pointer-events:none;z-index:-2147483648;contain:layout style paint",
  );
  document.body.appendChild(staging);
  return staging;
}

function nextElementAfter(element: Element, root: HTMLElement): HTMLElement | null {
  let current: Element | null = element;
  while (current && current !== root) {
    const sibling = current.nextElementSibling;
    if (sibling) return sibling as HTMLElement;
    current = current.parentElement;
  }
  return null;
}

function nextContentElement(marker: HTMLElement, root: HTMLElement): HTMLElement | null {
  let candidate = nextElementAfter(marker, root);
  while (candidate?.matches(SCROLL_ANCHOR_SELECTOR)) {
    candidate = nextElementAfter(candidate, root);
  }
  return candidate;
}

function removeAnchorMarker(marker: HTMLElement, root: HTMLElement): void {
  const parent = marker.parentElement;
  if (
    parent
    && parent !== root
    && parent.children.length === 1
    && (parent.textContent?.trim() ?? "").length === 0
    && parent.matches("p, div")
  ) {
    parent.remove();
    return;
  }
  marker.remove();
}

export function materializeScrollAnchors(root: HTMLElement): RenderedScrollAnchor[] {
  const markers = Array.from(root.querySelectorAll<HTMLElement>(SCROLL_ANCHOR_SELECTOR));
  const anchors: RenderedScrollAnchor[] = [];

  markers.forEach((marker) => {
    const sourceOffset = Number(marker.dataset.ob2wechatSourceOffset);
    const element = nextContentElement(marker, root);
    if (Number.isFinite(sourceOffset) && element) {
      const previous = anchors[anchors.length - 1];
      if (!previous || previous.sourceOffset !== sourceOffset || previous.element !== element) {
        anchors.push({ sourceOffset, element });
      }
    }
  });

  markers.forEach((marker) => removeAnchorMarker(marker, root));
  return anchors.sort((left, right) => left.sourceOffset - right.sourceOffset);
}

export class PreviewRenderer {
  constructor(private readonly app: App) {}

  async render(markdown: string, file: TFile): Promise<RenderedArticle> {
    const prepared = prepareMarkdown(markdown, file.name);
    const staging = createStagingElement();
    const component = new Component();
    component.load();

    try {
      await MarkdownRenderer.render(this.app, prepared.renderMarkdown, staging, file.path, component);
      await awaitRenderStable(staging);

      const article = document.createElement("section");
      article.className = "ob2wechat-article";
      article.replaceChildren(...Array.from(staging.childNodes).map((node) => node.cloneNode(true)));

      normalizeRenderedDocument(article, prepared.hints, prepared.title);
      const scrollAnchors = materializeScrollAnchors(article);
      applyWechatTheme(article);

      return {
        article,
        plainText: article.innerText,
        sourceMarkdown: markdown,
        sourcePath: file.path,
        scrollAnchors,
      };
    } finally {
      component.unload();
      staging.remove();
    }
  }
}
