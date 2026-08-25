const nextFrame = (): Promise<void> => new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

async function waitForDomQuiet(root: HTMLElement, quietMs = 120, timeoutMs = 3000): Promise<void> {
  await new Promise<void>((resolve) => {
    let finished = false;
    let quietTimer: number;
    let maxTimer: number;

    const finish = (): void => {
      if (finished) return;
      finished = true;
      window.clearTimeout(quietTimer);
      window.clearTimeout(maxTimer);
      observer.disconnect();
      resolve();
    };

    const resetQuietTimer = (): void => {
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(finish, quietMs);
    };

    const observer = new MutationObserver(resetQuietTimer);
    observer.observe(root, { childList: true, subtree: true, attributes: true });
    maxTimer = window.setTimeout(finish, timeoutMs);
    resetQuietTimer();
  });
}

async function waitForImages(root: HTMLElement, timeoutMs = 1800): Promise<void> {
  const pending = Array.from(root.querySelectorAll<HTMLImageElement>("img"))
    .filter((image) => !image.complete)
    .map(async (image) => {
      try {
        await image.decode();
      } catch {
        // Preview may still use a temporarily unavailable remote URL.
      }
    });

  if (pending.length === 0) return;

  await Promise.race([
    Promise.allSettled(pending).then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}

export async function awaitRenderStable(root: HTMLElement): Promise<void> {
  await nextFrame();
  await nextFrame();
  await waitForDomQuiet(root);
  await waitForImages(root);
  await nextFrame();
}
