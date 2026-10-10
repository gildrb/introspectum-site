import * as stylex from "@stylexjs/stylex";
import { Actions, ButtonLink, Card, Cards, Hero, Measure, Section, Text } from "../blocks.tsx";
import { translators, waitlistConsent } from "../i18n.ts";
import { Island } from "../island.tsx";
import { Waitlist } from "../islands/waitlist.tsx";
import { type Assets, Page } from "../layout.tsx";
import { href, type Locale } from "../locale.ts";
import { company, email, mailto, type Product, products } from "../site.ts";
import { colors, media, space } from "../tokens.stylex.ts";
import { richLink, ui } from "../ui.tsx";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

/** The three products as cards: name, what it does, for whom, and its waiting list. */
export function ProductCards({ locale, heading }: { locale: Locale; heading: "h2" | "h3" }) {
  const t = translators[locale];
  const Heading = heading;
  return (
    <Cards columns={3}>
      {products.map((product) => {
        const page = href(locale, "products", product.slug);
        const name = t.text(product.name);
        return (
          <Card>
            <Heading {...stylex.props(ui.title)}>
              <a {...stylex.props(ui.entry, ui.focusRing)} href={page}>
                {name}
              </a>
            </Heading>
            <p {...stylex.props(ui.prose)}>{t.text(product.what)}</p>
            <p {...stylex.props(ui.prose, ui.label)}>{t.text(product.audience)}</p>
            <a
              {...stylex.props(ui.text, ui.link, ui.focusRing, styles.cardLink)}
              href={`${page}#waitlist`}
              aria-label={t.text("product_waitlist_link_label", { product: name })}
            >
              {t.text("product_waitlist_link")}
            </a>
          </Card>
        );
      })}
    </Cards>
  );
}

const offers = [
  { title: "consulting_ai_title", text: "consulting_ai_text" },
  { title: "consulting_erp_title", text: "consulting_erp_text" },
] as const;

/** What the company offers clients now, before its products ship, and how to ask for it. */
export function Consulting({ locale }: { locale: Locale }) {
  const t = translators[locale];
  return (
    <Section id="consulting" title={t.text("consulting_title")} intro={t.text("consulting_what")}>
      <Cards columns={2}>
        {offers.map(({ title, text }) => (
          <Card>
            <h3 {...stylex.props(ui.title)}>{t.text(title)}</h3>
            <p {...stylex.props(ui.prose)}>{t.text(text)}</p>
          </Card>
        ))}
      </Cards>
      <div {...stylex.props(styles.after)}>
        <Text quiet>{t.text("consulting_audience")}</Text>
        <Actions>
          <ButtonLink href={mailto(t.text("consulting_subject"))} kind="primary">
            {t.text("consulting_link")}
          </ButtonLink>
        </Actions>
      </div>
    </Section>
  );
}

export function ProductsPage({ assets, locale, path, alternates, shareImage }: PageProps) {
  const t = translators[locale];
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: t.text("products_title") }),
        description: t.text("products_intro"),
        shareImage,
        type: "website",
        index: true,
        script: false,
        mono: false,
      }}
    >
      <Hero title={t.text("products_title")} lead={t.text("products_intro")} />
      <div {...stylex.props(ui.container, styles.cards)}>
        <ProductCards locale={locale} heading="h2" />
      </div>
      <Consulting locale={locale} />
    </Page>
  );
}

export function ProductPage({
  product,
  ...props
}: PageProps & {
  product: Product;
}) {
  const { assets, locale, path, alternates, shareImage } = props;
  const t = translators[locale];
  const name = t.text(product.name);
  const inquiry = mailto(t.text("consulting_subject_product", { product: name }));
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: name }),
        description: t.text(product.what),
        shareImage,
        type: "website",
        index: true,
        script: true,
        mono: false,
      }}
    >
      <Hero title={name} lead={t.text(product.what)}>
        <p {...stylex.props(ui.prose, ui.label, styles.audience)}>{t.text(product.audience)}</p>
        <Actions>
          <ButtonLink href="#waitlist" kind="primary">
            {t.text("product_waitlist_link")}
          </ButtonLink>
          <ButtonLink href={inquiry} kind="secondary">
            {t.text("consulting_link")}
          </ButtonLink>
        </Actions>
      </Hero>
      <Section id="how" title={t.text("product_how_label")}>
        <Measure>
          {product.details.map((paragraph) => (
            <Text>{t.text(paragraph)}</Text>
          ))}
        </Measure>
      </Section>
      <Section
        id="waitlist"
        title={t.text("waitlist_label")}
        intro={t.text("waitlist_intro", { product: name })}
      >
        <div {...stylex.props(styles.form)}>
          <Island
            name="waitlist"
            component={Waitlist}
            props={{
              product: product.slug,
              locale,
              text: {
                email: t.text("waitlist_email_label"),
                company: t.text("waitlist_company_label"),
                honeypot: t.text("waitlist_honeypot_label"),
                consent: waitlistConsent(locale, product),
                submit: t.text("waitlist_submit"),
                sending: t.text("waitlist_sending"),
                joined: t.text("waitlist_joined"),
                failedConnection: t.text("waitlist_failed_connection", { email }),
                failedServer: t.text("waitlist_failed_server", { email }),
              },
            }}
          />
          <p {...stylex.props(ui.small, ui.label)}>
            {t.rich("waitlist_privacy", { link: richLink(href(locale, "privacy")) })}
          </p>
        </div>
      </Section>
    </Page>
  );
}

const styles = stylex.create({
  cards: { paddingBottom: { default: space.x8, [media.desktop]: space.x12 } },
  cardLink: { marginTop: "auto", paddingTop: space.x1 },
  after: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: space.x2,
    marginTop: { default: space.x4, [media.desktop]: space.x5 },
  },
  audience: { maxWidth: space.measure },
  form: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x3,
    maxWidth: space.measure,
    padding: { default: space.x3, [media.desktop]: space.x4 },
    borderRadius: space.x2,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.hairline,
  },
});
