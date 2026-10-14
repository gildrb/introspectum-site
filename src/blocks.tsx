import * as stylex from "@stylexjs/stylex";
import { type ComponentChildren, Fragment } from "preact";
import type { Tag, Translator } from "./i18n.ts";
import type { Citation, Illustration } from "./site.ts";
import { colors, grid, media, space, weights } from "./tokens.stylex.ts";
import { type Style, ui } from "./ui.tsx";
import { imageSize, versioned } from "./versioned.ts";

/**
 * The parts every page is built from: an opening (`Hero`), sections, cards, buttons and a closing
 * call to action. Pages lay them out; `layout.tsx` wraps them in the header and footer.
 *
 * They keep one grid and one rhythm. Everything starts on the container's left edge, the first
 * column line; titles are eight columns wide, leads at most seven & running text about 70
 * characters (`ui.titleWidth`, `ui.textWidth`, `ui.prose`); cards run two or three to a row on
 * the same gutter; figures and drawn machines stand centred in the last six columns, on one axis
 * down the page, with their legends centred under them. Vertically, space grows with distance in
 * meaning, so what belongs together reads as one: a lead sits three units under its title, the
 * buttons four units under the lead, a section's content six units under its intro, and one part
 * of the page twelve units under the part before (eight on phones).
 */

/**
 * A page's opening: the title, the lead under it, then whatever follows (more text, actions). A
 * `figure` stands beside it on wide screens and under it on narrower ones. On a `stage` the
 * figure is the opening's centre of interest: drawn tall, the text centred beside it, and the
 * page's first part further below than parts are from each other.
 *
 * With `reveal`, the text arrives as the page first paints, in Linear's measured rhythm: the
 * title word by word (a title that is not plain text as one), then the lead, then what follows,
 * each rising a quarter of its type size out of a 10px blur over one second. The figure stands
 * still in place from the start. CSS alone runs it, so it never waits for the script; it moves
 * and fades only, so nothing shifts; with reduced motion the text simply stands there.
 */
export function Hero({
  title,
  lead,
  figure,
  stage = false,
  reveal = false,
  children,
}: {
  title: ComponentChildren;
  lead?: ComponentChildren;
  figure?: ComponentChildren;
  stage?: boolean;
  reveal?: boolean;
  children?: ComponentChildren;
}) {
  // Each title word with where it starts in the title, which keys it.
  let at = 0;
  const words =
    reveal && typeof title === "string"
      ? title.split(" ").map((word) => {
          const start = at;
          at += word.length + 1;
          return { word, start };
        })
      : null;
  return (
    <header
      {...stylex.props(
        ui.container,
        styles.opening,
        figure !== undefined && styles.beside,
        stage && styles.stage,
      )}
    >
      <div {...stylex.props(styles.besideText, stage && styles.stageText)}>
        <h1
          {...stylex.props(
            ui.display,
            ui.titleWidth,
            figure !== undefined && styles.besideTitle,
            reveal && words === null && styles.reveal,
          )}
        >
          {words === null
            ? title
            : words.map(({ word, start }, index) => (
                <Fragment key={start}>
                  {index > 0 && " "}
                  <span
                    {...stylex.props(
                      styles.reveal,
                      styles.word,
                      styles.revealAfter(reveals.start + index * reveals.word),
                    )}
                  >
                    {word}
                  </span>
                </Fragment>
              ))}
        </h1>
        {lead !== undefined && (
          <p
            {...stylex.props(
              ui.lead,
              ui.textWidth,
              styles.lead,
              reveal && styles.reveal,
              reveal && styles.revealAfter(reveals.lead),
            )}
          >
            {lead}
          </p>
        )}
        {children !== undefined && (
          <div
            {...stylex.props(
              ui.textWidth,
              styles.stack,
              styles.afterHeroLead,
              reveal && styles.reveal,
              reveal && styles.revealAfter(reveals.rest),
            )}
          >
            {children}
          </div>
        )}
      </div>
      {figure !== undefined && (
        <div {...stylex.props(styles.besideFigure, stage && styles.stageFigure)}>{figure}</div>
      )}
    </header>
  );
}

/**
 * An opening's reveal, in milliseconds, measured on linear.app (14 October 2026): each part takes
 * one second on `ease`, title lines 33 ms apart, the description 200 ms after the title, the
 * button 450 ms after it. Ours starts 100 ms after the first paint and ends about 1.6 s after it.
 * The figure takes no part: a machine is there from the first paint and runs.
 */
const reveals = { start: 100, word: 33, lead: 300, rest: 550, length: 1000 };

/** A part of the opening rising into place: lower and blurred, then sharp and in place. */
const rise = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(0.25em)", filter: "blur(10px)" },
  to: { opacity: 1, transform: "none", filter: "none" },
});

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
        <h2
          {...stylex.props(ui.heading, ui.titleWidth, figure !== undefined && styles.besideTitle)}
          id={id}
        >
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

