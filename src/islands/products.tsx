import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "preact/hooks";
import { useHydrated } from "./hydrated.ts";
import { caps, colors, grid, media, space, stroke } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

type Entry = { href: string; label: string; current: boolean };

export type ProductsMenuProps = {
  /** The trigger's word: "Products". */
  label: string;
  /** Whether this page is the overview or one of the pages the menu lists. */
  current: boolean;
  /** The product overview, where the trigger leads before hydration & without JavaScript. */
  overview: string;
  /** Each shelf, its title leading to its own overview, then its pages. */
  groups: readonly { title: Entry; links: readonly Entry[] }[];
};

function isEntry(value: unknown): value is Entry {
  if (typeof value !== "object" || value === null) return false;
  if (!("href" in value) || typeof value.href !== "string") return false;
  if (!("label" in value) || typeof value.label !== "string") return false;
  return "current" in value && typeof value.current === "boolean";
}

export function isProductsMenuProps(value: unknown): value is ProductsMenuProps {
  if (typeof value !== "object" || value === null) return false;
  if (!("label" in value) || typeof value.label !== "string") return false;
  if (!("current" in value) || typeof value.current !== "boolean") return false;
  if (!("overview" in value) || typeof value.overview !== "string") return false;
  if (!("groups" in value) || !Array.isArray(value.groups)) return false;
  return value.groups.every(
    (group: unknown) =>
      typeof group === "object" &&
      group !== null &&
      "title" in group &&
      isEntry(group.title) &&
      "links" in group &&
      Array.isArray(group.links) &&
      group.links.every(isEntry),
  );
}

const panelId = "nav-products";

/** How long the panel stays once the pointer leaves, so it can cross the bar to reach it. */
const leaveDelay = 150;

/**
 * The header's "Products", with a chevron, as on vercel.com: the pointer resting on it, a click
 * or the keyboard opens a panel the width of the page under the header, every product & the
 * research by shelf, over the page dimmed to half. It closes when the pointer leaves both, on
 * Escape, on a click outside, or once focus leaves it. Until hydrated, & without JavaScript, it is
 * a plain link to the product overview.
 */
export function ProductsMenu({ label, current, overview, groups }: ProductsMenuProps) {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const leaving = useRef<number | null>(null);

  function stay() {
    if (leaving.current === null) return;
    window.clearTimeout(leaving.current);
    leaving.current = null;
  }

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      if (event.target instanceof Node && root.current?.contains(event.target) === true) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => stay, []);

  const words = (
    <>
      {label}
      <svg
        {...stylex.props(styles.chevron, open && styles.chevronOpen)}
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M4.5 6.25 8 9.75l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </>
  );
  const look = [
    ui.small,
    ui.quiet,
    ui.control,
    ui.focusRing,
    ui.navLink,
    styles.trigger,
    current && styles.current,
    open && styles.open,
  ];

  if (!hydrated)
    return (
      <div {...stylex.props(styles.root)}>
        <a {...stylex.props(look)} href={overview} aria-current={current ? "true" : undefined}>
          {words}
        </a>
      </div>
    );

  return (
    <div
      {...stylex.props(styles.root)}
      ref={root}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        stay();
        setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        stay();
        leaving.current = window.setTimeout(() => setOpen(false), leaveDelay);
      }}
      onFocusOut={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && root.current?.contains(next) === true) return;
        setOpen(false);
      }}
    >
      <button
        {...stylex.props(ui.reset, look)}
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((was) => !was)}
      >
        {words}
      </button>
      <div {...stylex.props(styles.panel, !open && styles.closed)} id={panelId}>
        <div {...stylex.props(ui.container, styles.groups)}>
          {groups.map(({ title, links }) => (
            <div key={title.href} {...stylex.props(styles.group)}>
              <a
                {...stylex.props(ui.small, ui.quiet, ui.control, ui.focusRing, styles.title)}
                href={title.href}
                aria-current={title.current ? "page" : undefined}
              >
                {title.label}
              </a>
              <ul {...stylex.props(styles.list)}>
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      {...stylex.props(
                        ui.text,
                        ui.entry,
                        ui.control,
                        ui.focusRing,
                        styles.link,
                        link.current && ui.current,
                      )}
                      href={link.href}
                      aria-current={link.current ? "page" : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = stylex.create({
  root: { display: "contents" },
  /** As the header's other links (`src/layout.tsx`), the chevron a hair after the word. */
  trigger: {
    display: "flex",
    alignItems: "center",
    columnGap: "3px",
    // The chevron's drawing leaves 3.75 of its 16 units free at its right: take that off the
    // padding, so its ink stands as far from the next word as one word from the next.
    paddingInlineEnd: `calc(${space.x1} + ${space.half} - 0.875rem * 3.75 / 16)`,
  },
  /** The page it is on, or one it lists: underlined, as the header's other links. */
  current: { textDecorationLine: "underline" },
  /** Open: in full ink, as under the pointer. */
  open: { color: colors.primary },
  /** As tall as the word's capitals & descenders: the small text's size. */
  chevron: { display: "block", width: "0.875rem", height: "0.875rem", flexShrink: 0 },
  chevronOpen: { rotate: "180deg" },
  /**
   * Under the header, the width of the page, on the page's ground with a hairline under it. A
   * shadow wider than any window dims the page below to half, cut off above the panel's top so
   * the header stays as it is.
   */
  panel: {
    position: "absolute",
    top: "100%",
    insetInline: 0,
    display: "block",
    backgroundColor: colors.bg,
    boxShadow: `0 ${stroke.width} 0 ${colors.hairline}, 0 0 0 100vmax color-mix(in oklch, ${colors.bg} 50%, transparent)`,
    clipPath: "inset(0 0 -100vmax 0)",
  },
  closed: { display: "none" },
  /** The shelves on the page grid, three columns each, from the page's left column line. */
  groups: {
    display: "grid",
    gridTemplateColumns: grid.columns,
    columnGap: grid.gutter,
    paddingTop: space.x3,
    paddingBottom: space.x4,
  },
  group: { gridColumn: { default: "span 6", [media.wide]: "span 3" } },
  title: { display: "block", width: "fit-content", marginBottom: space.x1 },
  list: { listStyle: "none" },
  link: { display: "flex", alignItems: "center", height: caps.x2_75, width: "fit-content" },
});
