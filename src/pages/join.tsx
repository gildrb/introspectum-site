import * as stylex from "@stylexjs/stylex";
import { Actions, ButtonLink, Card, Cards, Content, Hero } from "../blocks.tsx";
import { translators } from "../i18n.ts";
import { type Assets, Page } from "../layout.tsx";
import type { Locale } from "../locale.ts";
import { company, email, mailto, roles } from "../site.ts";
import { space } from "../tokens.stylex.ts";
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
        mono: false,
      }}
    >
      <Hero title={t.text("join_title")} lead={t.text("join_intro")} />
      <Content>
        <Cards columns={2}>
          {roles.map((role) => {
            const apply = mailto(t.text(role.subject));
            return (
              <Card>
                <h2 {...stylex.props(ui.title)}>{t.text(role.title)}</h2>
                {role.intro.map((paragraph) => (
                  <p {...stylex.props(ui.prose)}>{t.text(paragraph)}</p>
                ))}
                {role.lists.map(({ label, items }) => (
                  <div {...stylex.props(styles.list)}>
                    <h3 {...stylex.props(ui.text, ui.strong)}>{t.text(label)}</h3>
                    <ul {...stylex.props(ui.prose, styles.items)}>
                      {items.map((item) => (
                        <li>{t.text(item)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p {...stylex.props(ui.prose, ui.label)}>
                  {t.rich(role.apply, { link: richLink(apply) }, { email })}
                </p>
                <div {...stylex.props(styles.apply)}>
                  <Actions>
                    <ButtonLink href={apply} kind="primary">
                      {t.text("role_apply_button")}
                    </ButtonLink>
                  </Actions>
                </div>
              </Card>
            );
          })}
        </Cards>
      </Content>
    </Page>
  );
}

const styles = stylex.create({
  list: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    marginTop: space.x1,
  },
  items: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    paddingInlineStart: space.x3,
  },
  apply: { marginTop: "auto" },
});
