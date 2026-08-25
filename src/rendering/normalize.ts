import type { SourceHints } from "./source";

const REMOVE_SELECTORS = [
  ".frontmatter",
  ".frontmatter-container",
  ".mod-frontmatter",
  ".copy-code-button",
  ".collapse-indicator",
  ".callout-fold",
  ".heading-collapse-indicator",
  ".pdf-embed",
  ".audio-embed",
  ".video-embed",
];

export function annotateGeneratedContent(root: HTMLElement, hints: SourceHints): void {
  const mathNodes = Array.from(root.querySelectorAll<HTMLElement>("mjx-container"));
  mathNodes.forEach((node, index) => {
    const source = hints.math[index];
    if (source) node.setAttribute("data-ob2wechat-source", source);
  });

  const mermaidNodes = Array.from(root.querySelectorAll<HTMLElement>(".mermaid"));
  mermaidNodes.forEach((node, index) => {
    const source = hints.mermaid[index];
    if (source) node.setAttribute("data-ob2wechat-source", source);
  });
}

export function normalizeRenderedDocument(root: HTMLElement, hints: SourceHints): HTMLElement {
  REMOVE_SELECTORS.forEach((selector) => {
    root.querySelectorAll(selector).forEach((element) => element.remove());
  });

  root.querySelectorAll<HTMLAnchorElement>("a.internal-link").forEach((link) => {
    link.removeAttribute("href");
    link.removeAttribute("data-href");
  });

  root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
    input.disabled = true;
    input.removeAttribute("tabindex");
  });

  root.querySelectorAll<HTMLElement>("[contenteditable]").forEach((element) => {
    element.removeAttribute("contenteditable");
  });

  annotateGeneratedContent(root, hints);
  return root;
}
