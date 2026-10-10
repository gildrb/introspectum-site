import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import type { Tag, Translator } from "./i18n.ts";
import type { Citation, Illustration } from "./site.ts";
import { colors, media, space } from "./tokens.stylex.ts";
import { type Style, ui } from "./ui.tsx";
import { imageSize, versioned } from "./versioned.ts";

/**
 * The parts every page is built from: an opening (`Hero`), sections, cards, buttons and a closing
 * call to action. Pages lay them out; `layout.tsx` wraps them in the header and footer.
 *
 * They keep one grid and one rhythm. Everything starts on the container's left edge, the first
 * column line; titles are eight columns wide and text seven (`ui.titleWidth`, `ui.textWidth`);
 * cards run two or three to a row on the same gutter; a figure takes the last four columns beside
 * the text. Vertically, space grows with distance in meaning, so what belongs together reads as
 * one: a lead sits three units under its title, the buttons four units under the lead, a
 * section's content six units under its intro, and one part of the page twenty units under the
 * part before (twelve on phones).
 */

/**
 * A page's opening: the title, the lead under it, then whatever follows (more text, actions). A
 * `figure` stands beside it on wide screens and under it on narrower ones.
 */
export function Hero({
  title,
  lead,
  figure,
  children,
}: {
  title: ComponentChildren;
  lead?: ComponentChildren;
  figure?: ComponentChildren;
  children?: ComponentChildren;
}) {
  return (
    <header {...stylex.props(ui.container, styles.opening, figure !== undefined && styles.beside)}>
      <div {...stylex.props(styles.besideText)}>
        <h1 {...stylex.props(ui.display, ui.titleWidth)}>{title}</h1>
        {lead !== undefined && <p {...stylex.props(ui.lead, ui.textWidth, styles.lead)}>{lead}</p>}
        {children !== undefined && (
          <div {...stylex.props(ui.textWidth, styles.stack, styles.afterHeroLead)}>{children}</div>
        )}
      </div>
      {figure !== undefined && <div {...stylex.props(styles.besideFigure)}>{figure}</div>}
    </header>
  );
}

/**
 * A part of a page under its own heading. A `figure` stands beside it on wide screens, so its
 * content must stay in the text width (`Measure`, not `Cards`).
 */
export function Section({
  id,
  title,
  intro,
  figure,
  children,
}: {
  id: string;
  title: ComponentChildren;
  intro?: ComponentChildren;
  figure?: ComponentChildren;
  children?: ComponentChildren;
}) {
  return (
    <section
      {...stylex.props(ui.container, styles.part, figure !== undefined && styles.beside)}
      aria-labelledby={id}
    >
      <div {...stylex.props(styles.besideText)}>
        <h2 {...stylex.props(ui.heading, ui.titleWidth)} id={id}>
          {title}
        </h2>
        {intro !== undefined && (
          <p {...stylex.props(ui.lead, ui.textWidth, styles.lead)}>{intro}</p>
        )}
        {children !== undefined && <div {...stylex.props(styles.afterLead)}>{children}</div>}
      </div>
      {figure !== undefined && <div {...stylex.props(styles.besideFigure)}>{figure}</div>}
    </section>
  );
}

/** Full-width content right after the opening: cards, a list of posts. */
export function Content({ children }: { children: ComponentChildren }) {
  return <div {...stylex.props(ui.container, styles.afterOpening)}>{children}</div>;
}

/** Cards side by side on the grid: up to `columns` on wide screens, two on tablets, one on phones. */
export function Cards({ columns, children }: { columns: 2 | 3; children: ComponentChildren }) {
  return (
    <ul {...stylex.props(styles.cards, columns === 3 ? styles.threeColumns : styles.twoColumns)}>
      {children}
    </ul>
  );
}

/** One card: a panel on the card ground whose parts stack two units apart, under its figure. */
export function Card({
  figure,
  children,
}: {
  figure?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <li {...stylex.props(styles.card)}>
      {figure !== undefined && <div {...stylex.props(styles.cardFigure)}>{figure}</div>}
      {children}
    </li>
  );
}

