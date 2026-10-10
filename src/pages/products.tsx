import * as stylex from "@stylexjs/stylex";
import { translators, waitlistConsent } from "../i18n.ts";
import { Island } from "../island.tsx";
import { Waitlist } from "../islands/waitlist.tsx";
import { type Assets, Lines, Page, Section, Stack, Text, Title } from "../layout.tsx";
import { href, type Locale } from "../locale.ts";
import { company, email, mailto, type Product, products } from "../site.ts";
import { space } from "../tokens.stylex.ts";
import { richLink, ui } from "../ui.tsx";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

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
      <Title>{t.text("products_title")}</Title>
      <Text lead>{t.text("products_intro")}</Text>
      <ul {...stylex.props(styles.entries)}>
        {products.map((product) => (
          <li>
            <a
              {...stylex.props(ui.text, ui.entry, ui.onward, ui.focusRing)}
              href={href(locale, "products", product.slug)}
            >
              {t.text(product.name)}
            </a>
            <p {...stylex.props(ui.text, ui.note)}>{t.text(product.status)}</p>
            <Text>{t.text(product.what)}</Text>
            <Text quiet>{t.text(product.audience)}</Text>
          </li>
        ))}
      </ul>
      <Section id="consulting" label={t.text("consulting_name")}>
        <Text>{t.text("consulting_what")}</Text>
        <Text>{t.text("consulting_audience")}</Text>
        <Text>
          <a {...stylex.props(ui.link, ui.focusRing)} href={mailto(t.text("consulting_subject"))}>
            {t.text("consulting_link")}
          </a>
        </Text>
      </Section>
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
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title_nested", {
          brand: company.name,
          section: t.text("products_title"),
          page: name,
        }),
        description: t.text(product.what),
        shareImage,
        type: "website",
        index: true,
        script: true,
        mono: false,
      }}
    >
      <Title note={t.text(product.status)}>{name}</Title>
      <Stack>
        <Text lead>{t.text(product.what)}</Text>
        <Text>{t.text(product.audience)}</Text>
        {product.details.map((paragraph) => (
          <Text>{t.text(paragraph)}</Text>
        ))}
      </Stack>
      <Section id="methods" label={t.text("methods_label")}>
        <Lines items={product.methods.map((method) => t.text(method))} />
      </Section>
      <Section id="waitlist" label={t.text("waitlist_label")}>
        <Text>{t.text("waitlist_intro", { product: name })}</Text>
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
        <Text quiet>{t.rich("waitlist_privacy", { link: richLink(href(locale, "privacy")) })}</Text>
      </Section>
      <Section id="consulting" label={t.text("consulting_name")}>
        <Text>
          <a
            {...stylex.props(ui.link, ui.focusRing)}
            href={mailto(t.text("consulting_subject_product", { product: name }))}
          >
            {t.text("consulting_link")}
          </a>
        </Text>
      </Section>
    </Page>
  );
}

const styles = stylex.create({
  entries: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x3,
    marginTop: space.x6,
    listStyle: "none",
  },
});
