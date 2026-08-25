const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 360;
const MAX_DIMENSION = 4096;
const LOAD_TIMEOUT_MS = 5000;

function parseDimension(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function svgDimensions(svg: SVGSVGElement): { width: number; height: number } {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox?.baseVal;
  const width = rect.width
    || parseDimension(svg.getAttribute("width"))
    || (viewBox?.width ? viewBox.width : DEFAULT_WIDTH);
  const height = rect.height
    || parseDimension(svg.getAttribute("height"))
    || (viewBox?.height ? viewBox.height : DEFAULT_HEIGHT);
  return { width, height };
}

async function loadImage(source: string): Promise<HTMLImageElement> {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error("Timed out while rasterizing SVG")), LOAD_TIMEOUT_MS);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Unable to decode SVG"));
    };
    image.src = source;
  });
}

function drawImageToPng(image: HTMLImageElement, width: number, height: number, scale = 2): string {
  const fittedScale = Math.min(scale, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * fittedScale));
  canvas.height = Math.max(1, Math.round(height * fittedScale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.scale(fittedScale, fittedScale);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

function numericAttribute(element: Element, name: string): number {
  return parseDimension(element.getAttribute(name)) ?? 0;
}

/**
 * Chromium deliberately taints a canvas after drawing an SVG that contains a
 * foreignObject. Mermaid uses foreignObject for its HTML labels, so the image
 * looks correct in Obsidian but canvas.toDataURL() is then forbidden. Replace
 * those HTML labels with ordinary SVG text before rasterising the copy-only
 * clone. The live preview DOM is never changed.
 */
function replaceForeignObjects(svg: SVGSVGElement): void {
  const foreignObjects = Array.from(svg.querySelectorAll<SVGForeignObjectElement>("foreignObject"));
  for (const foreignObject of foreignObjects) {
    const label = foreignObject.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!label) {
      foreignObject.remove();
      continue;
    }

    const x = numericAttribute(foreignObject, "x");
    const y = numericAttribute(foreignObject, "y");
    const width = numericAttribute(foreignObject, "width");
    const height = numericAttribute(foreignObject, "height");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = label;
    text.setAttribute("x", String(x + width / 2));
    text.setAttribute("y", String(y + height / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("fill", "currentColor");
    text.setAttribute("font-family", "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif");
    text.setAttribute("font-size", "14");
    foreignObject.replaceWith(text);
  }
}

export async function rasterizeSvgElement(svg: SVGSVGElement, scale = 2): Promise<string> {
  const { width, height } = svgDimensions(svg);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.style.color = getComputedStyle(svg).color || "#333333";
  clone.style.backgroundColor = "transparent";

  replaceForeignObjects(clone);

  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  const serialized = new XMLSerializer().serializeToString(clone);
  const blobUrl = URL.createObjectURL(new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await loadImage(blobUrl);
    return drawImageToPng(image, width, height, scale);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function rasterizeSvgDataUrl(dataUrl: string, scale = 2): Promise<string> {
  const image = await loadImage(dataUrl);
  const width = image.naturalWidth || DEFAULT_WIDTH;
  const height = image.naturalHeight || DEFAULT_HEIGHT;
  return drawImageToPng(image, width, height, scale);
}