/** Buttons and links in a row, wrapping where the row is too narrow. */
export function Actions({ children }: { children: ComponentChildren }) {
  return <div {...stylex.props(styles.actions)}>{children}</div>;
}

type ButtonKind = "primary" | "secondary";

const buttonKinds: Readonly<Record<ButtonKind, Style>> = {
  primary: ui.primary,
  secondary: ui.secondary,
};

/** A link shaped as a button: `primary` for the one main action, `secondary` beside it. */
export function ButtonLink({
  href,
  kind,
  children,
}: {
  href: string;
  kind: ButtonKind;
  children: ComponentChildren;
}) {
  return (
    <a {...stylex.props(ui.button, buttonKinds[kind], ui.focusRing)} href={href}>
      {children}
    </a>
  );
}

/** Running text. `quiet` sets it one step down the gray ladder, never lower (see `colors`). */
export function Text({
  quiet = false,
  children,
}: {
  quiet?: boolean;
  children: ComponentChildren;
}) {
  return <p {...stylex.props(ui.prose, quiet && ui.label)}>{children}</p>;
}

/** Blocks of text in the text width, two units apart. */
export function Measure({ children }: { children: ComponentChildren }) {
  return <div {...stylex.props(ui.textWidth, styles.stack)}>{children}</div>;
}

/** Where a figure stands: beside a text, with its credit under it, or atop a card, without. */
type Placement = "beside" | "card";

/**
 * An illustration from an old book (`Illustration`), in AVIF, WebP and JPEG at its two widths.
 * The scans are black lines on white: in light mode they multiply into the ground they lie on,
 * page or card, and in dark mode, inverted, they screen onto it. So the lines print in ink on the
 * paper, or in paper on the umber, and the figure never shows a box of its own. A card's figure
 * leaves its credit to the product's page, where the same figure carries it.
 */
export function Figure({
  illustration,
  alt,
  placement,
  priority = false,
}: {
  illustration: Illustration;
  alt: string;
  placement: Placement;
  /** The opening's figure: fetched at once, not when scrolled near. */
  priority?: boolean;
}) {
  const { file, widths, by, work, lang, year, holding, url } = illustration;
  const path = (width: number, format: "avif" | "webp" | "jpg"): `/${string}` =>
    `/images/illustrations/${file}-${width}.${format}`;
  const srcset = (format: "avif" | "webp" | "jpg") =>
    widths.map((width) => `${versioned(path(width, format))} ${width}w`).join(", ");
  const [small, large] = widths;
  const { width, height } = imageSize(path(large, "jpg"));
  // Four columns beside text, or a card's width, on wide screens; about half the page on tablets.
  const sizes = "(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw";
  const picture = (
    <picture>
      <source type="image/avif" srcset={srcset("avif")} sizes={sizes} />
      <source type="image/webp" srcset={srcset("webp")} sizes={sizes} />
      <img
        {...stylex.props(styles.ink, placement === "card" ? styles.inCard : styles.inText)}
        src={versioned(path(small, "jpg"))}
        srcset={srcset("jpg")}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </picture>
  );
  switch (placement) {
    case "card":
      return picture;
    case "beside":
      return (
        <figure>
          {picture}
          <figcaption {...stylex.props(ui.small, ui.note, styles.caption)}>
            {`${by}, `}
            <a
              {...stylex.props(ui.link, ui.focusRing)}
              href={url}
              lang={lang}
              target="_blank"
              rel="noopener noreferrer"
            >
              {work}
            </a>
            {holding === undefined ? `, ${year}.` : `, ${year}. ${holding}.`}
          </figcaption>
        </figure>
      );
    default: {
      const _: never = placement;
      return _;
    }
  }
}

