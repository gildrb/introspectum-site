import numbersCss from "@sfinterface/numbers/styles.css?inline";
import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import {
  Actions,
  ButtonLink,
  CallToAction,
  Card,
  Cards,
  citeTags,
  Figure,
  Hero,
  MachineSection,
  Measure,
  ProfileLink,
  Section,
  Sources,
  Sweep,
  Text,
} from "../blocks.tsx";
import { type MessageId, type NumberPart, type Translator, translators } from "../i18n.ts";
import { Island } from "../island.tsx";
import { Stat } from "../islands/stat.tsx";
import { Machine } from "../figures/machine.tsx";
import { noscriptCss, riseCss } from "../rise-css.ts";
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
  people,
  type PersonName,
  proofRuns,
  trust,
  type TrustFact,
} from "../site.ts";
import { colors, grid, media, space } from "../tokens.stylex.ts";
import { richLink, ui, untranslated } from "../ui.tsx";
import { Consulting } from "./products.tsx";

/** The survey results behind the "why", as shares of the developers asked (see `sources.sonar`). */
const survey = { distrust: 0.96, verify: 0.48, effort: 0.38 };

const citations = numbered(["sonar", "ripgrep", "turtle"]);

/** The ERP & CRM's page: the homepage opens with it, and its closing leads to its waiting list. */
const erp = "erp-crm";

/** The Software Factory's page: the homepage's second product leads to it. */
const factory = "software-factory";

/** The Trading Platform's page, research we publish: the homepage's third part leads to it. */
const trading = "trading-platform";

/** How the Trading Platform tests a strategy, a card each: what the cards under it show. */
const tradingCards: readonly { id: string; title: MessageId; text: MessageId }[] = [
  { id: "parallel", title: "home_trading_parallel_title", text: "home_trading_parallel_text" },
  { id: "scale", title: "home_trading_scale_title", text: "home_trading_scale_text" },
  { id: "prototype", title: "home_trading_prototype_title", text: "home_trading_prototype_text" },
];

const team: readonly { name: PersonName; role: MessageId }[] = [
  { name: "Marc Gsell", role: "team_role_marc" },
  { name: "Gil Rodrigues", role: "team_role_gil" },
];