/** A part of a page beside a machine: its title, an intro, and its blocks (paragraphs or a list). */
export type MachinePart = {
  id: string;
  title: ComponentChildren;
  intro?: ComponentChildren;
  blocks: readonly ComponentChildren[];
  /** The blocks are the items of a list, further apart than paragraphs. */
  list?: boolean;
};

/**
 * One or two parts of a page with a drawn machine (`figures/machine.tsx`, given `fill`) beside
 * what it shows. On wide screens the titles, intros and blocks take the first five columns, a
 * row each, and the machine stands in the last six, in the band from part `from.part`'s title
 * (`from.block` "title"), or from the first line of its block `from.block`, to the last line of
 * part `to`: drawn into it, centred and shrunk to its height, so it sits beside what it shows.
 * The band is never shorter than a machine still reads; where the text is, one row after the
 * band's last part takes the difference, so the blocks keep their spacing. Narrower, the machine
 * follows the part it starts in.
 */
export function MachineSection({
  parts,
  from,
  to,
  machine,
}: {
  parts: readonly [MachinePart] | readonly [MachinePart, MachinePart];
  from: BandStart;
  to: number;
  machine: ComponentChildren;
}) {
  const { style, band } = machineBand(parts, from, to);
  return (
    <div
      {...stylex.props(ui.container, styles.part, styles.beside, styles.machineRows)}
      style={style}
    >
      {parts.map((part, index) => (
        <Fragment key={part.id}>
          <Part part={part} later={index > 0} />
          {index === from.part && <div {...stylex.props(styles.machineBand, band)}>{machine}</div>}
        </Fragment>
      ))}
    </div>
  );
}

/** Where a machine's band starts: part `part`'s title, or its block `block`. */
type BandStart = { part: number; block: number | "title" };

/**
 * The grid rows of a `MachineSection` & the band its machine stands in: grid lines count from 1;
 * the band starts at its part's title row, or at block `from.block`'s row after the title and
 * intro, and ends with the filler row that comes right after part `to`.
 */
function machineBand(parts: readonly MachinePart[], from: BandStart, to: number) {
  const start = parts[from.part];
  if (
    start === undefined ||
    (from.block !== "title" && (from.block < 0 || from.block >= start.blocks.length))
  )
    throw new Error(`A machine stands beside block ${from.block} of part ${from.part}.`);
  if (to < from.part || to >= parts.length) throw new Error(`A machine's band ends in part ${to}.`);
  const counts = parts.map((part) => 1 + (part.intro === undefined ? 0 : 1) + part.blocks.length);
  const before = (index: number) => counts.slice(0, index).reduce((sum, count) => sum + count, 0);
  const first =
    before(from.part) +
    1 +
    (from.block === "title" ? 0 : 1 + (start.intro === undefined ? 0 : 1) + from.block);
  const filler = before(to + 1) + 1;
  const tracks = counts.flatMap((count, index) => [
    ...Array.from({ length: count }, () => "auto"),
    ...(index === to ? ["1fr"] : []),
  ]);
  return {
    style: { "--machine-rows": tracks.join(" "), "--machine-band": `${first} / ${filler + 1}` },
    band: bandSpacing(from, start),
  };
}

/** The band's top margin: on wide screens level with the title or line it starts beside. */
function bandSpacing(from: BandStart, start: MachinePart) {
  if (from.block === "title") return from.part === 0 ? styles.bandTitle : styles.bandLaterTitle;
  if (from.block === 0) return styles.bandFirst;
  return start.list === true ? styles.bandList : styles.bandText;
}

