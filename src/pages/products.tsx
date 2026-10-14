import * as stylex from "@stylexjs/stylex";
import {
  Actions,
  ButtonLink,
  MachineSection,
  Card,
  Cards,
  citeTags,
  Content,
  Figure,
  Hero,
  Measure,
  Section,
  Sources,
  Text,
} from "../blocks.tsx";
import { type Tag, type Translator, translators, waitlistConsent } from "../i18n.ts";
import { Island } from "../island.tsx";
import { Waitlist } from "../islands/waitlist.tsx";
import { type Assets, Page } from "../layout.tsx";
import { Machine } from "../figures/machine.tsx";
import { href, type Locale } from "../locale.ts";
import {
  company,
  contactHref,
  email,
  type InquiryTopic,
  isInquiryTopic,
  numbered,
  offers,
  type Paragraph,
  pilot,
  type Product,
  type Shelf,
  shelved,
} from "../site.ts";
import { colors, media, space } from "../tokens.stylex.ts";
import { richLink, ui } from "../ui.tsx";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

/**
 * The products on a shelf as cards: its figure, name, what it does, for whom, and, for products we
 * sell, its waiting list. The figure is decoration here; the product's page describes and credits it.
 */
export function ProductCards({
  locale,
  heading,
  shelf,
}: {
  locale: Locale;
  heading: "h2" | "h3";
  shelf: Shelf;
}) {
  const t = translators[locale];
  const Heading = heading;
  const list = shelved(shelf);
  return (
    <Cards columns={list.length === 1 ? 2 : list.length === 2 ? 2 : 3}>
      {list.map((product) => {
        const page = href(locale, product.shelf, product.slug);
        const name = t.text(product.name);
        return (
          <Card
            key={product.slug}
            figure={<Figure illustration={product.illustration} alt="" placement="card" />}
          >
            <Heading {...stylex.props(ui.title)}>
              <a {...stylex.props(ui.entry, ui.focusRing)} href={page}>
                {name}
              </a>
            </Heading>
            <p {...stylex.props(ui.prose)}>{t.text(product.what)}</p>
            <p {...stylex.props(ui.prose, ui.label)}>{t.text(product.audience)}</p>
            {product.shelf === "products" && (
              <a
                {...stylex.props(ui.text, ui.link, ui.focusRing, styles.cardLink)}
                href={`${page}#waitlist`}
                aria-label={t.text("product_waitlist_link_label", { product: name })}
              >
                {t.text("product_waitlist_link")}
              </a>
            )}
          </Card>
        );
      })}
    </Cards>
  );
}

/**
 * What the company offers clients now, before its products ship: fixed-scope offers, each with
 * what it delivers, how long it takes, what it costs from, and a way to ask for it.
 */
export function Consulting({ locale }: { locale: Locale }) {
  const t = translators[locale];
  return (
    <Section id="consulting" title={t.text("consulting_title")} intro={t.text("consulting_what")}>
      <Cards columns={2}>
        {offers.map((offer) => (
          <Card key={offer.topic}>
            <h3 {...stylex.props(ui.title)}>{t.text(offer.title)}</h3>
            <p {...stylex.props(ui.prose)}>{t.text(offer.text)}</p>
            <p {...stylex.props(ui.prose, ui.label)}>{t.text(offer.result)}</p>
            {/* Duration & price only once decided: no placeholder stands in for them. */}
            {(offer.weeks !== null || offer.priceFrom !== null) && (
              <dl {...stylex.props(ui.text, styles.terms)}>
                {offer.weeks !== null && (
                  <div {...stylex.props(styles.term)}>
                    <dt {...stylex.props(ui.label)}>{t.text("offer_duration_label")}</dt>
                    <dd>{t.text("offer_duration", { weeks: offer.weeks })}</dd>
                  </div>
                )}
                {offer.priceFrom !== null && (
                  <div {...stylex.props(styles.term)}>
                    <dt {...stylex.props(ui.label)}>{t.text("offer_price_label")}</dt>
                    <dd>{t.text("offer_price", { price: offer.priceFrom })}</dd>
                  </div>
                )}
              </dl>
            )}
            <div {...stylex.props(styles.cardLink)}>
              <ButtonLink href={contactHref(locale, offer.topic)} kind="secondary">
                {t.text("offer_ask")}
              </ButtonLink>
            </div>
          </Card>
        ))}
      </Cards>
      <div {...stylex.props(ui.textWidth, styles.after)}>
        <Text quiet>{t.text("consulting_audience")}</Text>
      </div>
    </Section>
  );
}

