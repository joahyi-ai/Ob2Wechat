const BLOCKED_ELEMENTS = "script,iframe,object,embed,form,button,textarea,select,style,link,meta,video,audio";
const GENERAL_ATTRIBUTES = new Set(["style", "title", "aria-label"]);
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  A: new Set(["href"]),
  IMG: new Set(["src", "alt", "width", "height"]),
  TD: new Set(["colspan", "rowspan"]),
  TH: new Set(["colspan", "rowspan"]),
  OL: new Set(["start"]),
};

function safeUrl(value: string, tagName: string, attributeName: string): boolean {
  if (attributeName === "src" && tagName === "IMG" && value.startsWith("data:image/")) return true;
  if (attributeName === "href") return /^(https?:|mailto:|tel:)/i.test(value);
  return attributeName !== "src" || /^https?:/i.test(value);
}

export function sanitizeArticle(root: HTMLElement): HTMLElement {
  root.querySelectorAll(BLOCKED_ELEMENTS).forEach((element) => element.remove());

  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    const allowedForTag = TAG_ATTRIBUTES[element.tagName] ?? new Set<string>();
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const allowed = GENERAL_ATTRIBUTES.has(name) || allowedForTag.has(name);
      const urlIsSafe = !["href", "src"].includes(name) || safeUrl(attribute.value.trim(), element.tagName, name);
      if (!allowed || !urlIsSafe || name.startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  root.removeAttribute("class");
  root.removeAttribute("data-ob2wechat-article");
  return root;
}
