import type { ConversionWarning } from "./embedImages";
import { rasterizeSvgElement } from "./rasterizeSvg";

function imageElement(source: string, alt: string, style: string): HTMLImageElement {
  const image = document.createElement("img");
  image.src = source;
  image.alt = alt;
  image.setAttribute("style", style);
  return image;
}

function fallbackCode(source: string, block: boolean): HTMLElement {
  const element = document.createElement(block ? "pre" : "code");
  element.textContent = block ? source : `$${source}$`;
  element.setAttribute(
    "style",
    block
      ? "display:block;margin:20px 0;padding:12px;background:#f6f8fa;border:1px solid #e6e8eb;border-radius:6px;white-space:pre-wrap"
      : "display:inline;padding:2px 4px;background:#f0f7f2;border-radius:3px",
  );
  return element;
}

async function replaceMath(root: HTMLElement, warnings: ConversionWarning[]): Promise<void> {
  const containers = Array.from(root.querySelectorAll<HTMLElement>("mjx-container"));
  for (const container of containers) {
    const svg = container.querySelector<SVGSVGElement>("svg");
    if (!svg) continue;
    const source = container.getAttribute("data-ob2wechat-source") ?? "数学公式";
    const block = container.getAttribute("display") === "true" || container.classList.contains("MathJax_Display");
    try {
      const dataUrl = await rasterizeSvgElement(svg, 2.5);
      const image = imageElement(
        dataUrl,
        source,
        block
          ? "display:block;max-width:100%;height:auto;margin:22px auto"
          : "display:inline-block;max-width:100%;height:1.25em;width:auto;margin:0 0.08em;vertical-align:-0.2em",
      );
      container.replaceWith(image);
    } catch (error) {
      container.replaceWith(fallbackCode(source, block));
      warnings.push({
        kind: "math",
        source,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function replaceMermaid(root: HTMLElement, warnings: ConversionWarning[]): Promise<void> {
  const containers = Array.from(root.querySelectorAll<HTMLElement>(".mermaid"));
  for (const container of containers) {
    const svg = container.querySelector<SVGSVGElement>("svg");
    const source = container.getAttribute("data-ob2wechat-source") ?? "Mermaid diagram";
    if (!svg) {
      warnings.push({ kind: "mermaid", source, message: "Diagram SVG was not generated" });
      continue;
    }
    try {
      const dataUrl = await rasterizeSvgElement(svg, 2);
      container.replaceWith(
        imageElement(dataUrl, "Mermaid diagram", "display:block;width:100%;max-width:100%;height:auto;margin:24px auto"),
      );
    } catch (error) {
      const fallback = fallbackCode(`\`\`\`mermaid\n${source}\n\`\`\``, true);
      container.replaceWith(fallback);
      warnings.push({
        kind: "mermaid",
        source,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export async function embedGeneratedMedia(root: HTMLElement): Promise<ConversionWarning[]> {
  const warnings: ConversionWarning[] = [];
  await replaceMath(root, warnings);
  await replaceMermaid(root, warnings);
  return warnings;
}
