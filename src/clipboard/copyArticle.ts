import { App } from "obsidian";
import { makeWechatCompatible } from "../compatibility/wechatCompat";
import { sanitizeArticle } from "../compatibility/sanitizeHtml";
import { embedGeneratedMedia } from "../media/embedGeneratedMedia";
import { embedArticleImages, type ConversionWarning } from "../media/embedImages";
import { applyWechatTheme } from "../theme/wechatTheme";

export interface CopyPayload {
  html: string;
  text: string;
  warnings: ConversionWarning[];
}

export async function createCopyPayload(
  app: App,
  renderedArticle: HTMLElement,
  sourcePath: string,
): Promise<CopyPayload> {
  const article = renderedArticle.cloneNode(true) as HTMLElement;
  const generatedWarnings = await embedGeneratedMedia(article);
  const imageWarnings = await embedArticleImages(app, article, sourcePath);
  applyWechatTheme(article);
  makeWechatCompatible(article);
  sanitizeArticle(article);

  return {
    html: article.outerHTML.replace(/(<\/(?:strong|b|em|span|a|code)>)\s*([：；，。！？、])/g, "$1\u2060$2"),
    text: article.innerText,
    warnings: [...generatedWarnings, ...imageWarnings],
  };
}

async function writeWithWebClipboard(payload: CopyPayload): Promise<void> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Web Clipboard API is unavailable");
  }
  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([payload.html], { type: "text/html;charset=utf-8" }),
      "text/plain": new Blob([payload.text], { type: "text/plain;charset=utf-8" }),
    }),
  ]);
}

function writeWithElectronClipboard(payload: CopyPayload): void {
  const requireFunction = (window as Window & { require?: (name: string) => unknown }).require;
  if (!requireFunction) throw new Error("Electron clipboard is unavailable");
  const electron = requireFunction("electron") as {
    clipboard?: { write: (data: { html: string; text: string }) => void };
  };
  if (!electron.clipboard) throw new Error("Electron clipboard is unavailable");
  electron.clipboard.write({ html: payload.html, text: payload.text });
}

export async function writeCopyPayload(payload: CopyPayload): Promise<void> {
  try {
    await writeWithWebClipboard(payload);
  } catch (webError) {
    try {
      writeWithElectronClipboard(payload);
    } catch (electronError) {
      const webMessage = webError instanceof Error ? webError.message : String(webError);
      const electronMessage = electronError instanceof Error ? electronError.message : String(electronError);
      throw new Error(`${webMessage}; ${electronMessage}`);
    }
  }
}
