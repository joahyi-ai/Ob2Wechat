import { DEFAULT_THEME_ID, getTheme, type Theme } from "./raphael";

export { DEFAULT_THEME_ID } from "./raphael";

export const WECHAT_CONTAINER_STYLE = getTheme(DEFAULT_THEME_ID).styles.container ?? "";

const SUPPLEMENTAL_ELEMENT_STYLES: Record<string, string> = {
  h5: "font-size:17px;font-weight:650;color:inherit;line-height:1.45;margin:22px 0 10px",
  h6: "font-size:16px;font-weight:650;color:inherit;line-height:1.45;margin:20px 0 10px",
  del: "color:inherit;opacity:0.68;text-decoration:line-through",
  sup: "font-size:0.75em;line-height:0;vertical-align:super;color:inherit",
};

const LIGHT_TOKEN_STYLES: Record<string, string> = {
  ".token.comment, .token.prolog, .token.doctype, .token.cdata": "color:#6a737d;font-style:italic",
  ".token.punctuation": "color:#586069",
  ".token.property, .token.tag, .token.constant, .token.symbol, .token.deleted": "color:#d73a49",
  ".token.boolean, .token.number": "color:#005cc5",
  ".token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted": "color:#22863a",
  ".token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string": "color:#d73a49",
  ".token.atrule, .token.attr-value, .token.keyword": "color:#d73a49;font-weight:600",
  ".token.function, .token.class-name": "color:#6f42c1",
  ".token.regex, .token.important, .token.variable": "color:#e36209",
};

const DARK_TOKEN_STYLES: Record<string, string> = {
  ".token.comment, .token.prolog, .token.doctype, .token.cdata": "color:#8b949e;font-style:italic",
  ".token.punctuation": "color:#c9d1d9",
  ".token.property, .token.tag, .token.constant, .token.symbol, .token.deleted": "color:#ff7b72",
  ".token.boolean, .token.number": "color:#79c0ff",
  ".token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted": "color:#a5d6ff",
  ".token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string": "color:#ff7b72",
  ".token.atrule, .token.attr-value, .token.keyword": "color:#ff7b72;font-weight:600",
  ".token.function, .token.class-name": "color:#d2a8ff",
  ".token.regex, .token.important, .token.variable": "color:#ffa657",
};

const DARK_THEME_IDS = new Set([
  "linear",
  "bloomberg",
  "dracula",
  "nord",
  "ocean",
  "monokai",
  "cyberpunk",
  "forest",
  "copper",
]);

function appendStyle(element: Element, cssText: string): void {
  const htmlElement = element as HTMLElement;
  const current = htmlElement.getAttribute("style")?.trim() ?? "";
  htmlElement.setAttribute("style", current ? `${current};${cssText}` : cssText);
}

function setStyle(element: HTMLElement | SVGElement, property: string, value: string, important = false): void {
  element.style.setProperty(property, value, important ? "important" : "");
}