function Part({ part, later }: { part: MachinePart; later: boolean }) {
  const { id, title, intro, blocks, list = false } = part;
  const Wrap = list ? "ul" : "div";
  const Item = list ? "li" : "div";
  return (
    <section {...stylex.props(styles.contents)} aria-labelledby={id}>
      <h2
        {...stylex.props(
          ui.heading,
          ui.titleWidth,
          styles.machineTitle,
          later && styles.laterTitle,
        )}
        id={id}
      >
        {title}
      </h2>
      {intro !== undefined && (
        <p {...stylex.props(ui.lead, styles.machineLead, styles.machineText, styles.lead)}>
          {intro}
        </p>
      )}
      <Wrap {...stylex.props(styles.contents, styles.blocks)}>
        {blocks.map((block, index) => (
          <Item
            {...stylex.props(
              styles.machineText,
              index === 0 ? styles.afterLead : list ? styles.blockList : styles.blockText,
            )}
          >
            {block}
          </Item>
        ))}
      </Wrap>
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

/**
 * Where a figure stands: in the band beside an opening's or a section's text, drawn into the
 * text's height on wide screens, with its credit under it; or atop a card, without.
 */
type Placement = "band" | "card";

/** A `@media` rule's query alone, for an image's `sizes`. */
const query = (rule: string) => rule.replace(/^@media /, "");

/** Four columns beside text, or a card's width, on wide screens; six columns on tablets. */
const sizes = `${query(media.wide)} ${grid.span4Widest}, ${query(media.desktop)} ${grid.span6Tablet}, 100vw`;

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
  const band = placement === "band";
  const picture = (
    <picture {...stylex.props(band && styles.drawingInBand)}>
      <source type="image/avif" srcSet={srcset("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset("webp")} sizes={sizes} />
      <img
        {...stylex.props(
          styles.ink,
          placement === "card" ? styles.inCard : styles.inText,
          band && styles.imageInBand,
        )}
        src={versioned(path(small, "jpg"))}
        srcSet={srcset("jpg")}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
      />
    </picture>
  );
  switch (placement) {
    case "card":
      return picture;
    case "band":
      return (
        <figure {...stylex.props(styles.fillBand)}>
          {picture}
          <figcaption {...stylex.props(ui.small, ui.note, styles.caption, styles.credit)}>
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
      <a {...stylex.props(ui.entry, ui.focusRing)} href={`#source-${number}`} aria-label={label}>
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

/** A long text, a post or a legal page, in the text width under its title. */
export function Article({
  title,
  note,
  children,
}: {
  title: ComponentChildren;
  note?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <article {...stylex.props(ui.container, styles.opening)}>
      <h1 {...stylex.props(ui.display, ui.titleWidth)}>{title}</h1>
      {note !== undefined && <p {...stylex.props(ui.small, ui.note, styles.lead)}>{note}</p>}
      <div {...stylex.props(ui.textWidth, styles.afterOpening)}>{children}</div>
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
  /**
   * Every later part: twelve units below the part before, eight on phones. Close, like a page that
   * moves fast; each part still reads as one by its title and the tight spacing inside it.
   */
  part: { paddingTop: { default: space.x8, [media.desktop]: space.x12 } },
  /** The sources belong to the whole page, not to the part above: closer than a new part. */
  endMatter: { paddingTop: { default: space.x6, [media.desktop]: space.x8 } },
  lead: { marginTop: { default: space.x2, [media.desktop]: space.x3 } },
  /**
   * A part of an opening that rises into place as the page first paints (`Hero` with `reveal`),
   * eased out, so it settles softly. Held in the first frame until its own start; with reduced
   * motion there is no animation, so it stands there from the start.
   */
  reveal: {
    animationName: { default: null, "@media (prefers-reduced-motion: no-preference)": rise },
    animationDuration: `${reveals.length}ms`,
    // CSS `ease`, as Linear's: a soft start, a long settle.
    animationTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    animationFillMode: "both",
  },
  revealAfter: (delay: number) => ({ animationDelay: `${delay}ms` }),
  /** A title word moves on its own only as a box of its own; it still breaks lines like a word. */
  word: { display: "inline-block" },
  /** The opening's buttons and notes belong to its lead. */
  afterHeroLead: { marginTop: { default: space.x3, [media.desktop]: space.x4 } },
  /** A section's content under its intro. */
  afterLead: { marginTop: { default: space.x5, [media.desktop]: space.x6 } },
  /** Content right after the opening: further than a section's, as the opening's title is larger. */
  afterOpening: { marginTop: { default: space.x6, [media.desktop]: space.x8 } },
  stack: { display: "flex", flexDirection: "column", alignItems: "flex-start", rowGap: space.x2 },
  /**
   * A part with a figure, from wide screens: twelve columns, whose first row holds the text across
   * all of them and the figure in the last six. The title keeps to six columns beside it and the
   * text to its own widths, so the two never meet.
   */
  beside: {
    display: { default: null, [media.wide]: "grid" },
    gridTemplateColumns: { default: null, [media.wide]: grid.columns },
    columnGap: grid.gutter,
  },
  besideText: {
    gridColumn: { default: null, [media.wide]: "1 / -1" },
    gridRow: { default: null, [media.wide]: "1" },
  },
  besideTitle: { maxWidth: { default: null, [media.wide]: grid.span6 } },
  /** A stage opening: its figure's part twice as far from the page's first part as parts are. */
  stage: { paddingBottom: { default: space.x4, [media.desktop]: space.x12 } },
  stageText: { alignSelf: { default: null, [media.wide]: "center" } },
  /** Drawn as tall as the stage, whatever the text beside it needs. */
  stageFigure: { minHeight: { default: null, [media.wide]: space.stage } },
  /**
   * A band in the last six columns beside the text, from the title's top to the text's last line
   * on wide screens: the figure is drawn into it (`Figure` in a band, `Machine` with `fill`), so
   * the part is as tall as its text. Figures and machines share its axis down the page. Under the
   * text, six columns wide, on tablets.
   */
  besideFigure: {
    gridColumn: { default: null, [media.wide]: "7 / -1" },
    gridRow: { default: null, [media.wide]: "1" },
    alignSelf: "stretch",
    position: { default: null, [media.wide]: "relative" },
    minHeight: { default: null, [media.wide]: space.band },
    maxWidth: { default: "100%", [media.desktop]: grid.span6, [media.wide]: "none" },
    marginTop: { default: space.x6, [media.desktop]: space.x8, [media.wide]: 0 },
  },
  /** A machine section's rows on wide screens, set per section (`MachineSection`). */
  machineRows: { gridTemplateRows: { default: null, [media.wide]: "var(--machine-rows)" } },
  /** Its titles in the text's five columns, clear of the band that may run beside a later one. */
  machineTitle: { gridColumn: { default: null, [media.wide]: "1 / 6" } },
  /** Its intro and blocks in the first five columns, a row each, in order. */
  machineText: {
    gridColumn: { default: null, [media.wide]: "1 / 6" },
    alignSelf: "start",
  },
  /** A part's own wrappers (`section`, `ul`, `div`) give way, so each block is a row of the grid. */
  contents: { display: { default: null, [media.wide]: "contents" } },
  blocks: { listStyle: "none" },
  /** Paragraphs two units apart, list items four. */
  blockText: { marginTop: space.x2 },
  blockList: { marginTop: space.x4 },
  /** The second part's title, as far below the first part as one part of a page below another. */
  laterTitle: { marginTop: { default: space.x8, [media.desktop]: space.x12 } },
  /**
   * The band beside the blocks it shows, in the last six columns from the first's row to the end
   * of its last part, at least as tall as a machine still reads; under the text, narrower.
   */
  machineBand: {
    gridColumn: { default: null, [media.wide]: "7 / -1" },
    gridRow: { default: null, [media.wide]: "var(--machine-band)" },
    alignSelf: "stretch",
    position: { default: null, [media.wide]: "relative" },
    minHeight: { default: null, [media.wide]: space.band },
  },
  /** An intro beside a machine: as wide as its five columns, and no wider than a lead anywhere. */
  machineLead: { maxWidth: grid.span6Widest },
  /** A band from a title: level with the title's top, the first part's or a later one's. */
  bandTitle: { marginTop: { default: space.x6, [media.desktop]: space.x8, [media.wide]: 0 } },
  bandLaterTitle: {
    marginTop: { default: space.x6, [media.desktop]: space.x8, [media.wide]: space.x12 },
  },
  /** The band's top, on wide screens level with its first block's first line. */
  bandFirst: {
    marginTop: { default: space.x6, [media.desktop]: space.x8, [media.wide]: space.x6 },
  },
  bandText: {
    marginTop: { default: space.x6, [media.desktop]: space.x8, [media.wide]: space.x2 },
  },
  bandList: {
    marginTop: { default: space.x6, [media.desktop]: space.x8, [media.wide]: space.x4 },
  },
  /** The lines in ink on the paper, or inverted, in paper on the umber (see `Figure`). */
  ink: {
    mixBlendMode: { default: "screen", [media.light]: "multiply" },
    filter: { default: "invert(1)", [media.light]: "none" },
  },
  inText: { display: "block", width: "100%", height: "auto" },
  /**
   * A figure in a band (`besideFigure`): on wide screens it fills the band, its picture and credit
   * centred in it and the picture shrunk to the band's height, so it never makes the part taller.
   */
  fillBand: {
    display: { default: null, [media.wide]: "flex" },
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    rowGap: space.x2,
    position: { default: null, [media.wide]: "absolute" },
    inset: { default: null, [media.wide]: 0 },
  },
  /** The `<picture>` gives way to its image, which is then the band's flex item. */
  drawingInBand: { display: { default: null, [media.wide]: "contents" } },
  imageInBand: {
    width: { default: "100%", [media.wide]: "auto" },
    maxWidth: "100%",
    minHeight: 0,
    flex: "0 1 auto",
    objectFit: "contain",
  },
  /** A figure's credit, centred under it like a machine's legend. */
  credit: { textAlign: "center", textWrap: "balance" },
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
    gap: grid.gutter,
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
    fontWeight: weights.medium,
    lineHeight: 0,
    marginInlineStart: "0.125em",
  },
  sources: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    marginTop: space.x3,
    listStyle: "none",
  },
  /** The number in its own column, the entry hanging beside it in even lines. */
  source: {
    display: "grid",
    gridTemplateColumns: `${space.x4} minmax(0, 1fr)`,
    textWrap: "balance",
  },
  sourceNumber: { color: colors.primary, fontVariantNumeric: "tabular-nums" },
});