/** A shelf's overview: the product overview with consulting, or the research we publish. */
export function ProductsPage({
  assets,
  locale,
  path,
  alternates,
  shareImage,
  shelf,
}: PageProps & { shelf: Shelf }) {
  const t = translators[locale];
  const title = t.text(shelf === "products" ? "products_title" : "research_title");
  const intro = t.text(shelf === "products" ? "products_intro" : "research_intro");
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: title }),
        description: intro,
        shareImage,
        type: "website",
        index: true,
        mono: false,
        italic: false,
      }}
    >
      <Hero title={title} lead={intro} />
      <Content>
        <ProductCards locale={locale} heading="h2" shelf={shelf} />
      </Content>
      {shelf === "products" && <Consulting locale={locale} />}
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
  const topic = inquiryTopicOf(product);
  const citations = numbered(product.sources);
  const cite = citeTags(t, citations);
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
        // The diagram's names are set in the monospace face.
        mono: product.diagram !== undefined,
        italic: false,
      }}
    >
      <Hero
        title={name}
        lead={t.text(product.what)}
        figure={
          product.diagram === undefined ? (
            <Figure
              illustration={product.illustration}
              alt={t.text(product.illustration.alt)}
              placement="band"
              priority
            />
          ) : (
            <div {...stylex.props(styles.plate)}>
              <div {...stylex.props(styles.engraving)}>
                <Figure
                  illustration={product.illustration}
                  alt={t.text(product.illustration.alt)}
                  placement="band"
                  priority
                />
              </div>
              <div {...stylex.props(styles.diagram)}>
                <Machine name={product.diagram} locale={locale} />
              </div>
            </div>
          )
        }
        // The engraving and its diagram need more height than the opening's text.
        stage={product.diagram !== undefined}
      >
        <p {...stylex.props(ui.prose, ui.label)}>{t.text(product.audience)}</p>
        {topic !== null && (
          <Actions>
            <ButtonLink href="#waitlist" kind="primary">
              {t.text("product_waitlist_link")}
            </ButtonLink>
            <ButtonLink href={contactHref(locale, topic)} kind="secondary">
              {t.text("nav_contact")}
            </ButtonLink>
          </Actions>
        )}
      </Hero>
      {product.machine === undefined ? (
        <>
          <Section id="how" title={t.text("product_how_label")}>
            <Paragraphs t={t} cite={cite} paragraphs={product.how} />
          </Section>
          <Section id="state" title={t.text("product_state_label")}>
            <Paragraphs t={t} cite={cite} paragraphs={product.state} />
          </Section>
        </>
      ) : (
        <MachineSection
          parts={[
            {
              id: "how",
              title: t.text("product_how_label"),
              blocks: product.how.map(({ text, values }) => (
                <Text key={text}>{t.rich(text, cite, values)}</Text>
              )),
            },
            {
              id: "state",
              title: t.text("product_state_label"),
              blocks: product.state.map(({ text, values }) => (
                <Text key={text}>{t.rich(text, cite, values)}</Text>
              )),
            },
          ]}
          from={{ part: 0, block: product.machine.from }}
          to={product.machine.through === "state" ? 1 : 0}
          machine={<Machine name={product.machine.name} locale={locale} fill />}
        />
      )}
      {product.shelf === "products" && (
        <Section
          id="waitlist"
          title={t.text("waitlist_label")}
          intro={t.text("waitlist_intro", { product: name })}
        >
          <div {...stylex.props(ui.textWidth, styles.after)}>
            <h3 {...stylex.props(ui.title)}>{t.text("waitlist_next_title")}</h3>
            <ol {...stylex.props(ui.text, styles.steps)}>
              <li>{t.text("waitlist_next_reply")}</li>
              <li>
                {pilot.spots === null
                  ? t.text("waitlist_next_spots_open")
                  : t.text("waitlist_next_spots", { spots: pilot.spots })}
              </li>
              <li>
                {pilot.opens === null
                  ? t.text("waitlist_next_opens_open")
                  : t.text("waitlist_next_opens", { opens: pilot.opens })}
              </li>
            </ol>
          </div>
          <div {...stylex.props(ui.textWidth, styles.form, styles.formAfter)}>
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
      )}
      <Sources id="sources" title={t.text("sources_title")} list={citations} />
    </Page>
  );
}

/** A product page's paragraphs in the text width, their tags citing the page's sources. */
function Paragraphs({
  t,
  cite,
  paragraphs,
}: {
  t: Translator;
  cite: Readonly<Record<string, Tag>>;
  paragraphs: readonly Paragraph[];
}) {
  return (
    <Measure>
      {paragraphs.map(({ text, values }) => (
        <Text key={text}>{t.rich(text, cite, values)}</Text>
      ))}
    </Measure>
  );
}

/** The contact form's topic for a product we sell; research has none. */
function inquiryTopicOf(product: Product): InquiryTopic | null {
  if (product.shelf === "research") return null;
  return isInquiryTopic(product.slug) ? product.slug : null;
}

const styles = stylex.create({
  cardLink: { marginTop: "auto", paddingTop: space.x1 },
  /** An offer's duration and price, label above value, side by side. */
  terms: { display: "flex", columnGap: space.x4, rowGap: space.x1, flexWrap: "wrap" },
  term: { display: "flex", flexDirection: "column" },
  steps: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    paddingInlineStart: space.x3,
  },
  formAfter: { marginTop: { default: space.x4, [media.desktop]: space.x5 } },
  after: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: space.x2,
    marginTop: { default: space.x5, [media.desktop]: space.x6 },
  },
  form: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x3,
    padding: { default: space.x3, [media.desktop]: space.x4 },
    borderRadius: space.x1,
    backgroundColor: colors.surface,
  },
  /**
   * The opening's illustration with its diagram under it (`Product.diagram`): on wide screens the
   * pair fills the band beside the text, the illustration shrinking to what the diagram leaves.
   */
  plate: {
    display: "flex",
    flexDirection: "column",
    rowGap: { default: space.x6, [media.wide]: space.x4 },
    minHeight: { default: null, [media.wide]: "100%" },
  },
  engraving: {
    position: { default: null, [media.wide]: "relative" },
    flex: { default: null, [media.wide]: "1 1 auto" },
    minHeight: { default: null, [media.wide]: space.x20 },
  },
  /** As wide as its names stay a little under the text's size, on phones the column's width. */
  diagram: { width: "100%", maxWidth: "26rem", marginInline: "auto" },
});
