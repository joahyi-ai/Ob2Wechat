import { describe, expect, it } from "vitest";
import { makeWechatCompatible } from "../src/compatibility/wechatCompat";
import { sanitizeArticle } from "../src/compatibility/sanitizeHtml";
import { markArticleTitle, removeArticleTitle } from "../src/rendering/normalize";
import { applyWechatTheme } from "../src/theme/wechatTheme";

function article(html: string): HTMLElement {
  const root = document.createElement("section");
  root.innerHTML = html;
  return root;
}

describe("WeChat DOM transforms", () => {
  it("inlines the fixed theme onto key article elements", () => {
    const root = article("<h1>标题</h1><p>正文</p><table><tr><th>A</th><td>B</td></tr></table>");
    applyWechatTheme(root);
    expect(root.style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(root.querySelector("h1")?.getAttribute("style")).toContain("font-size:30px");
    expect(root.querySelector("table")?.getAttribute("style")).toContain("border-collapse:collapse");
    expect(root.querySelector("td")?.getAttribute("style")).toContain("overflow-wrap:anywhere");
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
