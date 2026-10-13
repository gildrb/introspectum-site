/**
 * The header logo's own menu, in place of the browser's: a right click, a long press or the
 * keyboard's menu key on the logo opens it, always in the same place, under the logo. It copies
 * the logo as SVG code or downloads the brand assets. The menu is a popover (`styles.logoMenu`,
 * src/layout.tsx): a click elsewhere or Escape closes it, and closing it hands focus back to the
 * logo if it was in the menu.
 */
export function logoMenu(logo: HTMLAnchorElement, menu: HTMLElement): void {
  const items = [...menu.querySelectorAll<HTMLElement>("[role=menuitem]")];
  const copy = menu.querySelector<HTMLButtonElement>("[data-copy-logo]");
  const svg = logo.querySelector("svg");
  const path = svg?.querySelector("path");
  const viewBox = svg?.getAttribute("viewBox");
  const d = path?.getAttribute("d");
  if (
    copy === null ||
    svg === null ||
    viewBox === null ||
    viewBox === undefined ||
    d === null ||
    d === undefined
  )
    throw new Error("The header logo or its menu is missing a part.");
  const code = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="#000" fill-rule="evenodd" d="${d}"/></svg>\n`;

  logo.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    // Under the logo, its left edge on the mark's; the gap is the menu's own margin.
    const box = svg.getBoundingClientRect();
    menu.style.left = `${box.left}px`;
    menu.style.top = `${box.bottom}px`;
    if (!menu.matches(":popover-open")) menu.showPopover();
    // The menu key and Shift+F10 report no pointer: from the keyboard, the first item takes
    // focus; from a pointer, the menu itself, so no item looks chosen before the pointer reaches
    // it, and the arrow keys still work.
    if (event instanceof PointerEvent && event.pointerType === "") items[0]?.focus();
    else menu.focus();
  });

  menu.addEventListener("keydown", (event) => {
    const at = items.findIndex((item) => item === document.activeElement);
    const next =
      event.key === "ArrowDown"
        ? (at + 1) % items.length
        : event.key === "ArrowUp"
          ? (at <= 0 ? items.length : at) - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    items[next]?.focus();
  });

  menu.addEventListener("toggle", (event) => {
    if (
      event instanceof ToggleEvent &&
      event.newState === "closed" &&
      menu.contains(document.activeElement)
    )
      logo.focus();
  });

  copy.addEventListener("click", () => {
    void navigator.clipboard.writeText(code).finally(() => menu.hidePopover());
  });

  // The download starts from the link itself; the menu only gets out of the way.
  for (const item of items)
    if (item !== copy) item.addEventListener("click", () => menu.hidePopover());
}
