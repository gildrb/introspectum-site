import * as stylex from "@stylexjs/stylex";
import { Article, Card, Cards, Content, Hero } from "../blocks.tsx";
import { type Post, posts } from "../content.ts";
import { day, translators } from "../i18n.ts";
import { type Assets, Page } from "../layout.tsx";
import { href, type Locale, localeInfo } from "../locale.ts";
import { Markdown, usesItalic } from "../markdown.tsx";
import { authors, company, origin } from "../site.ts";
import { space } from "../tokens.stylex.ts";
import { richLink, ui } from "../ui.tsx";
import { Closing } from "./home.tsx";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

export function BlogPage({ assets, locale, path, alternates, shareImage }: PageProps) {
  const t = translators[locale];
  const list = posts[locale];
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: t.text("blog_title") }),
        description: t.text("blog_intro"),
        shareImage,
        type: "website",
        index: true,
        mono: false,
        italic: false,
      }}
    >
      <Hero title={t.text("blog_title")} lead={t.text("blog_intro")}>
        <p {...stylex.props(ui.small, ui.label)}>
          {t.rich("blog_feed", { link: richLink(`${localeInfo[locale].prefix}/feed.xml`) })}
        </p>
      </Hero>
      <Content>
        {list.length === 0 ? (
          <p {...stylex.props(ui.prose, ui.label, ui.textWidth)}>{t.text("blog_empty")}</p>
        ) : (
          <Cards columns={3}>
            {list.map((post) => (
              <Card>
                <p {...stylex.props(ui.small, ui.note)}>
                  <time dateTime={post.date}>{t.text("blog_date", { date: day(post.date) })}</time>
                </p>
                <h2 {...stylex.props(ui.title)}>
                  <a
                    {...stylex.props(ui.entry, ui.focusRing)}
                    href={href(locale, "blog", post.slug)}
                  >
                    {post.title}
                  </a>
                </h2>
                <p {...stylex.props(ui.prose)}>{post.description}</p>
                <p {...stylex.props(ui.small, ui.label, styles.author)}>
                  {authors[post.author].name}
                </p>
              </Card>
            ))}
          </Cards>
        )}
      </Content>
    </Page>
  );
}

export function PostPage({ post, ...props }: PageProps & { post: Post }) {
  const { assets, locale, path, alternates, shareImage } = props;
  const t = translators[locale];
  const author = authors[post.author];
  const url = `${origin}${path}`;
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: post.title }),
        description: post.description,
        shareImage,
        type: "article",
        index: true,
        mono: post.blocks.some((block) => block.type === "code"),
        italic: usesItalic(post.blocks),
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${url}#post`,
          url,
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          image: `${origin}${shareImage}`,
          author: { "@type": "Person", name: author.name },
          publisher: {
            "@id": `${origin}/#organization`,
            "@type": "Organization",
            name: company.name,
          },
          inLanguage: locale,
        },
        head: (
          <>
            <meta property="article:published_time" content={post.date} />
            <meta property="article:author" content={author.name} />
          </>
        ),
      }}
    >
      <Article
        title={post.title}
        note={t.text("blog_post_meta", {
          date: day(post.date),
          author: author.name,
          minutes: post.minutes,
        })}
      >
        <Markdown blocks={post.blocks} />
      </Article>
      <Closing locale={locale} />
    </Page>
  );
}

const styles = stylex.create({
  author: { marginTop: "auto", paddingTop: space.x1 },
});