/**
 * The elevator pitch, under three minutes of reading in every language (checked at build, see
 * `render.tsx`): the ERP & CRM, which has the largest market; why AI-written code needs checking,
 * the Software Factory that checks it & what it has measured; the Trading Platform & how it tests
 * a strategy; how customer data is kept; who we are, what we offer now, and what to do next.
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
  const erpPage = href(locale, "products", erp);
  const factoryPage = href(locale, "products", factory);
  const tradingPage = href(locale, "research", trading);
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
          founder: {
            "@type": "Person",
            name: company.founder,
            sameAs: people[company.founder].linkedin,
          },
          member: team
            .filter(({ name }) => name !== company.founder)
            .map(({ name }) => ({ "@type": "Person", name, sameAs: people[name].linkedin })),
          address: { "@type": "PostalAddress", addressCountry: "IM" },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            email,
            url: `${origin}${href(locale, "contact")}`,
            availableLanguage: locales.map((code) => localeInfo[code].tag),
          },
        },
        // The moving figures' own stylesheet, in its own `@layer arc`, and the homepage's motion
        // (`rise-css.ts`): cards out of sight until they rise, titles waiting to turn to the ink,
        // both in place at once without JavaScript. Their code is named up front, so it arrives
        // with the page's script, not after it.
        head: (
          <>
            <style dangerouslySetInnerHTML={{ __html: `${numbersCss}\n${riseCss}` }} />
            <noscript>
              <style dangerouslySetInnerHTML={{ __html: noscriptCss }} />
            </noscript>
            {[
              ...new Set([
                ...assets.preload("src/rise.ts"),
                ...assets.preload("src/islands/stat.tsx"),
              ]),
            ].map((url) => (
              <link key={url} rel="modulepreload" href={url} />
            ))}
          </>
        ),
      }}
    >
      <Hero
        title={t.text("home_erp_title")}
        lead={t.text("home_erp_lead")}
        figure={<Machine name="ledger" locale={locale} fill />}
        stage
        reveal
      >
        <Actions>
          <ButtonLink href={contactHref(locale, erp)} kind="primary">
            {t.text("nav_contact")}
          </ButtonLink>
          <ButtonLink href={erpPage} kind="secondary">
            {t.text("home_cta_erp")}
          </ButtonLink>
        </Actions>
      </Hero>
      <Section
        id="why"
        title={<Sweep text={t.text("home_why_title")} />}
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
      <MachineSection
        parts={[
          {
            id: "factory",
            title: <Sweep text={t.text("product_software_factory_name")} translate={false} />,
            intro: t.text("home_lead"),
            blocks: [
              <Actions key="actions">
                <ButtonLink href={factoryPage} kind="secondary">
                  {t.text("home_cta_factory")}
                </ButtonLink>
              </Actions>,
            ],
          },
        ]}
        from={{ part: 0, block: "title" }}
        to={0}
        machine={<Machine name="proof" locale={locale} fill />}
      />
      <Section
        id="measured"
        title={<Sweep text={t.text("home_measured_title")} />}
        intro={t.text("home_measured_intro", { date: graphRuns.date })}
      >
        <dl {...stylex.props(styles.stats)}>
          {stats.map(({ id, value, label }) => (
            // Held out of sight until it rises in (`rise.ts`), its figures rolling up.
            <div key={id} {...stylex.props(styles.stat)} data-rise="">
              <dt {...stylex.props(ui.serif, styles.value)}>
                <Island name="stat" component={Stat} props={{ locale, parts: value }} />
              </dt>
              <dd {...stylex.props(ui.text, ui.label)}>{label}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <MachineSection
        parts={[
          {
            id: "trading",
            title: <Sweep text={t.text("product_trading_platform_name")} translate={false} />,
            intro: t.text("home_trading_lead"),
            blocks: [
              <Actions key="actions">
                <ButtonLink href={tradingPage} kind="secondary">
                  {t.text("home_cta_trading")}
                </ButtonLink>
              </Actions>,
            ],
          },
        ]}
        from={{ part: 0, block: "title" }}
        to={0}
        machine={<Machine name="recorder" locale={locale} fill />}
      />
      <Section id="tested" title={<Sweep text={t.text("home_trading_title")} />}>
        <Cards columns={3}>
          {tradingCards.map(({ id, title, text }) => (
            // Held out of sight until it rises in (`rise.ts`), as the measurements do.
            <Card key={id} rises>
              <h3 {...stylex.props(ui.title)}>{t.text(title)}</h3>
              <p {...stylex.props(ui.prose)}>{t.rich(text, cite)}</p>
            </Card>
          ))}
        </Cards>
      </Section>
      <Section
        id="trust"
        title={<Sweep text={t.text("trust_title")} />}
        intro={t.text("trust_intro")}
      >
        <dl {...stylex.props(styles.facts)}>
          {trust.map(({ term, fact }) => (
            <div key={term} {...stylex.props(styles.fact)}>
              <dt {...stylex.props(ui.title)}>{t.text(term)}</dt>
              <dd {...stylex.props(ui.prose, ui.label)}>{trustText(t, locale, fact)}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="who" title={<Sweep text={t.text("home_who_label")} />}>
        <div {...stylex.props(styles.founder)}>
          <h3 {...stylex.props(ui.title)} {...untranslated}>
            {company.founder}
          </h3>
          <p {...stylex.props(ui.text, ui.label)}>{t.text("team_role_fabian")}</p>
          <p {...stylex.props(ui.lead, styles.bio)}>{t.text("home_who_text")}</p>
          <ProfileLink
            href={people[company.founder].linkedin}
            label={t.text("team_linkedin", { name: company.founder })}
          />
        </div>
        <ul {...stylex.props(styles.team)}>
          {team.map(({ name, role }) => (
            <li key={name} {...stylex.props(styles.member)}>
              <h3 {...stylex.props(ui.title)} {...untranslated}>
                {name}
              </h3>
              <p {...stylex.props(ui.text, ui.label)}>{t.text(role)}</p>
              <ProfileLink href={people[name].linkedin} label={t.text("team_linkedin", { name })} />
            </li>
          ))}
        </ul>
        <div {...stylex.props(styles.after)}>
          <ButtonLink href={href(locale, "about")} kind="secondary">
            {t.text("home_who_more")}
          </ButtonLink>
        </div>
      </Section>
      <Consulting locale={locale} brief />
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
        <ButtonLink href={`${href(locale, "products", erp)}#waitlist`} kind="secondary">
          {t.text("cta_waitlist")}
        </ButtonLink>
      </Actions>
    </CallToAction>
  );
}

/** A trust fact as the page writes it. */
function trustText(t: Translator, locale: Locale, fact: TrustFact): ComponentChildren {
  switch (fact.$) {
    case "fact":
      return t.text(fact.text);
    case "contact":
      return t.rich(fact.text, { link: richLink(href(locale, "contact")) }, { email });
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
