const MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export function imageMimeFromPath(path: string, fallback = "image/png"): string {
  const cleanPath = path.split(/[?#]/, 1)[0] ?? path;
  const extension = cleanPath.slice(cleanPath.lastIndexOf(".") + 1).toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? fallback;
}

export function normalizeImageMime(contentType: string | undefined, path: string): string {
  const normalized = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  return normalized?.startsWith("image/") ? normalized : imageMimeFromPath(path);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to encode image as a data URL"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to encode image"));
    reader.readAsDataURL(blob);
  });
}

export async function arrayBufferToDataUrl(data: ArrayBuffer, mimeType: string): Promise<string> {
  return await blobToDataUrl(new Blob([data], { type: mimeType }));
}
