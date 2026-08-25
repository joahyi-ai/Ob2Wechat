export interface SourceHints {
  math: string[];
  mermaid: string[];
}

export interface PreparedMarkdown {
  markdown: string;
  renderMarkdown: string;
  title: string;
  hints: SourceHints;
}

const FRONTMATTER_PATTERN = /^\uFEFF?---[\t ]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[\t ]*(?:\r?\n|$)/;
const SCROLL_ANCHOR_ATTRIBUTE = "data-ob2wechat-source-offset";

export function stripFrontmatter(markdown: string): string {
  return markdown.replace(FRONTMATTER_PATTERN, "");
}

export function articleTitleFromFileName(fileName: string): string {
  return fileName.replace(/\.md$/i, "").trim();
}

export function firstMarkdownHeading(markdown: string): string | null {
  const withoutComments = markdown.replace(/^<!--[\s\S]*?-->\s*/, "");
  const firstMeaningfulLine = withoutComments
    .split(/\r?\n/)
    .find((line) => line.trim().length > 0);

  if (!firstMeaningfulLine) return null;

  const match = firstMeaningfulLine.match(/^\s{0,3}#\s+(.+?)\s*#*\s*$/);
  return match?.[1]?.trim() ?? null;
}

function escapeHeading(title: string): string {
  return title.replace(/([\\`*_{}\[\]<>])/g, "\\$1");
}

function sourceBody(markdown: string): { body: string; startOffset: number } {
  const frontmatterLength = markdown.match(FRONTMATTER_PATTERN)?.[0].length ?? 0;
  const withoutFrontmatter = markdown.slice(frontmatterLength);
  const leadingWhitespaceLength = withoutFrontmatter.match(/^\s+/)?.[0].length ?? 0;
  return {
    body: withoutFrontmatter.slice(leadingWhitespaceLength),
    startOffset: frontmatterLength + leadingWhitespaceLength,
  };
}

function isTopLevelFence(line: string): RegExpMatchArray | null {
  return line.match(/^ {0,3}(`{3,}|~{3,})/);
}

function injectScrollAnchors(
  prepared: string,
  sourceOffsetForPreparedOffset: (preparedOffset: number) => number,
): string {
  const lines = prepared.split("\n");
  const output: string[] = [];
  let preparedOffset = 0;
  let previousBlank = true;
  let openFence: { marker: string; length: number } | null = null;
  let openMathBlock = false;

  lines.forEach((rawLine, index) => {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    const trimmed = line.trim();
    const fence = isTopLevelFence(line);
    const fenceMarker = fence?.[1] ?? "";
    const isFenceClosing = openFence !== null
      && fenceMarker.length > 0
      && fenceMarker.charAt(0) === openFence.marker
      && fenceMarker.length >= openFence.length;
    const isMathDelimiter = /^ {0,3}\$\$\s*$/.test(line);
    const isHeading = /^ {0,3}#{1,6}(?:\s|$)/.test(line);
    const startsTopLevelBlock = trimmed.length > 0
      && openFence === null
      && !openMathBlock
      && !isFenceClosing
      && (previousBlank || isHeading);

    if (startsTopLevelBlock) {
      const sourceOffset = Math.max(0, sourceOffsetForPreparedOffset(preparedOffset));
      output.push(`<div ${SCROLL_ANCHOR_ATTRIBUTE}="${sourceOffset}"></div>`, "");
    }

    output.push(rawLine);

    if (fenceMarker.length > 0) {
      if (isFenceClosing) {
        openFence = null;
      } else if (openFence === null) {
        openFence = { marker: fenceMarker.charAt(0), length: fenceMarker.length };
      }
    } else if (isMathDelimiter && openFence === null) {
      openMathBlock = !openMathBlock;
    }

    previousBlank = trimmed.length === 0;
    preparedOffset += rawLine.length + (index < lines.length - 1 ? 1 : 0);
  });

  return output.join("\n");
}

export function extractSourceHints(markdown: string): SourceHints {
  const mermaid: string[] = [];
  const withoutMermaid = markdown.replace(
    /```mermaid[\t ]*\r?\n([\s\S]*?)```/gi,
    (_full, source: string) => {
      mermaid.push(source.trim());
      return "";
    },
  );

  const math: string[] = [];
  const mathPattern = /\$\$([\s\S]*?)\$\$|(^|[^\\$])\$([^\n$]+?)\$/gm;
  for (const match of withoutMermaid.matchAll(mathPattern)) {
    const source = match[1] ?? match[3];
    if (source) math.push(source.trim());
  }

  return { math, mermaid };
}

export function prepareMarkdown(markdown: string, fileName: string): PreparedMarkdown {
  const source = sourceBody(markdown);
  const body = source.body;
  const title = articleTitleFromFileName(fileName);
  const existingHeading = firstMarkdownHeading(body);
  const hasMatchingHeading = existingHeading === title;
  const generatedTitlePrefix = hasMatchingHeading || !title
    ? ""
    : `# ${escapeHeading(title)}\n\n`;
  const preparedWithoutAnchors = `${generatedTitlePrefix}${body}`;
  const renderMarkdown = injectScrollAnchors(preparedWithoutAnchors, (preparedOffset) => {
    if (preparedOffset < generatedTitlePrefix.length) return 0;
    return source.startOffset + preparedOffset - generatedTitlePrefix.length;
  });

  return {
    markdown: preparedWithoutAnchors,
    renderMarkdown,
    title,
    hints: extractSourceHints(preparedWithoutAnchors),
  };
}