function styleValue(cssText: string | undefined, property: string, fallback: string): string {
  if (!cssText) return fallback;
  const expression = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;!]+)`, "i");
  return cssText.match(expression)?.[1]?.trim() ?? fallback;
}

function themeAccent(theme: Theme): string {
  return styleValue(theme.styles.a, "color", styleValue(theme.styles.h1, "color", "#07c160"));
}

function applyElementStyles(root: HTMLElement, theme: Theme): void {
  Object.entries(theme.styles).forEach(([selector, cssText]) => {
    if (selector === "container" || selector === "pre code") return;
    root.querySelectorAll(selector).forEach((element) => {
      if (selector === "code" && element.parentElement?.tagName === "PRE") return;
      appendStyle(element, cssText);
    });
  });

  Object.entries(SUPPLEMENTAL_ELEMENT_STYLES).forEach(([selector, cssText]) => {
    root.querySelectorAll(selector).forEach((element) => appendStyle(element, cssText));
  });
}

function styleHeadingChildren(root: HTMLElement): void {
  const overrides: Record<string, string> = {
    strong: "font-weight:700;color:inherit!important;background-color:transparent!important",
    em: "font-style:italic;color:inherit!important;background-color:transparent!important",
    a: "color:inherit!important;text-decoration:none!important;border-bottom:1px solid currentColor!important;background-color:transparent!important",
    code: "color:inherit!important;background-color:transparent!important;border:0!important;padding:0!important",
  };
  root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6").forEach((heading) => {
    Object.entries(overrides).forEach(([selector, cssText]) => {
      heading.querySelectorAll(selector).forEach((element) => appendStyle(element, cssText));
    });
  });
}

function styleCode(root: HTMLElement, theme: Theme): void {
  root.querySelectorAll<HTMLElement>("pre code").forEach((code) => {
    appendStyle(code, "display:block;padding:0;background:transparent!important;color:inherit;border-radius:0;font-size:inherit!important;line-height:inherit!important;white-space:pre;word-break:normal;overflow-wrap:normal;font-family:inherit;font-style:normal!important");
  });

  const tokenStyles = DARK_THEME_IDS.has(theme.id) ? DARK_TOKEN_STYLES : LIGHT_TOKEN_STYLES;
  Object.entries(tokenStyles).forEach(([selector, cssText]) => {
    root.querySelectorAll(selector).forEach((element) => appendStyle(element, cssText));
  });
}

function styleListsAndTasks(root: HTMLElement, theme: Theme): void {
  const accent = themeAccent(theme);
  const markerColor = styleValue(theme.styles.container, "background-color", "#ffffff");
  root.querySelectorAll<HTMLElement>("ul").forEach((list) => appendStyle(list, "list-style-type:disc!important;list-style-position:outside"));
  root.querySelectorAll<HTMLElement>("ul ul").forEach((list) => appendStyle(list, "list-style-type:circle!important"));
  root.querySelectorAll<HTMLElement>("ul ul ul").forEach((list) => appendStyle(list, "list-style-type:square!important"));
  root.querySelectorAll<HTMLElement>("ol").forEach((list) => appendStyle(list, "list-style-type:decimal!important;list-style-position:outside"));
  root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
    const marker = createSpan();
    marker.className = "ob2wechat-task-marker";
    marker.textContent = input.checked ? "✓" : "";
    marker.setAttribute("aria-label", input.checked ? "已完成" : "未完成");
    appendStyle(marker, `display:inline-flex;width:1em;height:1em;margin:0 8px 0 0;box-sizing:border-box;align-items:center;justify-content:center;vertical-align:-0.12em;border:1.5px solid ${accent};border-radius:3px;background-color:${input.checked ? accent : "transparent"};color:${markerColor};font-size:0.78em;font-weight:700;line-height:1;flex:0 0 auto`);
    input.replaceWith(marker);
  });
}

function styleCallouts(root: HTMLElement, theme: Theme): void {
  const textColor = styleValue(theme.styles.p, "color", "inherit");
  root.querySelectorAll<HTMLElement>(".callout").forEach((callout) => {
    appendStyle(callout, theme.styles.blockquote ?? "margin:24px 0;padding:16px 20px");
    appendStyle(callout, "box-sizing:border-box");
    setStyle(callout, "mix-blend-mode", "normal", true);
    callout.removeAttribute("data-callout-fold");

    callout.querySelectorAll<HTMLElement>(".callout-title").forEach((title) => {
      appendStyle(title, "display:flex;align-items:center;gap:8px;margin:0 0 8px;font-weight:700");
      setStyle(title, "color", "inherit", true);
    });
    callout.querySelectorAll<HTMLElement>(".callout-icon").forEach((icon) => {
      appendStyle(icon, "display:inline-flex;width:18px;height:18px;flex:0 0 auto");
      setStyle(icon, "color", "inherit", true);
      icon.querySelectorAll<SVGElement>("svg").forEach((svg) => {
        setStyle(svg, "color", "inherit", true);
      });
    });
    callout.querySelectorAll<HTMLElement>(".callout-content").forEach((content) => {
      appendStyle(content, `margin:0;color:${textColor}`);
      const children = Array.from(content.children) as HTMLElement[];
      if (children[0]) setStyle(children[0], "margin-top", "0", true);
      if (children.length > 0) setStyle(children[children.length - 1]!, "margin-bottom", "0", true);
    });
  });
}

function styleMathAndMermaid(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("mjx-container").forEach((math) => {
    const block = math.getAttribute("display") === "true" || math.classList.contains("MathJax_Display");
    appendStyle(math, block ? "display:block;max-width:100%;overflow-x:auto;margin:22px auto;text-align:center" : "display:inline-block;max-width:100%;vertical-align:-0.15em;margin:0 0.08em");
  });
  root.querySelectorAll<HTMLElement>(".mermaid").forEach((diagram) => {
    appendStyle(diagram, "display:block;max-width:100%;margin:24px auto;text-align:center;overflow:hidden");
  });
  root.querySelectorAll<SVGElement>("svg").forEach((svg) => {
    appendStyle(svg, "max-width:100%;height:auto");
  });
}

function styleFootnotes(root: HTMLElement, theme: Theme): void {
  const border = styleValue(theme.styles.hr, "background-color", "rgba(128,128,128,0.28)");
  root.querySelectorAll<HTMLElement>("section.footnotes").forEach((section) => {
    appendStyle(section, `margin-top:36px;padding-top:16px;border-top:1px solid ${border};color:inherit;opacity:0.78;font-size:14px`);
  });
}

export function applyWechatTheme(root: HTMLElement, requestedThemeId?: string): HTMLElement {
  const theme = getTheme(requestedThemeId ?? root.dataset.ob2wechatTheme);
  setStyle(root, "--ob2wechat-theme-accent", themeAccent(theme));
  appendStyle(root, theme.styles.container ?? WECHAT_CONTAINER_STYLE);
  appendStyle(root, "box-sizing:border-box;overflow-wrap:break-word");
  root.setAttribute("data-ob2wechat-article", "true");
  root.dataset.ob2wechatTheme = theme.id;

  applyElementStyles(root, theme);
  styleHeadingChildren(root);
  styleCode(root, theme);
  styleListsAndTasks(root, theme);
  styleCallouts(root, theme);
  styleMathAndMermaid(root);
  styleFootnotes(root, theme);
  return root;
}
