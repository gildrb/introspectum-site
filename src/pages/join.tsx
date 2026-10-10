import * as stylex from "@stylexjs/stylex";
import { translators } from "../i18n.ts";
import { type Assets, Page, Text, Title } from "../layout.tsx";
import type { Locale } from "../locale.ts";
import { company, email, mailto, roles } from "../site.ts";
import { colors, space } from "../tokens.stylex.ts";
import { richLink, ui } from "../ui.tsx";

export function JoinPage({
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
        title: t.text("page_title", { brand: company.name, page: t.text("join_title") }),
        description: t.text("join_description"),
        shareImage,
        type: "website",
        index: true,
        script: false,
        mono: false,
      }}
    >
      <Title>{t.text("join_title")}</Title>
      <Text lead>{t.text("join_intro")}</Text>
      {roles.map((role) => (
        <section {...stylex.props(styles.role)} aria-labelledby={role.title}>
          <h2 {...stylex.props(ui.text, ui.label, styles.title)} id={role.title}>
            {t.text(role.title)}
          </h2>
          {role.intro.map((paragraph) => (
            <p {...stylex.props(ui.text, ui.prose, styles.paragraph)}>{t.text(paragraph)}</p>
          ))}
          {role.lists.map(({ label, items }) => (
            <>
              <h3 {...stylex.props(ui.text, styles.listLabel)}>{t.text(label)}</h3>
              <ul {...stylex.props(ui.text, ui.prose, styles.list)}>
                {items.map((item) => (
                  <li {...stylex.props(styles.item)}>{t.text(item)}</li>
                ))}
              </ul>
            </>
          ))}
          <p {...stylex.props(ui.text, ui.prose, styles.paragraph)}>
            {t.rich(role.apply, { link: richLink(mailto(t.text(role.subject))) }, { email })}
          </p>
        </section>
      ))}
    </Page>
  );
}

const styles = stylex.create({
  role: { marginTop: space.x6 },
  title: { marginBottom: space.x1 },
  paragraph: { marginTop: { default: space.x2, ":first-of-type": 0 } },
  listLabel: { marginTop: space.x4, color: colors.primary },
  list: { marginTop: space.x1, paddingInlineStart: space.x3 },
  item: { marginTop: { default: space.x1, ":first-child": 0 } },
});
