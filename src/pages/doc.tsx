import * as stylex from "@stylexjs/stylex";
import type { Doc } from "../content.ts";
import { translators } from "../i18n.ts";
import { type Assets, Page, Stack, Text, Title } from "../layout.tsx";
import { href, type Locale } from "../locale.ts";
import { Markdown } from "../markdown.tsx";
import { company } from "../site.ts";
import { ui } from "../ui.tsx";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

/** A plain page written in Markdown: About, Privacy, Imprint. */
export function DocPage({
  doc,
  description,
  ...props
}: PageProps & {
  doc: Doc;
  description: string;
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
        script: false,
        mono: false,
      }}
    >
      <Title>{doc.title}</Title>
      <Markdown blocks={doc.blocks} />
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
        script: false,
        mono: false,
      }}
    >
      <Title>{t.text("joined_title")}</Title>
      <Stack>
        <Text>{t.text("joined_text")}</Text>
        <Text>
          <a {...stylex.props(ui.link, ui.focusRing)} href={href(locale, "products")}>
            {t.text("back_to_products")}
          </a>
        </Text>
      </Stack>
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
        script: false,
        mono: false,
      }}
    >
      <Title>{t.text("not_found_title")}</Title>
      <Stack>
        <Text>{t.text("not_found_text")}</Text>
        <Text>
          <a {...stylex.props(ui.link, ui.focusRing)} href={href(locale, "home")}>
            {t.text("not_found_home")}
          </a>
        </Text>
      </Stack>
    </Page>
  );
}
