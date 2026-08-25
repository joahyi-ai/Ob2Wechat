import { App, requestUrl, TFile } from "obsidian";
import { arrayBufferToDataUrl, imageMimeFromPath, normalizeImageMime } from "./mime";
import { rasterizeSvgDataUrl } from "./rasterizeSvg";

export interface ConversionWarning {
  kind: "image" | "math" | "mermaid" | "clipboard";
  source: string;
  message: string;
}

function canonicalUrl(value: string): string {
  try {
    return decodeURI(value.split(/[?#]/, 1)[0] ?? value);
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value;
  }
}

function localResourceMap(app: App): Map<string, TFile> {
  const resources = new Map<string, TFile>();
  app.vault.getFiles().forEach((file) => {
    const resourcePath = app.vault.getResourcePath(file);
    resources.set(canonicalUrl(resourcePath), file);
    resources.set(resourcePath, file);
  });
  return resources;
}

function resolveLocalFile(
  app: App,
  resources: Map<string, TFile>,
  source: string,
  sourcePath: string,
): TFile | null {
  const exact = resources.get(source) ?? resources.get(canonicalUrl(source));
  if (exact) return exact;

  if (!/^[a-z][a-z\d+.-]*:/i.test(source)) {
    return app.metadataCache.getFirstLinkpathDest(decodeURI(source), sourcePath);
  }

  return null;
}

function responseContentType(headers: Record<string, string>): string | undefined {
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === "content-type");
  return entry?.[1];
}

async function readLocalImage(app: App, file: TFile): Promise<{ data: ArrayBuffer; mime: string }> {
  const data = await app.vault.readBinary(file);
  return { data, mime: imageMimeFromPath(file.path) };
}

async function readRemoteImage(source: string): Promise<{ data: ArrayBuffer; mime: string }> {
  const response = await requestUrl({
    url: source,
    method: "GET",
    throw: false,
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}`);
  }
  return {
    data: response.arrayBuffer,
    mime: normalizeImageMime(responseContentType(response.headers), source),
  };
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  work: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item !== undefined) await work(item, index);
    }
  });
  await Promise.all(workers);
}

export async function embedArticleImages(
  app: App,
  root: HTMLElement,
  sourcePath: string,
): Promise<ConversionWarning[]> {
  const warnings: ConversionWarning[] = [];
  const resources = localResourceMap(app);
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));

  await mapWithConcurrency(images, 4, async (image) => {
    const originalSource = image.getAttribute("src")?.trim() ?? "";
    if (!originalSource || originalSource.startsWith("data:")) return;

    try {
      const local = resolveLocalFile(app, resources, originalSource, sourcePath);
      const binary = local
        ? await readLocalImage(app, local)
        : await readRemoteImage(originalSource);
      let dataUrl = await arrayBufferToDataUrl(binary.data, binary.mime);
      if (binary.mime === "image/svg+xml") {
        dataUrl = await rasterizeSvgDataUrl(dataUrl);
      }
      image.setAttribute("src", dataUrl);
    } catch (error) {
      warnings.push({
        kind: "image",
        source: originalSource,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return warnings;
}
