import * as ContextMenu from "@radix-ui/react-context-menu";
import * as stylex from "@stylexjs/stylex";
import { colors, layer, media, shadows, space } from "../tokens.stylex.ts";
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

/**
 * The header's link home, the mark alone in the color of the text, with a menu of its own in place
 * of the browser's: a right click, a long press or the keyboard's menu key on the logo opens it at
 * the pointer. It copies the logo as SVG code or downloads the brand assets. Without JavaScript,
 * and until the island is hydrated, the logo is a plain link and the browser's menu opens.
 */
export function LogoMenu({ home, current, name, mark, brandAssets, text }: LogoMenuProps) {
  const code = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.viewBox}"><path fill="#000" fill-rule="evenodd" d="${mark.path}"/></svg>\n`;
  return (
    <ContextMenu.Root modal={false}>
      <ContextMenu.Trigger asChild>
        <a
          {...stylex.props(ui.focusRing, styles.home)}
          href={home}
          aria-current={current ? "page" : undefined}
        >
          <svg {...stylex.props(styles.logo)} viewBox={mark.viewBox} aria-hidden="true">
            <path d={mark.path} fill="currentColor" fill-rule="evenodd" />
          </svg>
          <span {...stylex.props(ui.srOnly)} {...untranslated}>
            {name}
          </span>
        </a>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content {...stylex.props(styles.menu)} aria-label={text.label}>
          <ContextMenu.Item
            {...stylex.props(ui.text, ui.control, styles.item)}
            onSelect={() => {
              // A refused clipboard surfaces as the browser's own unhandled rejection.
              void navigator.clipboard.writeText(code);
            }}
          >
            {text.copy}
          </ContextMenu.Item>
          {/* The download starts from the link itself; choosing it also closes the menu. */}
          <ContextMenu.Item asChild>
            <a
              {...stylex.props(ui.text, ui.control, styles.item)}
              href={brandAssets}
              download="introspectum-brand.zip"
            >
              {text.download}
            </a>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

const styles = stylex.create({
  home: { display: "flex", flexShrink: 0, color: colors.primary },
  /** Four and a half units tall; its width follows from the mark's own proportions (its viewBox). */
  logo: { display: "block", height: `calc(${space.x4} + ${space.half})`, width: "auto" },
  /** A card over the page, raised like the phone menu, without an edge; over everything else. */
  menu: {
    zIndex: layer.popover,
    minWidth: `calc(${space.x20} + ${space.x12})`,
    padding: space.x1,
    borderRadius: space.x1,
    boxShadow: shadows.raised,
    backgroundColor: colors.surface,
    color: colors.primary,
    // Focus rests on the menu only until an item takes it; the items show their own.
    outline: "none",
  },
  /** One line of the menu: the whole width answers the pointer, in the page's own ground. */
  item: {
    display: "block",
    paddingInline: space.x2,
    paddingBlock: space.x1,
    borderRadius: space.half,
    outline: "none",
    // The pointer and the arrow keys move focus from item to item.
    backgroundColor: {
      default: "transparent",
      ":hover": { [media.hover]: colors.bg },
      ":focus": colors.bg,
    },
    color: colors.primary,
    textDecoration: "none",
    cursor: "pointer",
  },
});
