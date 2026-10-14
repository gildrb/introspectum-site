import * as stylex from "@stylexjs/stylex";
import {
  Figure,
  Hero,
  MachineSection,
  type MachinePart,
  ProfileLink,
  Section,
  Text,
} from "../blocks.tsx";
import { Machine } from "../figures/machine.tsx";
import type { Doc } from "../content.ts";
import { translators } from "../i18n.ts";
import { type Assets, Page } from "../layout.tsx";
import type { Locale } from "../locale.ts";
import { type Block, Inline, Markdown, usesItalic } from "../markdown.tsx";
import {
  company,
  illustrations,
  isPersonName,
  methods,
  people,
  type PersonName,
  principles,
} from "../site.ts";
import { grid, media, space } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

/** A part of the page: a `##` heading of `about.md` and the blocks under it. */
type Chapter = { title: string; blocks: Block[] };

/**
 * One member of the team: a paragraph of `about.md` that opens with their name in bold, then a
 * comma, their role up to the first full stop, and what they have done.
 */
const member = /^\*\*(?<name>[^*]+)\*\*,\s*(?<role>.+?)[.:]\s+(?<about>.+)$/s;

/**
 * `about.md` as the page reads it: the paragraphs before the first heading open the page, the
 * first one as its lead; then a part per `##` heading. A part made only of paragraphs that each
 * open with a bold name is the team.
 */
function chapters(blocks: readonly Block[]) {
  const opening: string[] = [];
  const parts: Chapter[] = [];
  for (const block of blocks) {
    if (block.type === "h2") parts.push({ title: block.text, blocks: [] });
    else {
      const current = parts.at(-1);
      if (current !== undefined) current.blocks.push(block);
      else if (block.type === "p") opening.push(block.text);
      else throw new Error(`about.md: only paragraphs open the page, not a ${block.type}.`);
    }
  }
  const [lead, ...rest] = opening;
  if (lead === undefined) throw new Error("about.md: open the page with a paragraph.");
  return { lead, rest, parts };
}

/**
 * A part as it stands beside the book wheel (`MachineSection`): its paragraphs, or the items of
 * its one list.
 */
function besideWheel(part: Chapter, id: string): MachinePart {
  const title = <Inline text={part.title} />;
  const [only] = part.blocks;
  if (part.blocks.length === 1 && only !== undefined && (only.type === "ul" || only.type === "ol"))
    return {
      id,
      title,
      list: true,
      blocks: only.items.map((item) => (
        <p {...stylex.props(ui.prose)}>
          <Inline text={item} />
        </p>
      )),
    };
  return {
    id,
    title,
    blocks: part.blocks.map((block) => {
      if (block.type !== "p")
        throw new Error(`about.md: ${part.title} is paragraphs or one list, not a ${block.type}.`);
      return (
        <Text key={block.text}>
          <Inline text={block.text} />
        </Text>
      );
    }),
  };
}

/** A team part's members, each of whom must be in `people`; `null` for any other part. */
function teamOf(blocks: readonly Block[]) {
  const members = blocks.map((block) =>
    block.type === "p" ? member.exec(block.text)?.groups : undefined,
  );
  if (members.length === 0) return null;
  const team: { name: PersonName; role: string; about: string }[] = [];
  for (const found of members) {
    const { name, role, about } = found ?? {};
    if (name === undefined || role === undefined || about === undefined) return null;
    if (!isPersonName(name)) throw new Error(`about.md: ${name} is not in \`people\` (site.ts).`);
    team.push({ name, role, about });
  }
  return team;
}

/**
 * The About page, in the blocks every page is made of: an opening with the Emerald Tablet in its
 * band, then the research, the team side by side as on the homepage, publications and contact.
 * The words stay in `about.md` and its translations.
 */
export function AboutPage({
  doc,
  description,
  ...props
}: PageProps & {
  doc: Doc;
  description: string;
}) {
  const { assets, locale, path, alternates, shareImage } = props;
  const t = translators[locale];
  const { lead, rest, parts } = chapters(doc.blocks);
  const [research, publications, ...others] = parts;
  if (research === undefined || publications === undefined)
    throw new Error("about.md: begin with the research, then the publications.");
  const illustration = illustrations.tabula;
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: doc.title }),
        description,
        shareImage,
        type: "website",
        index: true,
        mono: false,
        italic: usesItalic(doc.blocks),
      }}
    >
      <Hero
        title={doc.title}
        lead={<Inline text={lead} />}
        figure={
          <Figure
            illustration={illustration}
            alt={t.text(illustration.alt)}
            placement="band"
            priority
          />
        }
      >
        {rest.map((text) => (
          <Text key={text}>
            <Inline text={text} />
          </Text>
        ))}
      </Hero>
      {/* The research & what came of it, with the book wheel beside both: reading before building. */}
      <MachineSection
        parts={[besideWheel(research, "part-1"), besideWheel(publications, "part-2")]}
        from={{ part: 0, block: "title" }}
        to={1}
        machine={<Machine name="bookwheel" locale={locale} fill />}
      />
      <MachineSection
        parts={[
          {
            id: "how",
            title: t.text("home_how_label"),
            intro: t.text("home_methods", {
              methods: t.list(methods.map((method) => t.text(method))),
            }),
            // The principles as a list beside the pantograph that shows them, not cards under it.
            list: true,
            blocks: principles.map(({ name, text }) => (
              <>
                <h3 {...stylex.props(ui.title)}>{t.text(name)}</h3>
                <p {...stylex.props(ui.prose, styles.principle)}>{t.text(text)}</p>
              </>
            )),
          },
        ]}
        // The pantograph shows how we work as a whole: it stands beside the whole part.
        from={{ part: 0, block: "title" }}
        to={0}
        machine={<Machine name="pantograph" locale={locale} fill />}
      />
      {others.map((part, index) => {
        const id = `part-${index + 3}`;
        const team = teamOf(part.blocks);
        return (
          <Section key={part.title} id={id} title={<Inline text={part.title} />}>
            {team === null ? (
              <div {...stylex.props(ui.textWidth)}>
                <Markdown blocks={part.blocks} />
              </div>
            ) : (
              <ul {...stylex.props(styles.team)}>
                {team.map(({ name, role, about }) => (
                  <li key={name} {...stylex.props(styles.member)}>
                    <h3 {...stylex.props(ui.title)}>{name}</h3>
                    <p {...stylex.props(ui.text, ui.label)}>{role}</p>
                    <p {...stylex.props(ui.prose, styles.bio)}>
                      <Inline text={about} />
                    </p>
                    <ProfileLink
                      href={people[name].linkedin}
                      label={t.text("team_linkedin", { name })}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        );
      })}
    </Page>
  );
}

const styles = stylex.create({
  /** The team side by side on the card lines, as on the homepage, without panels. */
  team: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(3, minmax(0, 1fr))",
    },
    gap: grid.gutter,
    listStyle: "none",
  },
  member: { display: "flex", flexDirection: "column", rowGap: space.x1 },
  /** What they have done, a little further from their role than the role from their name. */
  bio: { marginTop: space.x1 },
  /** A principle's sentence, one unit under its name. */
  principle: { marginTop: space.x1 },
});
