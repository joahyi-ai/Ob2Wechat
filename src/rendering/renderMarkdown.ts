import { App, Component, MarkdownRenderer, TFile } from "obsidian";
import { applyWechatTheme } from "../theme/wechatTheme";
import { awaitRenderStable } from "./awaitRenderStable";
import { normalizeRenderedDocument } from "./normalize";
import { prepareMarkdown } from "./source";

export interface RenderedArticle {
  article: HTMLElement;
  plainText: string;
  sourceMarkdown: string;
  sourcePath: string;
}

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

export class PreviewRenderer {
  constructor(private readonly app: App) {}

  async render(markdown: string, file: TFile): Promise<RenderedArticle> {
    const prepared = prepareMarkdown(markdown, file.name);
    const staging = createStagingElement();
    const component = new Component();
    component.load();

    try {
      await MarkdownRenderer.render(this.app, prepared.markdown, staging, file.path, component);
      await awaitRenderStable(staging);

      const article = document.createElement("section");
      article.className = "ob2wechat-article";
      article.replaceChildren(...Array.from(staging.childNodes).map((node) => node.cloneNode(true)));

      normalizeRenderedDocument(article, prepared.hints, prepared.title);
      applyWechatTheme(article);

      return {
        article,
        plainText: article.innerText,
        sourceMarkdown: markdown,
        sourcePath: file.path,
      };
    } finally {
      component.unload();
      staging.remove();
    }
  }
}
