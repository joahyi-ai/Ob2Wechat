export const WECHAT_CONTAINER_STYLE = [
  "max-width:100%",
  "margin:0 auto",
  "padding:24px 20px 48px",
  "box-sizing:border-box",
  "font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,\"PingFang SC\",\"Hiragino Sans GB\",\"Microsoft YaHei\",sans-serif",
  "font-size:16px",
  "line-height:1.7",
  "color:#333333",
  "background-color:#ffffff",
  "overflow-wrap:break-word",
].join(";");

// Adapted from Raphael Publish's MIT-licensed `wechat` theme.
const ELEMENT_STYLES: Record<string, string> = {
  h1: "font-size:30px;font-weight:700;color:#111111;line-height:1.3;margin:34px 0 18px;letter-spacing:-0.015em",
  h2: "font-size:25px;font-weight:650;color:#111111;line-height:1.35;margin:30px 0 15px",
  h3: "font-size:21px;font-weight:650;color:#333333;line-height:1.4;margin:27px 0 14px",
  h4: "font-size:18px;font-weight:650;color:#333333;line-height:1.4;margin:24px 0 12px",
  h5: "font-size:17px;font-weight:650;color:#333333;line-height:1.45;margin:22px 0 10px",
  h6: "font-size:16px;font-weight:650;color:#555555;line-height:1.45;margin:20px 0 10px",
  p: "margin:18px 0;line-height:1.7;color:#333333",
  strong: "font-weight:700;color:#07c160;background-color:rgba(7,193,96,0.08);padding:0 3px;border-radius:3px",
  em: "font-style:italic;color:#666666",
  del: "color:#888888;text-decoration:line-through",
  a: "color:#07c160;text-decoration:none;border-bottom:1px solid #07c160;padding-bottom:1px",
  ul: "margin:16px 0;padding-left:28px;list-style-type:disc;list-style-position:outside",
  ol: "margin:16px 0;padding-left:28px;list-style-type:decimal;list-style-position:outside",
  li: "margin:8px 0;line-height:1.7;color:#333333",
  blockquote: "margin:24px 0;padding:16px 20px;background-color:#f0f7f2;border-left:4px solid #07c160;color:#555555;border-radius:4px",
  code: "font-family:\"SFMono-Regular\",Consolas,\"Liberation Mono\",Menlo,monospace;padding:3px 6px;background-color:#f0f7f2;color:#057a3d;border-radius:4px;font-size:13px;line-height:1.5",
  pre: "margin:24px 0;padding:18px 20px;background-color:#f6f8fa;border:1px solid #e6e8eb;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.55;white-space:pre;tab-size:2",
  hr: "margin:36px auto;border:0;height:1px;background-color:#eaeaea;width:100%",
  img: "display:block;max-width:100%;height:auto;margin:24px auto;border-radius:4px;box-sizing:border-box",
  table: "width:100%;margin:24px 0;border-collapse:collapse;border-spacing:0;font-size:15px;table-layout:fixed",
  th: "background-color:#f0f7f2;padding:10px 12px;text-align:left;font-weight:650;color:#333333;border:1px solid #d8e8dc;overflow-wrap:anywhere",
  td: "padding:10px 12px;border:1px solid #d8e8dc;color:#333333;vertical-align:top;overflow-wrap:anywhere",
  tr: "border:0",
  sup: "font-size:0.75em;line-height:0;vertical-align:super;color:#07c160",
};

const TOKEN_STYLES: Record<string, string> = {
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

function appendStyle(element: Element, cssText: string): void {
  const htmlElement = element as HTMLElement;
  const current = htmlElement.getAttribute("style")?.trim() ?? "";
  htmlElement.setAttribute("style", current ? `${current};${cssText}` : cssText);
}

function styleCallouts(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".callout").forEach((callout) => {
    appendStyle(callout, "margin:24px 0;padding:16px 18px;background:#f0f7f2;border:1px solid #d8e8dc;border-left:4px solid #07c160;border-radius:6px;color:#333333");
    callout.removeAttribute("data-callout-fold");
  });
  root.querySelectorAll<HTMLElement>(".callout-title").forEach((title) => {
    appendStyle(title, "display:flex;align-items:center;gap:8px;margin:0 0 8px;font-weight:700;color:#057a3d");
  });
  root.querySelectorAll<HTMLElement>(".callout-icon").forEach((icon) => {
    appendStyle(icon, "display:inline-flex;width:18px;height:18px;color:#07c160;flex:0 0 auto");
  });
  root.querySelectorAll<HTMLElement>(".callout-content").forEach((content) => {
    appendStyle(content, "margin:0;color:#333333");
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

function styleFootnotes(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("section.footnotes").forEach((section) => {
    appendStyle(section, "margin-top:36px;padding-top:16px;border-top:1px solid #eaeaea;color:#666666;font-size:14px");
  });
}

export function applyWechatTheme(root: HTMLElement): HTMLElement {
  root.setAttribute("style", WECHAT_CONTAINER_STYLE);
  root.setAttribute("data-ob2wechat-article", "true");

  Object.entries(ELEMENT_STYLES).forEach(([selector, cssText]) => {
    root.querySelectorAll(selector).forEach((element) => appendStyle(element, cssText));
  });

  root.querySelectorAll<HTMLElement>("pre code").forEach((code) => {
    code.setAttribute("style", "display:block;padding:0;background:transparent;color:#24292f;border-radius:0;font-size:inherit;line-height:inherit;white-space:pre;word-break:normal;overflow-wrap:normal;font-family:inherit");
  });

  Object.entries(TOKEN_STYLES).forEach(([selector, cssText]) => {
    root.querySelectorAll(selector).forEach((element) => appendStyle(element, cssText));
  });

  root.querySelectorAll<HTMLElement>("ul ul").forEach((list) => appendStyle(list, "list-style-type:circle"));
  root.querySelectorAll<HTMLElement>("ul ul ul").forEach((list) => appendStyle(list, "list-style-type:square"));
  root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
    input.disabled = true;
    appendStyle(input, "margin:0 8px 0 0;vertical-align:middle;accent-color:#07c160");
  });

  styleCallouts(root);
  styleMathAndMermaid(root);
  styleFootnotes(root);
  return root;
}
