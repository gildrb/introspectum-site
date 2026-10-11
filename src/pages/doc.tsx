import { Actions, Article, ButtonLink, Figure, Hero } from "../blocks.tsx";
import type { Doc } from "../content.ts";
import { translators } from "../i18n.ts";
import { type Assets, Page } from "../layout.tsx";
import { href, type Locale } from "../locale.ts";
import { Markdown } from "../markdown.tsx";
import { company, type Illustration } from "../site.ts";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

/** A plain page written in Markdown: About, Privacy, Imprint. `illustration` stands beside it. */
export function DocPage({
  doc,
  description,
  illustration,
  ...props
}: PageProps & {
  doc: Doc;
  description: string;
  illustration?: Illustration;
}) {
  const { assets, locale, path, alternates, shareImage } = props;
  const t = translators[locale];
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
      }}
    >
      <Article
        title={doc.title}
        figure={
          illustration === undefined ? undefined : (
            <Figure
              illustration={illustration}
              alt={t.text(illustration.alt)}
              placement="beside"
              priority
            />
          )
        }
      >
        <Markdown blocks={doc.blocks} />
      </Article>
    </Page>
  );
}

/** Where a waiting-list sign-up lands when the form was sent without JavaScript. */
export function JoinedPage({ assets, locale, path, alternates, shareImage }: PageProps) {
  const t = translators[locale];
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: t.text("waitlist_label") }),
        description: t.text("joined_text"),
        shareImage,
        type: "website",
        index: false,
        mono: false,
      }}
    >
      <Hero title={t.text("joined_title")} lead={t.text("joined_text")}>
        <Actions>
          <ButtonLink href={href(locale, "products")} kind="secondary">
            {t.text("back_to_products")}
          </ButtonLink>
        </Actions>
      </Hero>
    </Page>
  );
}

/**
 * The page for a path that does not exist, `404.html` in each locale's folder: the server answers
 * with it and a 404 status.
 */
export function NotFoundPage({ assets, locale, path, shareImage }: Omit<PageProps, "alternates">) {
  const t = translators[locale];
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        title: t.text("page_title", { brand: company.name, page: t.text("not_found_title") }),
        description: t.text("not_found_text"),
        shareImage,
        type: "website",
        index: false,
        mono: false,
      }}
    >
      <Hero title={t.text("not_found_title")} lead={t.text("not_found_text")}>
        <Actions>
          <ButtonLink href={href(locale, "home")} kind="primary">
            {t.text("not_found_home")}
          </ButtonLink>
        </Actions>
      </Hero>
    </Page>
  );
}
