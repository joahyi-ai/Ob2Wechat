export interface SourceHints {
  math: string[];
  mermaid: string[];
}

export interface PreparedMarkdown {
  markdown: string;
  title: string;
  hints: SourceHints;
}

const FRONTMATTER_PATTERN = /^\uFEFF?---[\t ]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[\t ]*(?:\r?\n|$)/;

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
  const body = stripFrontmatter(markdown).replace(/^\s+/, "");
  const title = articleTitleFromFileName(fileName);
  const existingHeading = firstMarkdownHeading(body);
  const hasMatchingHeading = existingHeading === title;
  const prepared = hasMatchingHeading || !title
    ? body
    : `# ${escapeHeading(title)}\n\n${body}`;

  return {
    markdown: prepared,
    title,
    hints: extractSourceHints(prepared),
  };
}