/** A source's number after the claim it backs, linked to its entry in the page's sources. */
export function Cite({ number, label }: { number: number; label: string }) {
  return (
    <sup {...stylex.props(ui.sans, styles.cite)}>
      <a
        {...stylex.props(ui.focusRing, styles.citeLink)}
        href={`#source-${number}`}
        aria-label={label}
      >
        {number}
      </a>
    </sup>
  );
}

/**
 * The tags for `t.rich` that cite a page's sources: each is named by a source's ID and sets its
 * number after the words it wraps, so `<prusti>Prusti</prusti>` reads "Prusti" and a raised 4.
 */
export function citeTags(
  t: Translator,
  citations: readonly Citation[],
): Readonly<Record<string, Tag>> {
  return Object.fromEntries(
    citations.map(({ id, number }): [string, Tag] => [
      id,
      (chunks) => (
        <>
          {chunks}
          <Cite number={number} label={t.text("cite_label", { number })} />
        </>
      ),
    ]),
  );
}

/**
 * The works a page cites, numbered as `Cite` marks them: who, the title (linked, in its own
 * language), where and when. End matter, after everything else on the page.
 */
export function Sources({
  id,
  title,
  list,
}: {
  id: string;
  title: string;
  list: readonly Citation[];
}) {
  return (
    <section {...stylex.props(ui.container, styles.endMatter)} aria-labelledby={id}>
      <h2 {...stylex.props(ui.title)} id={id}>
        {title}
      </h2>
      <ol {...stylex.props(ui.small, ui.textWidth, styles.sources)}>
        {list.map(({ number, source }) => {
          const where = [source.in, source.year === undefined ? undefined : String(source.year)];
          const details = where.filter((part): part is string => part !== undefined);
          return (
            <li {...stylex.props(styles.source)} id={`source-${number}`}>
              <span {...stylex.props(styles.sourceNumber)}>{number}</span>
              <span {...stylex.props(ui.label)}>
                {`${source.by}: `}
                <a
                  {...stylex.props(ui.link, ui.focusRing)}
                  href={source.url}
                  hreflang={source.lang}
                  lang={source.lang}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title}
                </a>
                {details.length > 0 ? `. ${details.join(", ")}.` : "."}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * A long text, a post or a legal page, in the text width under its title. A `figure` stands
 * beside its opening on wide screens and under the title on narrower ones.
 */
export function Article({
  title,
  note,
  figure,
  children,
}: {
  title: ComponentChildren;
  note?: ComponentChildren;
  figure?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <article {...stylex.props(ui.container, styles.opening, figure !== undefined && styles.beside)}>
      <div {...stylex.props(styles.besideText)}>
        <h1 {...stylex.props(ui.display, ui.titleWidth)}>{title}</h1>
        {note !== undefined && <p {...stylex.props(ui.small, ui.note, styles.lead)}>{note}</p>}
        <div {...stylex.props(ui.textWidth, styles.afterOpening)}>{children}</div>
      </div>
      {figure !== undefined && <div {...stylex.props(styles.besideFigure)}>{figure}</div>}
    </article>
  );
}

/**
 * The closing call to action: a panel on the card ground across the whole grid, with the
 * section's title, lead and buttons inside it.
 */
export function CallToAction({
  id,
  title,
  text,
  children,
}: {
  id: string;
  title: ComponentChildren;
  text: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <section {...stylex.props(ui.container, styles.part)} aria-labelledby={id}>
      <div {...stylex.props(styles.panel)}>
        <h2 {...stylex.props(ui.heading, ui.titleWidth)} id={id}>
          {title}
        </h2>
        <p {...stylex.props(ui.lead, ui.textWidth, styles.lead)}>{text}</p>
        <div {...stylex.props(styles.afterHeroLead)}>{children}</div>
      </div>
    </section>
  );
}

const styles = stylex.create({
  /** The page's first part, under the header. */
  opening: { paddingTop: { default: space.x8, [media.desktop]: space.x12 } },
  /** Every later part: twenty units below the part before, twelve on phones. */
  part: { paddingTop: { default: space.x12, [media.desktop]: space.x20 } },
  /** The sources belong to the whole page, not to the part above: closer than a new part. */
  endMatter: { paddingTop: { default: space.x8, [media.desktop]: space.x12 } },
  lead: { marginTop: { default: space.x2, [media.desktop]: space.x3 } },
  /** The opening's buttons and notes belong to its lead. */
  afterHeroLead: { marginTop: { default: space.x3, [media.desktop]: space.x4 } },
  /** A section's content under its intro. */
  afterLead: { marginTop: { default: space.x5, [media.desktop]: space.x6 } },
  /** Content right after the opening: further than a section's, as the opening's title is larger. */
  afterOpening: { marginTop: { default: space.x6, [media.desktop]: space.x8 } },
  stack: { display: "flex", flexDirection: "column", alignItems: "flex-start", rowGap: space.x2 },
  /**
   * A part with a figure, from wide screens: twelve columns, whose first row holds the text across
   * all of them and the figure over the last four. The text keeps its own widths, eight columns
   * at most, so the two never meet.
   */
  beside: {
    display: { default: null, [media.wide]: "grid" },
    gridTemplateColumns: { default: null, [media.wide]: "repeat(12, minmax(0, 1fr))" },
    columnGap: space.x3,
  },
  besideText: {
    gridColumn: { default: null, [media.wide]: "1 / -1" },
    gridRow: { default: null, [media.wide]: "1" },
  },
  /** Its top on the title's on wide screens; under the text, six columns wide, on tablets. */
  besideFigure: {
    gridColumn: { default: null, [media.wide]: "9 / -1" },
    gridRow: { default: null, [media.wide]: "1" },
    alignSelf: "start",
    maxWidth: {
      default: "100%",
      [media.desktop]: "calc((100% - 264px) * 6 / 12 + 120px)",
      [media.wide]: "none",
    },
    marginTop: { default: space.x6, [media.desktop]: space.x8, [media.wide]: 0 },
  },
  /** The lines in ink on the paper, or inverted, in paper on the umber (see `Figure`). */
  ink: {
    mixBlendMode: { default: "screen", [media.light]: "multiply" },
    filter: { default: "invert(1)", [media.light]: "none" },
  },
  inText: { display: "block", width: "100%", height: "auto" },
  /** Every card's figure in the same 4:3 field, fitted inside it whatever its own shape. */
  inCard: {
    display: "block",
    width: "100%",
    height: "auto",
    aspectRatio: "4 / 3",
    objectFit: "contain",
  },
  caption: { marginTop: space.x2 },
  cardFigure: { alignSelf: "stretch", marginBottom: space.x2 },
  cards: {
    display: "grid",
    gap: space.x3,
    listStyle: "none",
  },
  twoColumns: {
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(2, minmax(0, 1fr))",
    },
  },
  threeColumns: {
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(2, minmax(0, 1fr))",
      [media.wide]: "repeat(3, minmax(0, 1fr))",
    },
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: space.x2,
    padding: { default: space.x3, [media.desktop]: space.x4 },
    borderRadius: space.x1,
    backgroundColor: colors.surface,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.x2,
  },
  panel: {
    padding: { default: space.x4, [media.desktop]: space.x8 },
    borderRadius: space.x1,
    backgroundColor: colors.surface,
  },
  /** Small, raised, and without effect on the line's height. */
  cite: {
    fontSize: "0.6875rem",
    fontWeight: 500,
    lineHeight: 0,
    marginInlineStart: "0.125em",
  },
  citeLink: {
    color: colors.primary,
    textDecorationLine: { default: "none", ":hover": { [media.hover]: "underline" } },
  },
  sources: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    marginTop: space.x3,
    listStyle: "none",
  },
  /** The number in its own column, the entry hanging beside it. */
  source: {
    display: "grid",
    gridTemplateColumns: `${space.x4} minmax(0, 1fr)`,
  },
  sourceNumber: { color: colors.primary, fontVariantNumeric: "tabular-nums" },
});
