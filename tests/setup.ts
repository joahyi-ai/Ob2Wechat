function applyCssStyles(
  this: HTMLElement | SVGElement,
  styles: Partial<CSSStyleDeclaration>,
): void {
  Object.assign(this.style, styles);
}

Object.defineProperty(HTMLElement.prototype, "setCssStyles", {
  configurable: true,
  value: applyCssStyles,
});

Object.defineProperty(SVGElement.prototype, "setCssStyles", {
  configurable: true,
  value: applyCssStyles,
});

Object.assign(globalThis, {
  createEl: (tagName: string) => document.createElement(tagName),
  createDiv: () => document.createElement("div"),
  createSpan: () => document.createElement("span"),
  createSvg: (tagName: string) => document.createElementNS("http://www.w3.org/2000/svg", tagName),
});
