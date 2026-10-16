import * as Menu from "@radix-ui/react-menu";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "preact/hooks";
import { colors, layer, media, space, stroke } from "../tokens.stylex.ts";
import { ui, untranslated } from "../ui.tsx";

const textKeys = ["label", "copy", "download"] as const;

export type LogoMenuProps = {
  /** The homepage in the page's language, where the logo leads. */
  home: string;
  /** Whether this page is that homepage. */
  current: boolean;
  /** The company's name, read out in place of the mark. */
  name: string;
  /** The mark's drawing (`src/logo.svg`), drawn here and copied as is. */
  mark: { viewBox: string; path: string };
  /** The brand assets' archive, at its stamped address. */
  brandAssets: string;
  text: Readonly<Record<(typeof textKeys)[number], string>>;
};

export function isLogoMenuProps(value: unknown): value is LogoMenuProps {
  if (typeof value !== "object" || value === null) return false;
  if (!("home" in value) || typeof value.home !== "string") return false;
  if (!("current" in value) || typeof value.current !== "boolean") return false;
  if (!("name" in value) || typeof value.name !== "string") return false;
  if (!("brandAssets" in value) || typeof value.brandAssets !== "string") return false;
  if (!("mark" in value) || typeof value.mark !== "object" || value.mark === null) return false;
  const { mark } = value;
  if (!("viewBox" in mark) || typeof mark.viewBox !== "string") return false;
  if (!("path" in mark) || typeof mark.path !== "string") return false;
  if (!("text" in value) || typeof value.text !== "object" || value.text === null) return false;
  const { text } = value;
  return textKeys.every((key) => key in text && typeof Reflect.get(text, key) === "string");
}

/** How long a finger rests on the logo before its menu opens, as Radix's context menu waits. */
const longPress = 700;

/**
 * The header's link home, the mark alone, with a menu of its own in place of the browser's, as on
 * vercel.com: a right click, a long press or the keyboard's menu key on the logo opens it in one
 * place, under the mark & aligned with it, wherever the logo was pressed. It copies the logo as SVG
 * code or downloads the brand assets. Without JavaScript, and until the island is hydrated, the
 * logo is a plain link and the browser's menu opens.
 */
export function LogoMenu({ home, current, name, mark, brandAssets, text }: LogoMenuProps) {
  const code = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.viewBox}"><path fill="#000" fill-rule="evenodd" d="${mark.path}"/></svg>\n`;
  const [open, setOpen] = useState(false);
  const pressing = useRef<number | null>(null);

  function release() {
    if (pressing.current === null) return;
    window.clearTimeout(pressing.current);
    pressing.current = null;
  }
  useEffect(() => release, []);

  return (
    <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
      <Menu.Anchor asChild>
        <a
          {...stylex.props(ui.focusRing, styles.home)}
          href={home}
          aria-current={current ? "page" : undefined}
          onContextMenu={(event) => {
            event.preventDefault();
            release();
            setOpen(true);
          }}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse") return;
            release();
            pressing.current = window.setTimeout(() => setOpen(true), longPress);
          }}
          onPointerMove={release}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <svg {...stylex.props(styles.logo)} viewBox={mark.viewBox} aria-hidden="true">
            <path d={mark.path} fill="currentColor" fill-rule="evenodd" />
          </svg>
          <span {...stylex.props(ui.srOnly)} {...untranslated}>
            {name}
          </span>
        </a>
      </Menu.Anchor>
      <Menu.Portal>
        <Menu.Content
          {...stylex.props(styles.menu)}
          aria-label={text.label}
          side="bottom"
          align="start"
          sideOffset={8}
          alignOffset={-8}
          loop
        >
          <Menu.Item
            {...stylex.props(ui.small, ui.control, styles.item, styles.tile)}
            onSelect={() => {
              // A refused clipboard surfaces as the browser's own unhandled rejection.
              void navigator.clipboard.writeText(code);
            }}
          >
            <span {...stylex.props(styles.preview)}>
              <svg {...stylex.props(styles.previewMark)} viewBox={mark.viewBox} aria-hidden="true">
                <path d={mark.path} fill="currentColor" fill-rule="evenodd" />
              </svg>
            </span>
            {text.copy}
          </Menu.Item>
          <Menu.Separator {...stylex.props(styles.separator)} />
          {/* The download starts from the link itself; choosing it also closes the menu. */}
          <Menu.Item asChild>
            <a
              {...stylex.props(ui.small, ui.control, styles.item, styles.row)}
              href={brandAssets}
              download="introspectum-brand.zip"
            >
              <svg {...stylex.props(styles.icon)} viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M8 2v8m-3.5-3.5L8 10l3.5-3.5M2.75 10.5v2.75h10.5V10.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
              </svg>
              {text.download}
            </a>
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

const appear = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

const styles = stylex.create({
  home: {
    display: "flex",
    flexShrink: 0,
    color: colors.primary,
    // A long press opens the logo's own menu, not the phone's preview of the link.
    WebkitTouchCallout: "none",
  },
  /**
   * Four and a half units tall; its width follows from the mark's own proportions (its viewBox).
   * It only holds the link's place: the mark shows through the header's ground (`src/layout.tsx`),
   * the page inverted. A browser that cannot cut that hole draws it here, in the text's color.
   */
  logo: {
    display: "block",
    height: `calc(${space.x4} + ${space.half})`,
    width: "auto",
    visibility: { default: "hidden", "@supports not (mask-composite: exclude)": "visible" },
  },
  /**
   * A card on the page's own ground with a hairline edge & no shadow, as vercel.com's logo menu,
   * fading in; over everything else.
   */
  menu: {
    zIndex: layer.popover,
    width: `calc(${space.x20} + ${space.x12} + ${space.x4})`,
    maxWidth: `calc(100vw - ${space.x4})`,
    padding: "6px",
    borderWidth: stroke.width,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: `calc(${space.x1} + ${space.half})`,
    backgroundColor: colors.bg,
    color: colors.primary,
    // Focus rests on the menu only until an item takes it; the items show their own.
    outline: "none",
    animationName: { default: null, "@media (prefers-reduced-motion: no-preference)": appear },
    animationDuration: "100ms",
    animationTimingFunction: "ease-out",
  },
  /** One choice: the whole of it answers the pointer & the arrow keys, on a shade of its own. */
  item: {
    borderRadius: "6px",
    outline: "none",
    backgroundColor: {
      default: "transparent",
      ":hover": { [media.hover]: colors.surface },
      ":focus": colors.surface,
    },
    color: colors.primary,
    textDecoration: "none",
    cursor: "pointer",
  },
  /** The mark to copy, shown in a well, its name under it. */
  tile: { display: "flex", flexDirection: "column", rowGap: space.x1, padding: space.x1 },
  preview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: space.x6,
    borderWidth: stroke.width,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: "6px",
    backgroundColor: colors.surface,
  },
  previewMark: { display: "block", height: space.x3, width: "auto" },
  separator: {
    height: stroke.width,
    marginBlock: "6px",
    marginInline: "-6px",
    backgroundColor: colors.hairline,
  },
  /** A plain choice: an icon, then its words. */
  row: {
    display: "flex",
    alignItems: "center",
    columnGap: space.x1,
    height: `calc(${space.x4} + ${space.half})`,
    paddingInline: `calc(${space.x1} + ${space.half})`,
  },
  icon: { display: "block", width: space.x2, height: space.x2, flexShrink: 0 },
});
