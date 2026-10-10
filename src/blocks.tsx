import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import { colors, media, space } from "./tokens.stylex.ts";
import { type Style, ui } from "./ui.tsx";

/**
 * The parts every page is built from: an opening (`Hero`), sections, cards, buttons and a closing
 * call to action. Pages lay them out; `layout.tsx` wraps them in the header and footer.
 */

/** A page's opening: the title, a lead, then whatever follows it (more text, actions). */
export function Hero({
  title,
  lead,
  children,
}: {
  title: ComponentChildren;
  lead?: ComponentChildren;
  children?: ComponentChildren;
}) {
  return (
    <header {...stylex.props(ui.container, styles.hero)}>
      <h1 {...stylex.props(ui.display, styles.heroTitle)}>{title}</h1>
      {lead !== undefined && <p {...stylex.props(ui.lead, styles.heroLead)}>{lead}</p>}
      {children}
    </header>
  );
}

/** A part of a page under its own heading, set off from the part before by a rule. */
export function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: ComponentChildren;
  intro?: ComponentChildren;
  children?: ComponentChildren;
}) {
  return (
    <section {...stylex.props(styles.section)} aria-labelledby={id}>
      <div {...stylex.props(ui.container)}>
        <div {...stylex.props(styles.head)}>
          <h2 {...stylex.props(ui.heading)} id={id}>
            {title}
          </h2>
          {intro !== undefined && <p {...stylex.props(ui.lead)}>{intro}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Cards side by side where they fit: up to `columns` on wide screens, two on tablets, one on phones. */
export function Cards({ columns, children }: { columns: 2 | 3; children: ComponentChildren }) {
  return (
    <ul {...stylex.props(styles.cards, columns === 3 ? styles.threeColumns : styles.twoColumns)}>
      {children}
    </ul>
  );
}

/** One card: a bordered panel whose parts stack two units apart. */
export function Card({ children }: { children: ComponentChildren }) {
  return <li {...stylex.props(styles.card)}>{children}</li>;
}

/** Buttons and links in a row, wrapping where the row is too narrow. */
export function Actions({ children }: { children: ComponentChildren }) {
  return <div {...stylex.props(styles.actions)}>{children}</div>;
}

type ButtonKind = "primary" | "secondary" | "inverse" | "inverseOutline";

const buttonKinds: Readonly<Record<ButtonKind, Style>> = {
  primary: ui.primary,
  secondary: ui.secondary,
  inverse: ui.inverse,
  inverseOutline: ui.inverseOutline,
};

/** A link shaped as a button. `inverse` kinds sit on the closing call to action's dark panel. */
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

/** Paragraphs in the width that reads best, two units apart. */
export function Measure({ children }: { children: ComponentChildren }) {
  return <div {...stylex.props(styles.measure)}>{children}</div>;
}

/** A long text, a post or a legal page, in one readable column under its title. */
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
    <article {...stylex.props(ui.container, styles.article)}>
      <div {...stylex.props(styles.measure)}>
        <header {...stylex.props(styles.articleHead)}>
          <h1 {...stylex.props(ui.display)}>{title}</h1>
          {note !== undefined && <p {...stylex.props(ui.small, ui.note)}>{note}</p>}
        </header>
        {children}
      </div>
    </article>
  );
}

/** The closing panel: what to do next, in full contrast. */
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
    <section {...stylex.props(styles.closing)} aria-labelledby={id}>
      <div {...stylex.props(ui.container)}>
        <div {...stylex.props(styles.panel)}>
          <h2 {...stylex.props(ui.heading, styles.inverse)} id={id}>
            {title}
          </h2>
          <p {...stylex.props(ui.lead, styles.inverse)}>{text}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

const styles = stylex.create({
  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: space.x3,
    paddingTop: { default: space.x8, [media.desktop]: space.x12 },
    paddingBottom: { default: space.x8, [media.desktop]: space.x12 },
  },
  heroTitle: { maxWidth: "15em" },
  heroLead: { maxWidth: space.measure },
  section: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
    paddingBlock: { default: space.x8, [media.desktop]: space.x12 },
  },
  head: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x2,
    maxWidth: space.measure,
    marginBottom: { default: space.x5, [media.desktop]: space.x6 },
  },
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
    borderRadius: space.x2,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.hairline,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.x2,
    marginTop: space.x1,
  },
  measure: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x2,
    maxWidth: space.measure,
  },
  article: {
    paddingTop: { default: space.x8, [media.desktop]: space.x12 },
    paddingBottom: { default: space.x8, [media.desktop]: space.x12 },
  },
  articleHead: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x2,
    marginBottom: { default: space.x4, [media.desktop]: space.x6 },
  },
  closing: { paddingBlock: { default: space.x8, [media.desktop]: space.x12 } },
  panel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: space.x3,
    padding: { default: space.x4, [media.desktop]: space.x8 },
    borderRadius: space.x2,
    backgroundColor: colors.primary,
  },
  inverse: { color: colors.bg, maxWidth: space.measure },
});
