import numbersCss from "@sfinterface/numbers/styles.css?inline";
import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import {
  Actions,
  ButtonLink,
  CallToAction,
  citeTags,
  Figure,
  Hero,
  Measure,
  Section,
  Sources,
  Text,
} from "../blocks.tsx";
import { type MessageId, type NumberPart, type Translator, translators } from "../i18n.ts";
import { Island } from "../island.tsx";
import { noscriptCss, pendingCss, Stat } from "../islands/stat.tsx";
import { Machine } from "../figures/machine.tsx";
import { type Assets, Page } from "../layout.tsx";
import { href, type Locale, localeInfo, locales } from "../locale.ts";
import {
  company,
  contactHref,
  email,
  graphRuns,
  illustrations,
  numbered,
  origin,
  proofRuns,
  trust,
  type TrustFact,
} from "../site.ts";
import { colors, grid, media, space } from "../tokens.stylex.ts";
import { richLink, ui, untranslated } from "../ui.tsx";
import { Consulting } from "./products.tsx";

/** The survey results behind the "why", as shares of the developers asked (see `sources.sonar`). */
const survey = { distrust: 0.96, verify: 0.48, effort: 0.38 };

const citations = numbered(["sonar", "ripgrep"]);

/** The Software Factory's page: the homepage leads to it, and to its waiting list. */
const factory = "software-factory";

const team: readonly { name: string; role: MessageId }[] = [
  { name: "Marc Gsell", role: "team_role_marc" },
  { name: "Gil Rodrigues", role: "team_role_gil" },
];

/**
 * The elevator pitch, under three minutes of reading in every language (checked at build, see
 * `render.tsx`): the Software Factory at work, what it has measured, why it matters, what we offer
 * now, how customer data is kept, who we are, and what to do next.
 */
