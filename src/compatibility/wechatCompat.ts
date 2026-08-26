function replaceElementTag(element: HTMLElement, tagName: keyof HTMLElementTagNameMap): HTMLElement {
  const replacement = createEl(tagName);
  for (const attribute of Array.from(element.attributes)) {
    replacement.setAttribute(attribute.name, attribute.value);
  }
  replacement.replaceChildren(...Array.from(element.childNodes));
  element.replaceWith(replacement);
  return replacement;
}

function staticizeTasks(root: HTMLElement): void {
  const themeAccent = root.style.getPropertyValue("--ob2wechat-theme-accent").trim();
  root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
    const marker = createSpan();
    marker.textContent = checkbox.checked ? "☑" : "☐";
    marker.setCssStyles({
      display: "inline-block",
      marginRight: "8px",
      color: checkbox.style.accentColor || themeAccent || "#07c160",
      fontSize: "1em",
      verticalAlign: "baseline",
    });
    checkbox.replaceWith(marker);
  });
}

function staticizeCallouts(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".callout-icon, .callout-fold").forEach((element) => element.remove());
  root.querySelectorAll<HTMLElement>(".callout").forEach((callout) => replaceElementTag(callout, "section"));
  root.querySelectorAll<HTMLElement>(".callout-title").forEach((title) => replaceElementTag(title, "p"));
  root.querySelectorAll<HTMLElement>(".callout-content").forEach((content) => replaceElementTag(content, "section"));
}

function staticizeFootnotes(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("a.footnote-backref, a.footnote-link").forEach((link) => {
    if (link.textContent?.includes("↩")) link.remove();
  });
}

function normalizeLinks(root: HTMLElement): void {
  root.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    const href = link.getAttribute("href")?.trim();
    if (!href || href.startsWith("app:") || href.startsWith("obsidian:") || href.startsWith("#")) {
      link.removeAttribute("href");
    }
  });
}

function distributeContainerStyles(root: HTMLElement): void {
  const family = root.style.fontFamily || "-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,\"PingFang SC\",\"Microsoft YaHei\",sans-serif";
  const lineHeight = root.style.lineHeight || "1.7";
  root.querySelectorAll<HTMLElement>("p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,span").forEach((element) => {
    if (element.closest("pre,code")) return;
    if (!element.style.fontFamily) element.setCssStyles({ fontFamily: family });
    if (!element.style.lineHeight && ["P", "LI", "BLOCKQUOTE", "TD", "TH"].includes(element.tagName)) {
      element.setCssStyles({ lineHeight });
    }
  });
}

function keepCjkPunctuationWithInline(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("strong,b,em,span,a,code").forEach((element) => {
    const next = element.nextSibling;
    if (!next || next.nodeType !== Node.TEXT_NODE) return;
    const text = next.textContent ?? "";
    const match = text.match(/^\s*([：；，。！？、:])(.*)$/s);
    if (!match?.[1]) return;
    element.append(document.createTextNode(match[1]));
    if (match[2]) next.textContent = match[2];
    else next.remove();
  });
}

export function makeWechatCompatible(root: HTMLElement): HTMLElement {
  staticizeTasks(root);
  staticizeCallouts(root);
  staticizeFootnotes(root);
  normalizeLinks(root);
  distributeContainerStyles(root);
  keepCjkPunctuationWithInline(root);
  return root;
}
