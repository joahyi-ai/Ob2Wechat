import { describe, expect, it } from "vitest";
import { makeWechatCompatible } from "../src/compatibility/wechatCompat";
import { sanitizeArticle } from "../src/compatibility/sanitizeHtml";
import { markArticleTitle, removeArticleTitle } from "../src/rendering/normalize";
import { THEME_GROUPS, THEMES } from "../src/theme/raphael";
import { applyWechatTheme } from "../src/theme/wechatTheme";

function article(html: string): HTMLElement {
  const root = document.createElement("section");
  root.innerHTML = html;
  return root;
}

describe("WeChat DOM transforms", () => {
  it("inlines the default WeChat theme onto key article elements", () => {
    const root = article("<h1>标题</h1><p>正文</p><table><tr><th>A</th><td>B</td></tr></table>");
    applyWechatTheme(root);
    expect(root.style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(root.dataset.ob2wechatTheme).toBe("wechat");
    expect(root.querySelector("h1")?.style.fontSize).toBe("32px");
    expect(root.querySelector("table")?.style.borderCollapse).toBe("collapse");
    expect(root.querySelector("td")?.style.border).toContain("1px solid");
  });

  it("exposes and applies all 30 Raphael Publish themes", () => {
    expect(THEMES).toHaveLength(30);
    expect(THEME_GROUPS.map((group) => group.themes.length)).toEqual([10, 10, 10]);

    const light = article("<h1>标题</h1><p><strong>正文</strong></p>");
    applyWechatTheme(light, "claude");
    expect(light.dataset.ob2wechatTheme).toBe("claude");
    expect(light.style.backgroundColor).toBe("rgb(248, 246, 240)");
    expect(light.querySelector("h1")?.style.color).toBe("rgb(183, 92, 61)");

    const dark = article('<pre><code><span class="token keyword">const</span></code></pre>');
    applyWechatTheme(dark, "linear");
    expect(dark.dataset.ob2wechatTheme).toBe("linear");
    expect(dark.style.backgroundColor).toBe("rgb(16, 17, 20)");
    expect(dark.querySelector<HTMLElement>(".token.keyword")?.style.color).toBe("rgb(255, 123, 114)");
  });

  it("turns task controls and callouts into static content", () => {
    const root = article(`
      <div class="callout">
        <div class="callout-title"><svg class="callout-icon"></svg>提示</div>
        <div class="callout-content"><p>内容</p></div>
      </div>
      <input type="checkbox" checked>
    `);
    makeWechatCompatible(root);
    expect(root.querySelector("input")).toBeNull();
    expect(root.textContent).toContain("☑");
    expect(root.querySelector("section")).not.toBeNull();
    expect(root.querySelector("svg")).toBeNull();
  });

  it("uses the selected theme accent for task controls and copied markers", () => {
    const root = article(`
      <input type="checkbox" checked>
      <input type="checkbox">
    `);

    applyWechatTheme(root, "sspai");

    const markers = root.querySelectorAll<HTMLElement>(".ob2wechat-task-marker");
    expect(root.querySelector("input")).toBeNull();
    expect(markers).toHaveLength(2);
    expect(markers[0]?.textContent).toBe("✓");
    expect(markers[0]?.style.backgroundColor).toBe("rgb(215, 26, 27)");
    expect(markers[0]?.style.borderColor).toBe("rgb(215, 26, 27)");
    expect(markers[1]?.textContent).toBe("");
    expect(markers[1]?.style.backgroundColor).toBe("transparent");
    expect(markers[1]?.style.borderColor).toBe("rgb(215, 26, 27)");

    makeWechatCompatible(root);

    expect(root.querySelector("input")).toBeNull();
    expect(root.querySelectorAll(".ob2wechat-task-marker")).toHaveLength(2);
  });

  it.each(["bloomberg", "dracula", "nord"])(
    "keeps semantic callouts visible and aligned with quotes in the %s theme",
    (themeId) => {
      const calloutTypes = ["warning", "danger", "info"] as const;
      const root = article(`
        <blockquote><p>普通引用</p></blockquote>
        ${calloutTypes.map((type) => `
          <div class="callout" data-callout="${type}">
            <div class="callout-title" style="color:rgb(255, 0, 0)">
              <div class="callout-icon" style="color:rgb(255, 0, 0)">
                <svg class="svg-icon" style="color:rgb(255, 0, 0)"></svg>
              </div>
              <div>${type}</div>
            </div>
            <div class="callout-content"><p>${type} 内容</p></div>
          </div>
        `).join("")}
      `);

      applyWechatTheme(root, themeId);

      const quote = root.querySelector<HTMLElement>("blockquote")!;
      const quoteContent = quote.querySelector<HTMLElement>("p")!;
      calloutTypes.forEach((type) => {
        const callout = root.querySelector<HTMLElement>(`.callout[data-callout="${type}"]`)!;
        const title = callout.querySelector<HTMLElement>(".callout-title")!;
        const icon = callout.querySelector<HTMLElement>(".callout-icon")!;
        const iconSvg = icon.querySelector<HTMLElement>("svg")!;
        const content = callout.querySelector<HTMLElement>(".callout-content p")!;
        expect(callout.style.backgroundColor).toBe(quote.style.backgroundColor);
        expect(callout.style.borderLeftColor).toBe(quote.style.borderLeftColor);
        expect(callout.style.borderLeftStyle).toBe(quote.style.borderLeftStyle);
        expect(callout.style.borderLeftWidth).toBe(quote.style.borderLeftWidth);
        expect(callout.style.color).toBe(quote.style.color);
        expect(callout.style.getPropertyValue("mix-blend-mode")).toBe("normal");
        expect(callout.style.getPropertyPriority("mix-blend-mode")).toBe("important");
        expect(title.style.color).toBe("inherit");
        expect(title.style.getPropertyPriority("color")).toBe("important");
        expect(icon.style.color).toBe("inherit");
        expect(icon.style.getPropertyPriority("color")).toBe("important");
        expect(iconSvg.style.color).toBe("inherit");
        expect(iconSvg.style.getPropertyPriority("color")).toBe("important");
        expect(content.style.color).toBe(quoteContent.style.color);
        expect(content.style.marginTop).toBe("0px");
        expect(content.style.marginBottom).toBe("0px");
      });

      makeWechatCompatible(root);
      sanitizeArticle(root);
      calloutTypes.forEach((type) => {
        const copiedCallout = Array.from(root.querySelectorAll<HTMLElement>("section"))
          .find((element) => element.textContent?.includes(`${type} 内容`));
        expect(copiedCallout?.style.backgroundColor).toBe(quote.style.backgroundColor);
        expect(copiedCallout?.style.borderLeftColor).toBe(quote.style.borderLeftColor);
        expect(copiedCallout?.style.color).toBe(quote.style.color);
        expect(copiedCallout?.style.mixBlendMode).toBe("normal");
        expect(copiedCallout?.hasAttribute("class")).toBe(false);
        expect(copiedCallout?.hasAttribute("data-callout")).toBe(false);
      });
    },
  );

  it("preserves the selected theme typography during WeChat compatibility", () => {
    const root = article("<p>新闻正文</p><blockquote>引用</blockquote>");
    applyWechatTheme(root, "media");
    makeWechatCompatible(root);

    expect(root.querySelector<HTMLElement>("p")?.style.fontFamily).toContain("Georgia");
    expect(root.querySelector<HTMLElement>("blockquote")?.style.fontFamily).toContain("Georgia");
  });

  it("removes scripts, event handlers, private attributes and unsafe URLs", () => {
    const root = article(`
      <script>alert(1)</script>
      <p class="internal" data-path="secret" onclick="alert(1)">正文</p>
      <a href="javascript:alert(1)">bad</a>
      <a href="https://example.com">good</a>
      <img src="data:image/png;base64,AA==" alt="image">
    `);
    sanitizeArticle(root);
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("p")?.attributes).toHaveLength(0);
    expect(root.querySelectorAll("a")[0]?.hasAttribute("href")).toBe(false);
    expect(root.querySelectorAll("a")[1]?.getAttribute("href")).toBe("https://example.com");
    expect(root.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,AA==");
  });

  it("removes only the marked article title from the copy DOM", () => {
    const root = article("<h1>文件标题</h1><p>第一段正文</p><h1>正文中的一级标题</h1>");
    expect(markArticleTitle(root, "文件标题")).toBe(true);
    expect(removeArticleTitle(root)).toBe(true);
    expect(root.querySelector("h1")?.textContent).toBe("正文中的一级标题");
    expect(root.textContent).toContain("第一段正文");
  });

  it("keeps headings when no matching article title was marked", () => {
    const root = article("<h1>正文标题</h1><p>正文</p>");
    expect(markArticleTitle(root, "另一个文件名")).toBe(false);
    expect(removeArticleTitle(root)).toBe(false);
    expect(root.querySelector("h1")?.textContent).toBe("正文标题");
  });
});