export function Home({
  assets,
  locale,
  path,
  alternates,
  shareImage,
}: {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
}) {
  const t = translators[locale];
  const cite = citeTags(t, citations);
  const factoryPage = href(locale, "products", factory);
  const stats: readonly { id: string; value: readonly NumberPart[]; label: ComponentChildren }[] = [
    {
      id: "own",
      value: t.numbers("stat_number", { value: graphRuns.ownNodes }),
      label: t.rich("stat_own_label", cite, {
        files: graphRuns.ownFiles,
        seconds: graphRuns.ownSeconds,
      }),
    },
    {
      id: "other",
      value: t.numbers("stat_number", { value: graphRuns.otherNodes }),
      label: t.rich("stat_other_label", cite, {
        files: graphRuns.otherFiles,
        seconds: graphRuns.otherSeconds,
      }),
    },
    {
      id: "repeat",
      value: t.numbers("stat_ratio", { passed: graphRuns.repeats, runs: graphRuns.repeats }),
      label: t.rich("stat_repeat_label", cite),
    },
    {
      id: "proof",
      value: t.numbers("stat_ratio", proofRuns),
      label: t.rich("stat_proof_label", cite),
    },
  ];
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: company.name,
        description: t.text("home_description"),
        shareImage,
        type: "website",
        index: true,
        mono: false,
        italic: false,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${origin}/#organization`,
          name: company.name,
          legalName: company.legalName,
          url: `${origin}/`,
          email,
          description: t.text("home_description"),
          founder: { "@type": "Person", name: company.founder },
          address: { "@type": "PostalAddress", addressCountry: "IM" },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            email,
            url: `${origin}${href(locale, "contact")}`,
            availableLanguage: locales.map((code) => localeInfo[code].tag),
          },
        },
        // The moving figures' own stylesheet, in its own `@layer arc`, and the measurements'
        // waiting rules: out of sight until they roll in, in sight at once without JavaScript.
        head: (
          <>
            <style dangerouslySetInnerHTML={{ __html: `${numbersCss}\n${pendingCss}` }} />
            <noscript>
              <style dangerouslySetInnerHTML={{ __html: noscriptCss }} />
            </noscript>
          </>
        ),
      }}
    >
      <Hero
        title={t.text("tagline")}
        lead={t.text("home_lead")}
        figure={<Machine name="proof" locale={locale} fill />}
        stage
        reveal
      >
        <Actions>
          <ButtonLink href={contactHref(locale, factory)} kind="primary">
            {t.text("nav_contact")}
          </ButtonLink>
          <ButtonLink href={factoryPage} kind="secondary">
            {t.text("home_cta_factory")}
          </ButtonLink>
        </Actions>
      </Hero>
      <Section
        id="measured"
        title={t.text("home_measured_title")}
        intro={t.text("home_measured_intro", { date: graphRuns.date })}
      >
        <dl {...stylex.props(styles.stats)}>
          {stats.map(({ id, value, label }, order) => (
            <div key={id} {...stylex.props(styles.stat)}>
              <dt {...stylex.props(ui.serif, styles.value)}>
                <Island name="stat" component={Stat} props={{ locale, parts: value, order }} />
              </dt>
              <dd {...stylex.props(ui.text, ui.label)}>{label}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section
        id="why"
        title={t.text("home_why_title")}
        intro={t.rich("home_why_evidence", cite, {
          distrust: survey.distrust,
          verify: survey.verify,
        })}
        figure={
          <Figure
            illustration={illustrations.euclid}
            alt={t.text(illustrations.euclid.alt)}
            placement="band"
          />
        }
      >
        <Measure>
          <Text>{t.rich("home_why_review", cite, { effort: survey.effort })}</Text>
          <Text>{t.text("home_why_text")}</Text>
        </Measure>
      </Section>
      <Consulting locale={locale} />
      <Section id="trust" title={t.text("trust_title")} intro={t.text("trust_intro")}>
        <dl {...stylex.props(styles.facts)}>
          {trust.map(({ term, fact }) => (
            <div key={term} {...stylex.props(styles.fact)}>
              <dt {...stylex.props(ui.title)}>{t.text(term)}</dt>
              <dd {...stylex.props(ui.prose, ui.label)}>{trustText(t, locale, fact)}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="who" title={t.text("home_who_label")}>
        <div {...stylex.props(styles.founder)}>
          <h3 {...stylex.props(ui.title)} {...untranslated}>
            {company.founder}
          </h3>
          <p {...stylex.props(ui.text, ui.label)}>{t.text("team_role_fabian")}</p>
          <p {...stylex.props(ui.lead, styles.bio)}>{t.text("home_who_text")}</p>
        </div>
        <ul {...stylex.props(styles.team)}>
          {team.map(({ name, role }) => (
            <li key={name} {...stylex.props(styles.member)}>
              <h3 {...stylex.props(ui.title)} {...untranslated}>
                {name}
              </h3>
              <p {...stylex.props(ui.text, ui.label)}>{t.text(role)}</p>
            </li>
          ))}
        </ul>
        <div {...stylex.props(styles.after)}>
          <ButtonLink href={href(locale, "about")} kind="secondary">
            {t.text("home_who_more")}
          </ButtonLink>
        </div>
      </Section>
      <Closing locale={locale} />
      <Sources id="sources" title={t.text("sources_title")} list={citations} />
    </Page>
  );
}

/** The closing call to action of the homepage and of every blog post. */
export function Closing({ locale }: { locale: Locale }) {
  const t = translators[locale];
  return (
    <CallToAction id="next" title={t.text("cta_title")} text={t.text("cta_text")}>
      <Actions>
        <ButtonLink href={contactHref(locale, "general")} kind="primary">
          {t.text("nav_contact")}
        </ButtonLink>
        <ButtonLink href={`${href(locale, "products", factory)}#waitlist`} kind="secondary">
          {t.text("cta_waitlist")}
        </ButtonLink>
      </Actions>
    </CallToAction>
  );
}

/** A trust fact as the page writes it; an open one as a visible gap. */
function trustText(t: Translator, locale: Locale, fact: TrustFact): ComponentChildren {
  switch (fact.$) {
    case "fact":
      return t.text(fact.text);
    case "contact":
      return t.rich(fact.text, { link: richLink(href(locale, "contact")) }, { email });
    case "open":
      return t.text("trust_open");
    default: {
      const _: never = fact;
      return _;
    }
  }
}

const styles = stylex.create({
  /** Four measurements in a row on wide screens, two on tablets, one under another on phones. */
  stats: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(2, minmax(0, 1fr))",
      [media.wide]: "repeat(4, minmax(0, 1fr))",
    },
    gap: grid.gutter,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    padding: { default: space.x3, [media.desktop]: space.x4 },
    borderRadius: space.x1,
    backgroundColor: colors.surface,
    textWrap: "balance",
  },
  /**
   * A measurement as large as a section title, in its figures. The digits passing by as the figures
   * roll (`islands/stat.tsx`) stay within its line, off the label under it.
   */
  value: {
    fontSize: "clamp(2rem, 1.76rem + 1.09vw, 2.75rem)",
    fontVariantNumeric: "lining-nums tabular-nums",
    lineHeight: 1.1,
    color: colors.primary,
    overflowY: "clip",
    overflowClipMargin: space.half,
  },
  facts: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(2, minmax(0, 1fr))",
    },
    gap: grid.gutter,
  },
  fact: { display: "flex", flexDirection: "column", rowGap: space.x1 },
  founder: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    maxWidth: grid.span6Widest,
  },
  bio: { marginTop: space.x1 },
  team: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(3, minmax(0, 1fr))",
    },
    gap: grid.gutter,
    listStyle: "none",
    marginTop: { default: space.x5, [media.desktop]: space.x6 },
  },
  member: { display: "flex", flexDirection: "column", rowGap: space.x1, textWrap: "balance" },
  after: { marginTop: { default: space.x5, [media.desktop]: space.x6 } },
});
