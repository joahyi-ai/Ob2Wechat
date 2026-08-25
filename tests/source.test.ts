import { describe, expect, it } from "vitest";
import {
  articleTitleFromFileName,
  extractSourceHints,
  firstMarkdownHeading,
  prepareMarkdown,
  stripFrontmatter,
} from "../src/rendering/source";

describe("Markdown source preparation", () => {
  it("removes YAML frontmatter without removing the article", () => {
    const markdown = "---\ntitle: Hidden\ntags:\n  - test\n---\n\n正文";
    expect(stripFrontmatter(markdown)).toBe("\n正文");
  });

  it("derives the title from the Markdown filename", () => {
    expect(articleTitleFromFileName("公众号文章.md")).toBe("公众号文章");
    expect(articleTitleFromFileName("draft.MD")).toBe("draft");
  });

  it("adds the filename heading when one is not present", () => {
    const prepared = prepareMarkdown("正文", "文章.md");
    expect(prepared.markdown).toBe("# 文章\n\n正文");
  });

  it("does not duplicate a matching first heading", () => {
    const prepared = prepareMarkdown("# 文章\n\n正文", "文章.md");
    expect(prepared.markdown).toBe("# 文章\n\n正文");
  });

  it("only deduplicates exact first-level headings", () => {
    expect(firstMarkdownHeading("## 文章\n\n正文")).toBeNull();
    expect(prepareMarkdown("# 另一个标题\n\n正文", "文章.md").markdown).toContain("# 文章\n\n# 另一个标题");
  });

  it("collects formula and Mermaid fallback sources", () => {
    const hints = extractSourceHints("行内 $a+b$\n\n$$c=d$$\n\n```mermaid\ngraph TD\nA-->B\n```");
    expect(hints.math).toEqual(["a+b", "c=d"]);
    expect(hints.mermaid).toEqual(["graph TD\nA-->B"]);
  });
});
