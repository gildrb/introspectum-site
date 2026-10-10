import * as stylex from "@stylexjs/stylex";
import type { VNode } from "preact";
import { Actions, ButtonLink, CallToAction, Card, Cards, Hero, Section } from "../blocks.tsx";
import { type MessageId, translators } from "../i18n.ts";
import { type Assets, Page } from "../layout.tsx";
import { href, type Locale } from "../locale.ts";
import { company, email, mailto, methods, origin, principles } from "../site.ts";
import { colors, media, space } from "../tokens.stylex.ts";
import { ui, untranslated } from "../ui.tsx";
import { Consulting, ProductCards } from "./products.tsx";

/** The survey behind the "why": two results a visitor can check at the source. */
const survey = {
  distrust: 0.96,
  verify: 0.48,
  href: "https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/",
};

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
  const source = (chunks: Array<string | VNode>) => (
    <a
      {...stylex.props(ui.link, ui.focusRing)}
      href={survey.href}
      target="_blank"
      rel="noopener noreferrer"
      hreflang="en"
    >
      {chunks}
    </a>
  );
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
        script: false,
        mono: false,
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
      <Section id="why" title={t.text("home_why_title")} intro={t.text("home_why_text")}>
        <ul {...stylex.props(styles.stats)}>
          {(
            [
              [survey.distrust, "home_stat_distrust"],
              [survey.verify, "home_stat_verify"],
            ] as const
          ).map(([value, caption]) => (
            <li {...stylex.props(styles.stat)}>
              <p {...stylex.props(ui.display)}>{t.text("percent", { value })}</p>
              <p {...stylex.props(ui.prose, ui.label)}>{t.text(caption)}</p>
            </li>
          ))}
        </ul>
        <p {...stylex.props(ui.small, ui.note, styles.source)}>
          {t.rich("home_stat_source", { link: source }, { source: t.text("home_hook_source") })}
        </p>
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
    </Page>
  );
}

/** The closing call to action of the homepage and of every blog post. */
export function Closing({ locale }: { locale: Locale }) {
  const t = translators[locale];
  return (
    <CallToAction id="next" title={t.text("cta_title")} text={t.text("cta_text")}>
      <Actions>
        <ButtonLink href={mailto(t.text("consulting_subject"))} kind="inverse">
          {t.text("consulting_link")}
        </ButtonLink>
        <ButtonLink href={href(locale, "products")} kind="inverseOutline">
          {t.text("cta_waitlist")}
        </ButtonLink>
      </Actions>
    </CallToAction>
  );
}

const styles = stylex.create({
  stats: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(2, minmax(0, 1fr))",
    },
    gap: { default: space.x4, [media.desktop]: space.x3 },
    listStyle: "none",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    paddingTop: space.x3,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "currentColor",
  },
  source: { marginTop: space.x3 },
  team: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [media.desktop]: "repeat(3, minmax(0, 1fr))",
    },
    gap: space.x3,
    listStyle: "none",
  },
  member: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    paddingTop: space.x2,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
  },
  after: { marginTop: { default: space.x4, [media.desktop]: space.x5 } },
});
