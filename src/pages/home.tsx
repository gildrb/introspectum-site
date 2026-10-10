import * as stylex from "@stylexjs/stylex";
import { translators } from "../i18n.ts";
import { type Assets, Lines, Page, Section, Text } from "../layout.tsx";
import { href, type Locale } from "../locale.ts";
import { company, email, mailto, methods, origin, principles, products } from "../site.ts";
import { colors, space } from "../tokens.stylex.ts";
import { richLink as link, ui } from "../ui.tsx";

/** The opening line: a survey result the visitor can check, with its source. */
const hook = {
  distrust: 0.96,
  verify: 0.48,
  href: "https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/",
};

/**
 * The elevator pitch, under three minutes of reading in every language (checked at build, see
 * `render.tsx`). It opens on the Golden Circle (a hook answered by why, then what and how) and
 * closes on the Redneruhr's remaining steps: who we are and what to do next.
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
      <p {...stylex.props(ui.heading, styles.hook)}>
        {t.text("home_hook", { distrust: hook.distrust, verify: hook.verify })}
      </p>
      <p {...stylex.props(ui.text, styles.source)}>
        <a
          {...stylex.props(ui.quiet, ui.focusRing, ui.outbound)}
          href={hook.href}
          target="_blank"
          rel="noopener noreferrer"
          hreflang="en"
        >
          {t.text("home_hook_source")}
        </a>
      </p>
      <Section id="why" label={t.text("home_why_label")}>
        <Text>{t.text("home_why_text")}</Text>
      </Section>
      <Section id="what" label={t.text("home_what_label")}>
        <ul {...stylex.props(styles.entries)}>
          {products.map((product) => (
            <li>
              <a
                {...stylex.props(ui.text, ui.entry, ui.onward, ui.focusRing)}
                href={href(locale, "products", product.slug)}
              >
                {t.text(product.name)}
              </a>
              <Text>{t.text(product.what)}</Text>
              <Text quiet>{t.text(product.audience)}</Text>
            </li>
          ))}
          <li>
            <a
              {...stylex.props(ui.text, ui.entry, ui.focusRing)}
              href={mailto(t.text("consulting_subject"))}
            >
              {t.text("consulting_name")}
            </a>
            <Text>{t.text("consulting_what")}</Text>
            <Text quiet>{t.text("consulting_audience")}</Text>
          </li>
        </ul>
      </Section>
      <Section id="how" label={t.text("home_how_label")}>
        <div {...stylex.props(styles.lists)}>
          <div>
            <h3 {...stylex.props(ui.text, ui.note)}>{t.text("methods_label")}</h3>
            <Lines items={methods.map((id) => t.text(id))} />
          </div>
          <div>
            <h3 {...stylex.props(ui.text, ui.note)}>{t.text("principles_label")}</h3>
            <Lines items={principles.map((id) => t.text(id))} />
          </div>
        </div>
      </Section>
      <Section id="who" label={t.text("home_who_label")}>
        <Text>{t.text("home_who_text")}</Text>
        <Text>
          <a {...stylex.props(ui.link, ui.onward, ui.focusRing)} href={href(locale, "about")}>
            {t.text("home_who_more")}
          </a>
        </Text>
      </Section>
      <NextSteps locale={locale} />
    </Page>
  );
}

/** What a visitor can do next; it closes the homepage and every blog post. */
export function NextSteps({ locale }: { locale: Locale }) {
  const t = translators[locale];
  return (
    <Section id="next" label={t.text("home_next_label")}>
      <Text>{t.rich("home_next_waitlist", { link: link(href(locale, "products")) })}</Text>
      <Text>
        {t.rich("home_next_consulting", { link: link(mailto(t.text("consulting_subject"))) })}
      </Text>
      <Text>{t.rich("home_next_join", { link: link(href(locale, "join")) })}</Text>
    </Section>
  );
}

const styles = stylex.create({
  hook: { maxWidth: space.content },
  source: { marginTop: space.x1, color: colors.tertiary },
  entries: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x3,
    listStyle: "none",
  },
  /** Methods and principles side by side where they fit, one under the other where not. */
  lists: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: space.x6,
    rowGap: space.x3,
  },
});
