import * as stylex from "@stylexjs/stylex";
import {
  Actions,
  ButtonLink,
  CallToAction,
  Card,
  Cards,
  citeTags,
  Figure,
  Hero,
  Measure,
  Section,
  Sources,
  Text,
} from "../blocks.tsx";
import { type MessageId, translators } from "../i18n.ts";
import { type Assets, Page } from "../layout.tsx";
import { href, type Locale } from "../locale.ts";
import {
  company,
  email,
  illustrations,
  mailto,
  methods,
  numbered,
  origin,
  principles,
} from "../site.ts";
import { grid, media, space } from "../tokens.stylex.ts";
import { ui, untranslated } from "../ui.tsx";
import { Consulting, ProductCards } from "./products.tsx";

/** The survey results behind the "why", as shares of the developers asked (see `sources.sonar`). */
const survey = { distrust: 0.96, verify: 0.48, effort: 0.38 };

const citations = numbered(["sonar"]);

const team: readonly { name: string; role: MessageId }[] = [
  { name: "Fabian Klopfer", role: "team_role_fabian" },
  { name: "Marc Gsell", role: "team_role_marc" },
  { name: "Gil Rodrigues", role: "team_role_gil" },
];

/**
 * The elevator pitch, under three minutes of reading in every language (checked at build, see
 * `render.tsx`): the promise, why it matters, what we build, how we work, who we are, and what to
 * do next.
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
        },
      }}
    >
      <Hero title={t.text("tagline")} lead={t.text("home_lead")}>
        <Actions>
          <ButtonLink href={mailto(t.text("consulting_subject"))} kind="primary">
            {t.text("nav_contact")}
          </ButtonLink>
          <ButtonLink href={href(locale, "products")} kind="secondary">
            {t.text("home_cta_products")}
          </ButtonLink>
        </Actions>
      </Hero>
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
            placement="beside"
          />
        }
      >
        <Measure>
          <Text>{t.rich("home_why_review", cite, { effort: survey.effort })}</Text>
          <Text>{t.text("home_why_text")}</Text>
        </Measure>
      </Section>
      <Section id="products" title={t.text("home_what_label")} intro={t.text("products_intro")}>
        <ProductCards locale={locale} heading="h3" />
      </Section>
      <Consulting locale={locale} />
      <Section
        id="how"
        title={t.text("home_how_label")}
        intro={t.text("home_methods", { methods: t.list(methods.map((method) => t.text(method))) })}
      >
        <Cards columns={3}>
          {principles.map(({ name, text }) => (
            <Card>
              <h3 {...stylex.props(ui.title)}>{t.text(name)}</h3>
              <p {...stylex.props(ui.prose)}>{t.text(text)}</p>
            </Card>
          ))}
        </Cards>
      </Section>
      <Section id="who" title={t.text("home_who_label")} intro={t.text("home_who_text")}>
        <ul {...stylex.props(styles.team)}>
          {team.map(({ name, role }) => (
            <li {...stylex.props(styles.member)}>
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
        <ButtonLink href={mailto(t.text("consulting_subject"))} kind="primary">
          {t.text("consulting_link")}
        </ButtonLink>
        <ButtonLink href={href(locale, "products")} kind="secondary">
          {t.text("cta_waitlist")}
        </ButtonLink>
      </Actions>
    </CallToAction>
  );
}

const styles = stylex.create({
  /** The team in three columns on the card lines, without panels. */
  team: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(3, minmax(0, 1fr))",
    },
    gap: grid.gutter,
    listStyle: "none",
  },
  member: { display: "flex", flexDirection: "column", rowGap: space.x1, textWrap: "balance" },
  after: { marginTop: { default: space.x5, [media.desktop]: space.x6 } },
});
